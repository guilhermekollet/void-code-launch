
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
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First, check users table for existing plan data
    const { data: userProfile, error: userProfileError } = await supabaseClient
      .from("users")
      .select("plan_type, billing_cycle, trial_start, trial_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (userProfileError) {
      logStep("Error fetching user profile", { error: userProfileError.message });
    }

    logStep("User profile data", userProfile);

    // Check Stripe if we have the key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("No Stripe key configured, using users table data");
      
      if (userProfile && userProfile.plan_type) {
        const isTrialActive = userProfile.trial_end ? new Date(userProfile.trial_end) > new Date() : false;
        const status = isTrialActive ? 'trialing' : 'active';

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

      // Default to basic plan if no data found
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
      logStep("No customer found in Stripe");
      
      // Use users table data if available
      if (userProfile && userProfile.plan_type) {
        logStep("Using users table data as fallback", userProfile);
        const isTrialActive = userProfile.trial_end ? new Date(userProfile.trial_end) > new Date() : false;
        return new Response(JSON.stringify({
          plan_type: userProfile.plan_type,
          billing_cycle: userProfile.billing_cycle || 'monthly',
          status: isTrialActive ? 'trialing' : 'active',
          current_period_end: userProfile.trial_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

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

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let planType = 'basic';
    let billingCycle = 'monthly';
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Determine plan_type and billing_cycle from Stripe
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      // Determine billing_cycle
      billingCycle = price.recurring?.interval === 'year' ? 'yearly' : 'monthly';
      
      // Determine plan_type based on amount - only basic or premium
      if (amount <= 1999) { // up to R$ 19,99
        planType = "basic";
      } else { // above R$ 19,99
        planType = "premium";
      }
      
      logStep("Determined subscription details from Stripe", { 
        priceId, 
        amount, 
        planType, 
        billingCycle,
        interval: price.recurring?.interval 
      });
    } else {
      logStep("No active subscription found in Stripe");
      
      // Use users table data as fallback when no active Stripe subscription
      if (userProfile && userProfile.plan_type) {
        planType = userProfile.plan_type;
        billingCycle = userProfile.billing_cycle || 'monthly';
        logStep("Using users table data as fallback for inactive subscription", { planType, billingCycle });
      }
    }

    logStep("Returning subscription info", { 
      planType, 
      billingCycle, 
      hasActiveSub, 
      subscriptionEnd 
    });
    
    return new Response(JSON.stringify({
      plan_type: planType,
      billing_cycle: billingCycle,
      status: hasActiveSub ? 'active' : 'inactive',
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
