
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's internal ID
    const { data: internalUser } = await supabaseClient
      .from('users')
      .select('id, plan_type, completed_onboarding')
      .eq('user_id', user.id)
      .single();

    if (!internalUser) {
      logStep("No internal user found, returning free plan");
      return new Response(JSON.stringify({ 
        plan_type: "free",
        status: "active",
        current_period_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, updating to free plan");
      
      // Update both users and subscriptions tables
      await supabaseClient.from("users").update({
        plan_type: "free",
        completed_onboarding: true, // Mark as completed if they have user record
      }).eq("id", internalUser.id);

      await supabaseClient.from("subscriptions").upsert({
        user_id: internalUser.id,
        plan_type: "free",
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({ 
        plan_type: "free",
        status: "active",
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

    let planType = "free";
    let status = "active";
    let currentPeriodEnd = null;
    let currentPeriodStart = null;
    let stripeSubscriptionId = null;

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0].price.id;
      
      // Map price IDs to plan types based on the Stripe checkout URLs
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      // Basic plans: R$ 19,90 (1990 cents) monthly, R$ 199,90 (19990 cents) yearly
      // Premium plans: R$ 29,90 (2990 cents) monthly, R$ 289,90 (28990 cents) yearly
      if (amount === 1990 || amount === 19990) {
        planType = "basic";
      } else if (amount === 2990 || amount === 28990) {
        planType = "premium";
      } else {
        // Fallback to basic for any paid subscription
        planType = "basic";
      }
      
      status = subscription.status;
      currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
      stripeSubscriptionId = subscription.id;
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        startDate: currentPeriodStart,
        endDate: currentPeriodEnd,
        planType,
        amount 
      });
    } else {
      logStep("No active subscription found, defaulting to free");
    }

    // Update both users and subscriptions tables with complete data synchronization
    const updateData = {
      plan_type: planType,
      completed_onboarding: true, // Always mark as completed for users with valid accounts
    };

    await supabaseClient.from("users").update(updateData).eq("id", internalUser.id);

    await supabaseClient.from("subscriptions").upsert({
      user_id: internalUser.id,
      plan_type: planType,
      status: status,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscriptionId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    logStep("Updated both users and subscriptions tables", { planType, status });
    
    return new Response(JSON.stringify({
      plan_type: planType,
      status: status,
      current_period_end: currentPeriodEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
