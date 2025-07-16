
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [SEND-MAGIC-LINK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { phoneNumber } = await req.json();
    
    logStep("Processing magic link request", { phoneNumber });
    
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
      logStep("User not found", { phoneNumber, error: userError?.message });
      return new Response(
        JSON.stringify({ 
          error: "Conta não encontrada", 
          message: "Não encontramos uma conta associada a este número. Cadastre-se primeiro para acessar o Bolsofy."
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    logStep("User found, sending magic link", { email: user.email, name: user.name });

    // Enviar magic link usando Supabase Auth
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        emailRedirectTo: `${req.headers.get('origin') || 'http://localhost:3000'}/`
      }
    });

    if (authError) {
      logStep("Error sending magic link", { error: authError.message });
      return new Response(
        JSON.stringify({ 
          error: "Erro ao enviar link", 
          message: "Não foi possível enviar o link de acesso. Tente novamente."
        }),
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

    const maskedEmail = maskEmail(user.email);
    
    logStep("Magic link sent successfully", { maskedEmail });

    return new Response(
      JSON.stringify({ 
        success: true, 
        maskedEmail: maskedEmail,
        message: "Link de acesso enviado com sucesso!"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    logStep("ERROR in send-magic-link", { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Erro interno", 
        message: "Erro interno do servidor. Tente novamente."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
