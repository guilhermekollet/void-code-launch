
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [HANDLE-NEW-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { record } = await req.json();
    if (!record || !record.email) {
      throw new Error("Invalid user record");
    }

    logStep("Processing new user", { 
      userId: record.id, 
      email: record.email 
    });

    // Criar cliente Supabase com service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verificar se existe assinatura no Stripe
    let planType = null;
    try {
      const stripeResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/check-existing-stripe-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({ email: record.email }),
        }
      );

      if (stripeResponse.ok) {
        const stripeData = await stripeResponse.json();
        planType = stripeData.plan_type;
        logStep("Stripe subscription check result", { planType });
      } else {
        logStep("Failed to check Stripe subscription", { 
          status: stripeResponse.status 
        });
      }
    } catch (error) {
      logStep("Error checking Stripe subscription", { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Criar registro do usuário na tabela users
    const userData = {
      user_id: record.id,
      email: record.email,
      phone_number: record.raw_user_meta_data?.phone_number || '',
      name: record.raw_user_meta_data?.name || '',
      completed_onboarding: false,
      plan_type: planType, // Será null se não encontrar assinatura no Stripe
    };

    logStep("Creating user record", userData);

    const { error } = await supabaseClient
      .from("users")
      .insert(userData);

    if (error) {
      logStep("Error creating user record", { error: error.message });
      throw error;
    }

    logStep("User record created successfully", { 
      userId: record.id,
      planType 
    });

    // Enviar email de boas-vindas
    try {
      logStep("Sending welcome email");
      
      const welcomeEmailResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-welcome-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            email: record.email,
            name: record.raw_user_meta_data?.name || 'Usuário',
            planType: planType || 'free'
          }),
        }
      );

      if (welcomeEmailResponse.ok) {
        logStep("Welcome email sent successfully");
      } else {
        logStep("Failed to send welcome email", { 
          status: welcomeEmailResponse.status 
        });
      }
    } catch (emailError) {
      logStep("Error sending welcome email", { 
        error: emailError instanceof Error ? emailError.message : String(emailError) 
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      plan_type: planType 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handle-new-user", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
