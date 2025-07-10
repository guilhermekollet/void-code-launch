
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface VerifyCodeRequest {
  phoneNumber: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, code }: VerifyCodeRequest = await req.json();
    
    console.log('Verifying code for phone:', phoneNumber);

    // Validate inputs
    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ error: 'Número de telefone e código são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the auth code from database
    const { data: authCode, error: codeError } = await supabase
      .from('auth_codes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('token', code)
      .single();

    if (codeError || !authCode) {
      console.log('Invalid code for phone:', phoneNumber);
      return new Response(
        JSON.stringify({ error: 'Código inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if code is expired
    const now = new Date();
    const expiresAt = new Date(authCode.expires_at);
    
    if (now > expiresAt) {
      // Delete expired code
      await supabase
        .from('auth_codes')
        .delete()
        .eq('id', authCode.id);
      
      return new Response(
        JSON.stringify({ error: 'Código expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create or get auth user
    let authUser;
    if (user.user_id && user.email) {
      // Try to sign in existing user
      const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email,
        options: {
          redirectTo: `${req.headers.get('origin') || 'http://localhost:3000'}/`
        }
      });

      if (signInError) {
        console.error('Error generating magic link:', signInError);
        throw new Error('Erro ao criar sessão de autenticação');
      }

      authUser = signInData.user;
    } else {
      // This shouldn't happen if user registration is properly implemented
      return new Response(
        JSON.stringify({ error: 'Dados de usuário incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete the used code
    await supabase
      .from('auth_codes')
      .delete()
      .eq('id', authCode.id);

    // Create session tokens manually for phone auth
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: true,
      user_metadata: {
        name: user.name,
        phone_number: user.phone_number
      }
    });

    if (sessionError && !sessionError.message.includes('already registered')) {
      console.error('Session creation error:', sessionError);
      throw new Error('Erro ao criar sessão');
    }

    // Generate access token for the user
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email
    });

    if (tokenError) {
      console.error('Token generation error:', tokenError);
      throw new Error('Erro ao gerar token de acesso');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Autenticação realizada com sucesso',
        user: {
          id: user.user_id,
          email: user.email,
          name: user.name,
          phone_number: user.phone_number
        },
        redirect_url: tokenData.properties?.action_link
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in verify-phone-code:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);
