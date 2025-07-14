
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    logStep("🔐 Starting signature verification", { 
      signatureLength: signature.length,
      payloadLength: payload.length,
      secretPrefix: secret.substring(0, 10) + "..."
    });
    
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
      logStep("❌ Missing timestamp or hash in signature", { 
        signature,
        timestamp: !!timestamp, 
        hash: !!hash 
      });
      return false;
    }
    
    const signedPayload = `${timestamp}.${payload}`;
    const expectedHashBytes = new Uint8Array(
      Array.from(atob(hash)).map(char => char.charCodeAt(0))
    );
    
    const actualHashBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );
    const actualHashBytes = new Uint8Array(actualHashBuffer);
    
    // Compare hashes
    if (expectedHashBytes.length !== actualHashBytes.length) {
      logStep("❌ Hash length mismatch", { 
        expected: expectedHashBytes.length,
        actual: actualHashBytes.length
      });
      return false;
    }
    
    for (let i = 0; i < expectedHashBytes.length; i++) {
      if (expectedHashBytes[i] !== actualHashBytes[i]) {
        logStep("❌ Hash comparison failed at byte", { index: i });
        return false;
      }
    }
    
    logStep("✅ Signature verification successful", { 
      timestamp,
      hashLength: hash.length
    });
    return true;
  } catch (error) {
    logStep("💥 Signature verification error", { 
      error: error.message,
      errorType: error.constructor.name
    });
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    logStep("⚡ CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    logStep("🚀 === WEBHOOK STARTED ===", {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get("user-agent"),
      contentType: req.headers.get("content-type")
    });
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    logStep("🔧 Environment check", { 
      hasStripeKey: !!stripeKey, 
      hasWebhookSecret: !!webhookSecret,
      webhookSecretPrefix: webhookSecret?.substring(0, 15) + "...",
      supabaseUrl: Deno.env.get("SUPABASE_URL")?.substring(0, 30) + "..."
    });
    
    if (!stripeKey || !webhookSecret) {
      logStep("❌ Missing Stripe configuration");
      return new Response(JSON.stringify({ 
        error: "Stripe configuration missing" 
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("❌ Missing Stripe signature header", {
        headers: Object.fromEntries(req.headers.entries())
      });
      return new Response(JSON.stringify({ 
        error: "Missing Stripe signature" 
      }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    const body = await req.text();
    logStep("📨 Received payload", { 
      bodyLength: body.length,
      bodyPreview: body.substring(0, 200) + "...",
      signature: signature.substring(0, 50) + "..."
    });

    // Verify webhook signature
    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      logStep("🚫 Invalid webhook signature - rejecting request", {
        signature: signature.substring(0, 50) + "...",
        bodyHash: await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body)).then(
          hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
        )
      });
      return new Response(JSON.stringify({ 
        error: "Invalid signature" 
      }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const event = JSON.parse(body);
    
    logStep("🎯 Processing event", { 
      type: event.type, 
      id: event.id,
      created: new Date(event.created * 1000).toISOString(),
      livemode: event.livemode
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        logStep("💳 Processing checkout session", { 
          sessionId: session.id,
          paymentStatus: session.payment_status,
          customerEmail: session.customer_email,
          mode: session.mode,
          amountTotal: session.amount_total,
          currency: session.currency
        });

        // Get onboarding data
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding')
          .select('*')
          .eq('stripe_session_id', session.id)
          .single();

        if (onboardingError || !onboardingData) {
          logStep("⚠️ Onboarding data not found, trying fallback", { 
            sessionId: session.id, 
            error: onboardingError?.message,
            customerEmail: session.customer_email
          });
          
          // Fallback: try to find by email if available
          if (session.customer_email) {
            logStep("🔍 Trying fallback search by email", { email: session.customer_email });
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('onboarding')
              .select('*')
              .eq('email', session.customer_email)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
              
            if (fallbackError || !fallbackData) {
              logStep("❌ Fallback search failed", { 
                error: fallbackError?.message,
                email: session.customer_email
              });
              break;
            }
            
            // Update with correct session_id
            const { error: updateError } = await supabase
              .from('onboarding')
              .update({ stripe_session_id: session.id })
              .eq('id', fallbackData.id);
              
            if (updateError) {
              logStep("❌ Failed to update session_id", { error: updateError.message });
            } else {
              logStep("✅ Updated onboarding with session_id", { onboardingId: fallbackData.id });
            }
              
            Object.assign(fallbackData, { stripe_session_id: session.id });
            logStep("✅ Found onboarding via email fallback", { onboardingId: fallbackData.id });
          } else {
            logStep("❌ No customer email available for fallback");
            break;
          }
        }

        logStep("📋 Found onboarding data", { 
          onboardingId: onboardingData.id,
          email: onboardingData.email,
          name: onboardingData.name,
          selectedPlan: onboardingData.selected_plan,
          paymentConfirmed: onboardingData.payment_confirmed
        });

        // Check if user already exists
        const { data: existingUser, error: existingUserError } = await supabase
          .from('users')
          .select('id, user_id, email')
          .eq('email', onboardingData.email)
          .single();

        if (existingUserError && existingUserError.code !== 'PGRST116') {
          logStep("❌ Error checking existing user", { error: existingUserError.message });
        }

        if (existingUser) {
          logStep("👤 User already exists", { 
            userId: existingUser.id, 
            email: existingUser.email,
            authUserId: existingUser.user_id
          });
          
          // Just update payment confirmation
          const { error: updateError } = await supabase
            .from('onboarding')
            .update({ 
              payment_confirmed: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', onboardingData.id);
            
          if (updateError) {
            logStep("❌ Failed to update payment confirmation", { error: updateError.message });
          } else {
            logStep("✅ Updated existing user payment confirmation");
          }
          break;
        }

        // Create auth user
        logStep("👨‍💼 Creating auth user", { 
          email: onboardingData.email,
          phone: onboardingData.phone,
          name: onboardingData.name
        });
        
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
          logStep("💥 Failed to create auth user", { 
            error: authError?.message,
            errorCode: authError?.status,
            email: onboardingData.email
          });
          break;
        }

        logStep("✅ Auth user created successfully", { 
          authUserId: authUser.user.id,
          email: authUser.user.email
        });

        // Calculate trial dates (7 days from now)
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);

        logStep("📅 Trial dates calculated", { 
          trialStart: trialStart.toISOString(),
          trialEnd: trialEnd.toISOString(),
          durationDays: 7
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
          logStep("💥 Failed to create user in public.users table", { 
            error: userError.message,
            errorCode: userError.code,
            errorDetails: userError.details
          });
          
          // Clean up auth user
          try {
            await supabase.auth.admin.deleteUser(authUser.user.id);
            logStep("🧹 Cleaned up auth user after failed user creation");
          } catch (cleanupError) {
            logStep("⚠️ Failed to cleanup auth user", { error: cleanupError });
          }
          break;
        }

        logStep("✅ User created successfully in public.users table", { 
          userId: newUser.id,
          authUserId: authUser.user.id,
          email: onboardingData.email,
          planType: onboardingData.selected_plan
        });

        // Update onboarding status - CRITICAL STEP
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
          logStep("💥 CRITICAL: Failed to update onboarding payment_confirmed", { 
            error: updateError.message,
            onboardingId: onboardingData.id
          });
        } else {
          logStep("🎉 CRITICAL SUCCESS: Onboarding updated with payment_confirmed = true", {
            onboardingId: onboardingData.id,
            paymentConfirmed: true
          });
        }

        logStep("🎊 === CHECKOUT COMPLETED SUCCESSFULLY ===", {
          userId: newUser.id,
          authUserId: authUser.user.id,
          email: onboardingData.email,
          paymentConfirmed: true,
          trialStart: trialStart.toISOString(),
          trialEnd: trialEnd.toISOString()
        });
        break;
      }

      case "customer.subscription.created":
      case "invoice.payment_succeeded": {
        const subscription = event.type === "customer.subscription.created" 
          ? event.data.object 
          : event.data.object.subscription;
        
        if (!subscription) {
          logStep("⚠️ No subscription data found in event");
          break;
        }

        logStep("📊 Processing subscription event", { 
          type: event.type, 
          subscriptionId: typeof subscription === 'string' ? subscription : subscription.id,
          status: typeof subscription === 'object' ? subscription.status : 'unknown'
        });

        // Get full subscription if we only have ID
        const fullSubscription = typeof subscription === 'string' 
          ? await stripe.subscriptions.retrieve(subscription)
          : subscription;

        const customer = await stripe.customers.retrieve(fullSubscription.customer);
        if (customer.deleted || !customer.email) {
          logStep("⚠️ Customer deleted or no email", { 
            customerId: fullSubscription.customer,
            deleted: customer.deleted
          });
          break;
        }

        logStep("👤 Processing subscription for customer", {
          customerId: customer.id,
          email: customer.email,
          subscriptionStatus: fullSubscription.status
        });

        // Update user subscription data
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('id')
          .eq('email', customer.email)
          .single();

        if (userDataError || !userData) {
          logStep("⚠️ User not found for subscription update", { 
            email: customer.email,
            error: userDataError?.message
          });
          break;
        }

        // Determine plan type from price
        const priceId = fullSubscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        
        let planType = "basic";
        if (amount === 2990 || amount === 28990) {
          planType = "premium";
        }

        logStep("💰 Determined plan type", { 
          priceId, 
          amount, 
          planType,
          currency: price.currency
        });

        // Update subscriptions table
        const { error: subscriptionUpdateError } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: userData.id,
            plan_type: planType,
            status: fullSubscription.status,
            current_period_start: new Date(fullSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(fullSubscription.current_period_end * 1000).toISOString(),
            stripe_customer_id: fullSubscription.customer,
            stripe_subscription_id: fullSubscription.id,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (subscriptionUpdateError) {
          logStep("❌ Failed to update subscription", { 
            error: subscriptionUpdateError.message,
            userId: userData.id
          });
        } else {
          logStep("✅ Subscription updated successfully", { 
            userId: userData.id, 
            planType,
            status: fullSubscription.status
          });
        }
        break;
      }

      default:
        logStep("❓ Unhandled event type", { 
          type: event.type,
          id: event.id
        });
    }

    logStep("🏁 === WEBHOOK COMPLETED SUCCESSFULLY ===", {
      eventType: event.type,
      eventId: event.id,
      processingTime: Date.now()
    });
    
    return new Response(JSON.stringify({ received: true }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 === WEBHOOK ERROR ===", { 
      message: errorMessage, 
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });
    
    return new Response(JSON.stringify({ 
      error: "Webhook processing failed",
      details: errorMessage 
    }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
