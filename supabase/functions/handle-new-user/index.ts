
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

    // Verificar se existe dados de onboarding ou assinatura no Stripe
    let planType = null;
    let billingCycle = null;
    let trialStart = null;
    let trialEnd = null;
    let stripeSessionId = null;

    try {
      // Primeiro, verificar se há dados de onboarding para este email
      const { data: onboardingData, error: onboardingError } = await supabaseClient
        .from('onboarding')
        .select('*')
        .eq('email', record.email)
        .eq('payment_confirmed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!onboardingError && onboardingData) {
        logStep("Found onboarding data", { 
          selectedPlan: onboardingData.selected_plan,
          billingCycle: onboardingData.billing_cycle 
        });
        
        planType = onboardingData.selected_plan;
        billingCycle = onboardingData.billing_cycle;
        stripeSessionId = onboardingData.stripe_session_id;
        
        // Se há dados de trial no onboarding, usar eles
        if (onboardingData.trial_start_date && onboardingData.trial_end_date) {
          trialStart = onboardingData.trial_start_date;
          trialEnd = onboardingData.trial_end_date;
        } else {
          // Se não há dados de trial, criar trial de 3 dias
          const now = new Date();
          trialStart = now.toISOString();
          trialEnd = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString();
        }
      } else {
        // Se não há onboarding, verificar assinatura no Stripe
        logStep("No onboarding data found, checking Stripe subscription");
        
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
          billingCycle = stripeData.billing_cycle;
          logStep("Stripe subscription check result", { planType, billingCycle });
        } else {
          logStep("Failed to check Stripe subscription", { 
            status: stripeResponse.status 
          });
        }
      }
    } catch (error) {
      logStep("Error checking onboarding/Stripe data", { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Criar registro do usuário na tabela users
    const userData = {
      user_id: record.id,
      email: record.email,
      phone_number: record.raw_user_meta_data?.phone_number || '',
      name: record.raw_user_meta_data?.name || '',
      completed_onboarding: !!planType, // true se tem plano, false se não
      plan_type: planType,
      billing_cycle: billingCycle,
      trial_start: trialStart,
      trial_end: trialEnd,
      stripe_session_id: stripeSessionId,
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
      planType,
      billingCycle 
    });

    // Enviar email de boas-vindas se tiver dados de plano
    if (planType) {
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
              planType: planType
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
    }

    return new Response(JSON.stringify({ 
      success: true,
      plan_type: planType,
      billing_cycle: billingCycle 
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
