
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber } = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Buscar usuário pelo número de telefone
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('phone_number', phoneNumber)
      .single();

    if (userError || !user || !user.email) {
      return new Response(
        JSON.stringify({ error: "Conta não encontrada com este número" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Enviar magic link usando Supabase Auth
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        emailRedirectTo: `${req.headers.get('origin') || 'http://localhost:3000'}/`
      }
    });

    if (authError) {
      console.error('Error sending magic link:', authError);
      return new Response(
        JSON.stringify({ error: "Erro ao enviar link de acesso" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Mascarar o email para exibição
    const maskEmail = (email: string) => {
      const [localPart, domain] = email.split('@');
      if (localPart.length <= 3) {
        return `***@${domain}`;
      }
      const visiblePart = localPart.slice(-2);
      return `***${visiblePart}@${domain}`;
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        maskedEmail: maskEmail(user.email),
        message: "Link de acesso enviado para o seu email!"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
