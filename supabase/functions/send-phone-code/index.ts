
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface SendCodeRequest {
  phoneNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber }: SendCodeRequest = await req.json();
    
    console.log('Sending code to phone:', phoneNumber);

    // Validate phone number format (should be numeric only)
    if (!phoneNumber || !/^\d+$/.test(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: 'Número de telefone inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists with this phone number
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (userError || !user) {
      console.log('User not found for phone:', phoneNumber);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado com este número de telefone' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    console.log('Generated code:', code);

    // Set expiration to 5 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Delete any existing codes for this phone number
    await supabase
      .from('auth_codes')
      .delete()
      .eq('phone_number', phoneNumber);

    // Store the code in database
    const { error: insertError } = await supabase
      .from('auth_codes')
      .insert({
        phone_number: phoneNumber,
        token: code,
        expires_at: expiresAt.toISOString(),
        user_id: user.user_id
      });

    if (insertError) {
      console.error('Error inserting auth code:', insertError);
      throw new Error('Erro ao salvar código de verificação');
    }

    // Send email with code
    if (user.email) {
      const formatPhoneForDisplay = (phone: string) => {
        if (phone.startsWith('55')) {
          const number = phone.substring(2);
          if (number.length === 11) {
            return `+55 (${number.substring(0, 2)}) ${number.substring(2, 7)}-${number.substring(7)}`;
          }
        }
        return `+${phone}`;
      };

      const emailResponse = await resend.emails.send({
        from: "Bolsofy <noreply@bolsofy.com>",
        to: [user.email],
        subject: "Seu código de acesso - Bolsofy",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: #61710C; margin-bottom: 20px;">Bolsofy</h1>
              <h2 style="color: #333; margin-bottom: 20px;">Seu código de acesso</h2>
              <p style="color: #666; margin-bottom: 30px;">
                Use o código abaixo para acessar sua conta associada ao número ${formatPhoneForDisplay(phoneNumber)}:
              </p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #61710C; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Este código expira em 5 minutos.
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Se você não solicitou este código, ignore este email.
              </p>
            </div>
          </div>
        `,
      });

      console.log('Email sent:', emailResponse);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Código enviado por email' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-phone-code:', error);
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
