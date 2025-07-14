
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
    logStep("Starting signature verification", { signatureLength: signature.length });
    
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
    
    if (!timestamp || !hash) {
      logStep("Missing timestamp or hash in signature", { timestamp: !!timestamp, hash: !!hash });
      return false;
    }
    
    const signedPayload = `${timestamp}.${payload}`;
    const expectedHashBuffer = await crypto.subtle.importKey(
      "raw", 
      Uint8Array.from(atob(hash), c => c.charCodeAt(0)), 
      { name: "HMAC", hash: "SHA-256" }, 
      false, 
      ["verify"]
    );
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload)),
      await crypto.subtle.exportKey("raw", expectedHashBuffer)
    );
    
    logStep("Signature verification result", { isValid });
    return isValid;
  } catch (error) {
    logStep("Signature verification error", { error: error.message });
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
    logStep("=== WEBHOOK STARTED ===");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    logStep("Environment check", { 
      hasStripeKey: !!stripeKey, 
      hasWebhookSecret: !!webhookSecret,
      webhookSecretPrefix: webhookSecret?.substring(0, 10)
    });
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("Missing Stripe signature header");
      throw new Error("Missing Stripe signature");
    }

    const body = await req.text();
    logStep("Received payload", { bodyLength: body.length });

    // Verify webhook signature
    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      logStep("Invalid webhook signature - rejecting request");
      throw new Error("Invalid webhook signature");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const event = JSON.parse(body);
    
    logStep("Processing event", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        logStep("Processing checkout session", { 
          sessionId: session.id,
          paymentStatus: session.payment_status,
          customerEmail: session.customer_email
        });

        // Get onboarding data
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding')
          .select('*')
          .eq('stripe_session_id', session.id)
          .single();

        if (onboardingError || !onboardingData) {
          logStep("Onboarding data not found", { sessionId: session.id, error: onboardingError });
          
          // Fallback: try to find by email if available
          if (session.customer_email) {
            logStep("Trying fallback search by email", { email: session.customer_email });
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('onboarding')
              .select('*')
              .eq('email', session.customer_email)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
              
            if (fallbackError || !fallbackData) {
              logStep("Fallback search failed", { error: fallbackError });
              break;
            }
            
            // Update with correct session_id
            await supabase
              .from('onboarding')
              .update({ stripe_session_id: session.id })
              .eq('id', fallbackData.id);
              
            onboardingData = { ...fallbackData, stripe_session_id: session.id };
            logStep("Found onboarding via email fallback", { onboardingId: fallbackData.id });
          } else {
            break;
          }
        }

        logStep("Found onboarding data", { 
          onboardingId: onboardingData.id,
          email: onboardingData.email,
          name: onboardingData.name
        });

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, user_id, email')
          .eq('email', onboardingData.email)
          .single();

        if (existingUser) {
          logStep("User already exists", { userId: existingUser.id, email: existingUser.email });
          
          // Just update payment confirmation
          await supabase
            .from('onboarding')
            .update({ 
              payment_confirmed: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', onboardingData.id);
            
          logStep("Updated existing user payment confirmation");
          break;
        }

        // Create auth user
        logStep("Creating auth user", { email: onboardingData.email });
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

        logStep("Auth user created successfully", { authUserId: authUser.user.id });

        // Calculate trial dates (7 days from now)
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);

        logStep("Trial dates calculated", { 
          trialStart: trialStart.toISOString(),
          trialEnd: trialEnd.toISOString()
        });

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

        logStep("User created successfully", { 
          userId: newUser.id,
          authUserId: authUser.user.id,
          email: onboardingData.email
        });

        // Update onboarding status - CRITICAL FIX
        const { error: updateError } = await supabase
          .from('onboarding')
          .update({ 
            payment_confirmed: true,
            trial_start_date: trialStart.toISOString(),
            trial_end_date: trialEnd.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', onboardingData.id);

        if (updateError) {
          logStep("Failed to update onboarding", { error: updateError });
        } else {
          logStep("Onboarding updated successfully with payment_confirmed = true");
        }

        logStep("=== CHECKOUT COMPLETED SUCCESSFULLY ===", {
          userId: newUser.id,
          email: onboardingData.email,
          paymentConfirmed: true
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

          logStep("Subscription updated successfully", { userId: userData.id, planType });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    logStep("=== WEBHOOK COMPLETED SUCCESSFULLY ===");
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("=== WEBHOOK ERROR ===", { message: errorMessage, stack: error.stack });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
