
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MODIFY-SUBSCRIPTION] ${step}${detailsStr}`);
};

interface ModifySubscriptionParams {
  planType: 'basic' | 'premium';
  billingCycle: 'monthly' | 'yearly';
  action: 'upgrade' | 'downgrade' | 'change_cycle';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { planType, billingCycle, action }: ModifySubscriptionParams = await req.json();
    logStep("Modification request", { planType, billingCycle, action, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Find current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription, create new checkout
      const prices = {
        'basic-monthly': process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_basic_monthly',
        'basic-yearly': process.env.STRIPE_BASIC_YEARLY_PRICE_ID || 'price_basic_yearly',
        'premium-monthly': process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
        'premium-yearly': process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
      };

      const priceId = prices[`${planType}-${billingCycle}`];
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/configuracoes?success=true`,
        cancel_url: `${req.headers.get("origin")}/configuracoes?canceled=true`,
      });

      return new Response(JSON.stringify({ url: session.url, action: 'new_subscription' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Modify existing subscription
    const subscription = subscriptions.data[0];
    const currentPriceId = subscription.items.data[0].price.id;
    
    // Get target price ID (this would need to be configured with your actual Stripe price IDs)
    const targetPriceId = `price_${planType}_${billingCycle}`;
    
    logStep("Modifying subscription", { 
      subscriptionId: subscription.id,
      currentPriceId,
      targetPriceId,
      action 
    });

    // Update subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscription.items.data[0].id,
        price: targetPriceId,
      }],
      proration_behavior: 'create_prorations',
    });

    logStep("Subscription updated", { subscriptionId: updatedSubscription.id });

    // Update users table
    await supabaseClient
      .from("users")
      .update({
        plan_type: planType,
        billing_cycle: billingCycle,
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ 
      success: true, 
      action: 'subscription_modified',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        current_period_end: updatedSubscription.current_period_end
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in modify-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
