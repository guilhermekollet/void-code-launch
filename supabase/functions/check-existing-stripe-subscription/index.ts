
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [CHECK-EXISTING-STRIPE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email } = await req.json();
    if (!email) {
      throw new Error("Email is required");
    }

    logStep("Checking existing subscription for email", { email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("No Stripe key configured, returning null");
      return new Response(JSON.stringify({ plan_type: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Buscar customer no Stripe
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found for email", { email });
      return new Response(JSON.stringify({ plan_type: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Buscar assinaturas ativas
    const validStatuses = ["active", "trialing", "past_due"];
    let bestSubscription = null;
    let bestPlanType = null;

    for (const status of validStatuses) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: status,
        limit: 10,
      });
      
      logStep(`Checking subscriptions with status: ${status}`, { 
        found: subscriptions.data.length 
      });
      
      for (const subscription of subscriptions.data) {
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        
        // Determinar plan_type baseado no valor
        let planType = "basic";
        if (amount > 1999) { // acima de R$ 19,99
          planType = "premium";
        }
        
        logStep("Found subscription", {
          subscriptionId: subscription.id,
          status: subscription.status,
          amount,
          planType,
          priceId
        });
        
        // Priorizar premium sobre basic
        if (planType === "premium" || bestPlanType === null) {
          bestSubscription = subscription;
          bestPlanType = planType;
        }
        
        // Se já encontrou premium, não precisa continuar
        if (planType === "premium") {
          break;
        }
      }
      
      // Se já encontrou premium, não precisa verificar outros status
      if (bestPlanType === "premium") {
        break;
      }
    }

    if (bestSubscription) {
      logStep("Best subscription found", {
        subscriptionId: bestSubscription.id,
        planType: bestPlanType,
        status: bestSubscription.status
      });
      
      return new Response(JSON.stringify({ 
        plan_type: bestPlanType,
        subscription_id: bestSubscription.id,
        status: bestSubscription.status
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("No active subscription found");
    return new Response(JSON.stringify({ plan_type: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-existing-stripe-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      plan_type: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
