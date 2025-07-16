

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // PRIMEIRO: Verificar dados na tabela users (dados locais)
    try {
      const { data: userProfile, error: userProfileError } = await supabaseClient
        .from("users")
        .select("plan_type, billing_cycle, trial_start, trial_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (userProfileError) {
        logStep("Error fetching user profile", { error: userProfileError.message });
      }

      if (userProfile && userProfile.plan_type) {
        logStep("Found user profile data with plan", userProfile);
        
        // Verificar se o trial está ativo
        const isTrialActive = userProfile.trial_end ? new Date(userProfile.trial_end) > new Date() : false;
        logStep("Trial status check", { 
          trial_end: userProfile.trial_end, 
          isTrialActive,
          current_time: new Date().toISOString()
        });
        
        // Se tem plano definido na tabela users e está em trial ativo, usar essa informação
        if (userProfile.plan_type !== 'free' && (userProfile.plan_type !== 'basic' || isTrialActive)) {
          const status = isTrialActive ? 'trialing' : 'active';

          logStep("Using user profile data as primary source (trial active or premium plan)", {
            planType: userProfile.plan_type,
            billingCycle: userProfile.billing_cycle,
            status: status,
            trialEnd: userProfile.trial_end,
            isTrialActive
          });

          return new Response(JSON.stringify({
            plan_type: userProfile.plan_type,
            billing_cycle: userProfile.billing_cycle || 'monthly',
            status: status,
            current_period_end: userProfile.trial_end
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    } catch (error) {
      logStep("Error querying user profile", { error: error.message });
    }

    // SEGUNDO: Verificar Stripe (fonte secundária para validação)
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("No Stripe key configured, using user profile fallback");
      
      return new Response(JSON.stringify({
        plan_type: 'basic',
        billing_cycle: 'monthly',
        status: 'active',
        current_period_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Stripe key verified, checking Stripe subscription");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found in Stripe, returning basic plan");
      return new Response(JSON.stringify({
        plan_type: 'basic',
        billing_cycle: 'monthly',
        status: 'active',
        current_period_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Buscar assinaturas com múltiplos status válidos (incluindo trialing)
    const validStatuses = ["active", "trialing", "past_due"];
    let activeSubscription = null;
    
    for (const status of validStatuses) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: status,
        limit: 1,
      });
      
      logStep(`Checking subscriptions with status: ${status}`, { 
        found: subscriptions.data.length,
        subscriptions: subscriptions.data.map(s => ({
          id: s.id,
          status: s.status,
          current_period_end: s.current_period_end
        }))
      });
      
      if (subscriptions.data.length > 0) {
        activeSubscription = subscriptions.data[0];
        logStep(`Found subscription with status: ${status}`, { 
          subscriptionId: activeSubscription.id,
          subscriptionStatus: activeSubscription.status
        });
        break;
      }
    }
    
    const hasActiveSub = activeSubscription !== null;
    let planType = 'basic';
    let billingCycle = 'monthly';
    let subscriptionEnd = null;

    if (hasActiveSub && activeSubscription) {
      subscriptionEnd = new Date(activeSubscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { 
        subscriptionId: activeSubscription.id, 
        status: activeSubscription.status,
        endDate: subscriptionEnd 
      });
      
      // Determinar plan_type e billing_cycle do Stripe
      const priceId = activeSubscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      // Determinar billing_cycle
      billingCycle = price.recurring?.interval === 'year' ? 'yearly' : 'monthly';
      
      // Determinar plan_type baseado no valor - só básico ou premium
      if (amount <= 1999) { // até R$ 19,99
        planType = "basic";
      } else { // acima de R$ 19,99
        planType = "premium";
      }
      
      logStep("Determined subscription details from Stripe", { 
        priceId, 
        amount, 
        planType, 
        billingCycle,
        interval: price.recurring?.interval,
        subscriptionStatus: activeSubscription.status
      });
    } else {
      logStep("No active subscription found in Stripe, defaulting to basic");
    }

    logStep("Returning subscription info", { 
      planType, 
      billingCycle, 
      hasActiveSub, 
      subscriptionEnd,
      subscriptionStatus: activeSubscription?.status || 'none'
    });
    
    return new Response(JSON.stringify({
      plan_type: planType,
      billing_cycle: billingCycle,
      status: hasActiveSub ? (activeSubscription?.status || 'active') : 'active',
      current_period_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      plan_type: 'basic',
      billing_cycle: 'monthly',
      status: 'active',
      current_period_end: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

