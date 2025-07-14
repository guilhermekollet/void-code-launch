
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];
    
    if (!timestamp || !hash) return false;
    
    const signedPayload = `${timestamp}.${payload}`;
    const expectedHash = await crypto.subtle.verify(
      "HMAC",
      key,
      new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(signedPayload))),
      new Uint8Array(Array.from(atob(hash)).map(c => c.charCodeAt(0)))
    );
    
    return expectedHash;
  } catch (error) {
    logStep("Signature verification failed", { error: error.message });
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing Stripe signature");
    }

    const body = await req.text();
    logStep("Payload received", { bodyLength: body.length });

    // Verify webhook signature
    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      throw new Error("Invalid webhook signature");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const event = JSON.parse(body);
    
    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        logStep("Processing checkout session", { sessionId: session.id });

        // Get onboarding data
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding')
          .select('*')
          .eq('stripe_session_id', session.id)
          .single();

        if (onboardingError || !onboardingData) {
          logStep("Onboarding data not found", { sessionId: session.id, error: onboardingError });
          break;
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, user_id')
          .eq('email', onboardingData.email)
          .single();

        if (existingUser) {
          logStep("User already exists", { userId: existingUser.id });
          break;
        }

        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: onboardingData.email,
          phone: onboardingData.phone,
          user_metadata: {
            name: onboardingData.name,
            phone_number: onboardingData.phone
          },
          email_confirm: true
        });

        if (authError || !authUser.user) {
          logStep("Failed to create auth user", { error: authError });
          break;
        }

        // Calculate trial dates (7 days from now)
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);

        // Create user in public.users table
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert([{
            user_id: authUser.user.id,
            name: onboardingData.name,
            email: onboardingData.email,
            phone_number: onboardingData.phone,
            plan_type: onboardingData.selected_plan,
            stripe_session_id: onboardingData.stripe_session_id,
            trial_start: trialStart.toISOString(),
            trial_end: trialEnd.toISOString(),
            completed_onboarding: true
          }])
          .select()
          .single();

        if (userError) {
          logStep("Failed to create user", { error: userError });
          // Clean up auth user
          await supabase.auth.admin.deleteUser(authUser.user.id);
          break;
        }

        // Update onboarding status
        await supabase
          .from('onboarding')
          .update({ 
            payment_confirmed: true,
            trial_start_date: trialStart.toISOString(),
            trial_end_date: trialEnd.toISOString()
          })
          .eq('id', onboardingData.id);

        logStep("User created successfully", { 
          userId: newUser.id, 
          authUserId: authUser.user.id,
          email: onboardingData.email 
        });
        break;
      }

      case "customer.subscription.created":
      case "invoice.payment_succeeded": {
        const subscription = event.type === "customer.subscription.created" 
          ? event.data.object 
          : event.data.object.subscription;
        
        if (!subscription) break;

        logStep("Processing subscription event", { 
          type: event.type, 
          subscriptionId: typeof subscription === 'string' ? subscription : subscription.id 
        });

        // Get full subscription if we only have ID
        const fullSubscription = typeof subscription === 'string' 
          ? await stripe.subscriptions.retrieve(subscription)
          : subscription;

        const customer = await stripe.customers.retrieve(fullSubscription.customer);
        if (customer.deleted || !customer.email) break;

        // Update user subscription data
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', customer.email)
          .single();

        if (userData) {
          // Determine plan type from price
          const priceId = fullSubscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          const amount = price.unit_amount || 0;
          
          let planType = "basic";
          if (amount === 2990 || amount === 28990) {
            planType = "premium";
          }

          // Update subscriptions table
          await supabase.from("subscriptions").upsert({
            user_id: userData.id,
            plan_type: planType,
            status: fullSubscription.status,
            current_period_start: new Date(fullSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(fullSubscription.current_period_end * 1000).toISOString(),
            stripe_customer_id: fullSubscription.customer,
            stripe_subscription_id: fullSubscription.id,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          logStep("Subscription updated", { userId: userData.id, planType });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
