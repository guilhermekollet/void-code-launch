
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_SECRET"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  planType?: string;
}

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [SEND-WELCOME-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email, name, planType }: WelcomeEmailRequest = await req.json();
    
    if (!email || !name) {
      logStep("Missing required fields", { email: !!email, name: !!name });
      return new Response(
        JSON.stringify({ error: "Email e nome são obrigatórios" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    logStep("Sending welcome email", { email, name, planType });

    const planText = planType === 'premium' ? 'Premium' : planType === 'free' ? 'Gratuito' : 'Premium';
    
    const emailResponse = await resend.emails.send({
      from: "Bolsofy <noreply@bolsofy.com>",
      to: [email],
      subject: "Bem-vindo ao Bolsofy! 🎉",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #61710C 0%, #4a5709 100%); color: white; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Bem-vindo ao Bolsofy!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Sua jornada financeira começa agora</p>
          </div>
          
          <div style="padding: 40px 30px; background: white; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 18px; margin-bottom: 20px;">Olá, ${name}!</p>
            
            <p style="margin-bottom: 20px;">
              Que alegria ter você conosco! Sua conta foi criada com sucesso e você agora tem acesso ao plano <strong>${planText}</strong>.
            </p>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #61710C;">
              <h3 style="margin-top: 0; color: #61710C;">🚀 Comece agora mesmo:</h3>
              <ul style="margin: 15px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Adicione suas primeiras receitas e despesas</li>
                <li style="margin-bottom: 8px;">Configure suas categorias personalizadas</li>
                <li style="margin-bottom: 8px;">Acompanhe seus gastos recorrentes</li>
                <li style="margin-bottom: 8px;">Visualize relatórios detalhados</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://dashboard.bolsofy.com" 
                 style="display: inline-block; background: #61710C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Acessar Dashboard
              </a>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
              Dúvidas? Precisa de ajuda? Entre em contato conosco pelo WhatsApp: 
              <a href="https://wa.me/5551992527815" style="color: #61710C; text-decoration: none;">+55 51 99252-7815</a>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              Com carinho,<br>
              <strong>Equipe Bolsofy</strong>
            </p>
          </div>
        </div>
      `,
    });

    logStep("Email sent successfully", { messageId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        message: "Email de boas-vindas enviado com sucesso!" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    logStep("ERROR in send-welcome-email", { 
      message: error.message,
      stack: error.stack 
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Erro ao enviar email de boas-vindas",
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
