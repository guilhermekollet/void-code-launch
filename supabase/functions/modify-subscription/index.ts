
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
  console.log(`[${timestamp}] [MODIFY-SUBSCRIPTION] ${step}${detailsStr}`);
};

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
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planType, billingCycle } = await req.json();
    logStep("Request data", { planType, billingCycle });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Encontrar cliente no Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found");
    }
    
    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Encontrar assinatura ativa
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found");
    }

    const subscription = subscriptions.data[0];
    logStep("Found active subscription", { subscriptionId: subscription.id });

    // Determinar novo preço baseado no plano e ciclo
    let newPriceAmount;
    if (planType === 'basic') {
      newPriceAmount = billingCycle === 'yearly' ? 19990 : 1990; // R$ 199,90/ano ou R$ 19,90/mês
    } else if (planType === 'premium') {
      newPriceAmount = billingCycle === 'yearly' ? 28990 : 2990; // R$ 289,90/ano ou R$ 29,90/mês
    } else {
      throw new Error("Invalid plan type");
    }

    // Criar novo preço no Stripe
    const newPrice = await stripe.prices.create({
      unit_amount: newPriceAmount,
      currency: 'brl',
      recurring: {
        interval: billingCycle === 'yearly' ? 'year' : 'month',
      },
      product_data: {
        name: `Plano ${planType === 'basic' ? 'Básico' : 'Premium'} ${billingCycle === 'yearly' ? 'Anual' : 'Mensal'}`,
      },
    });

    logStep("Created new price", { priceId: newPrice.id, amount: newPriceAmount });

    // Atualizar assinatura com pro-rata
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPrice.id,
      }],
      proration_behavior: 'create_prorations',
    });

    logStep("Updated subscription", { subscriptionId: updatedSubscription.id });

    // Atualizar dados na tabela users
    await supabaseClient
      .from('users')
      .update({
        plan_type: planType,
        billing_cycle: billingCycle,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    logStep("Updated user data in database");

    return new Response(JSON.stringify({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        plan_type: planType,
        billing_cycle: billingCycle,
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
