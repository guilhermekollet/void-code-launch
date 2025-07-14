
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

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
      logStep("ERROR: Missing Stripe configuration", { stripeKey: !!stripeKey, webhookSecret: !!webhookSecret });
      throw new Error("Missing Stripe configuration");
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR: Missing Stripe signature");
      throw new Error("Missing Stripe signature");
    }

    const body = await req.text();
    logStep("Payload received", { bodyLength: body.length });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified successfully", { eventType: event.type, eventId: event.id });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
    
    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        logStep("Processing checkout session", { 
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          customerEmail: session.customer_details?.email
        });

        // Get onboarding data using session_id
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding')
          .select('*')
          .eq('stripe_session_id', session.id)
          .single();

        if (onboardingError || !onboardingData) {
          logStep("Onboarding data not found", { 
            sessionId: session.id, 
            error: onboardingError?.message || 'No data found' 
          });
          // Try to find by customer email as fallback
          if (session.customer_details?.email) {
            const { data: fallbackData } = await supabase
              .from('onboarding')
              .select('*')
              .eq('email', session.customer_details.email)
              .is('payment_confirmed', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (fallbackData) {
              logStep("Found onboarding data by email fallback", { email: session.customer_details.email });
              // Update with session_id
              await supabase
                .from('onboarding')
                .update({ stripe_session_id: session.id })
                .eq('id', fallbackData.id);
              // Use fallback data
              onboardingData = fallbackData;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        logStep("Found onboarding data", { 
          onboardingId: onboardingData.id,
          email: onboardingData.email,
          name: onboardingData.name,
          currentStage: onboardingData.registration_stage,
          paymentConfirmed: onboardingData.payment_confirmed
        });

        // Check if user already exists in auth.users
        const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
        const userExists = existingAuthUser.users.find(u => u.email === onboardingData.email);

        if (userExists) {
          logStep("Auth user already exists", { userId: userExists.id, email: onboardingData.email });
          
          // Check if user exists in public.users table
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, user_id')
            .eq('email', onboardingData.email)
            .single();

          if (existingUser) {
            logStep("User already exists in public.users table", { userId: existingUser.id });
            
            // Update payment confirmation
            await supabase
              .from('onboarding')
              .update({ 
                payment_confirmed: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', onboardingData.id);

            logStep("Updated payment confirmation for existing user");
            break;
          }
        }

        // Calculate trial dates (7 days from now)
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);

        let authUserId = userExists?.id;

        // Create auth user if doesn't exist
        if (!userExists) {
          logStep("Creating new auth user", { email: onboardingData.email });
          
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
            logStep("Failed to create auth user", { error: authError?.message });
            break;
          }

          authUserId = authUser.user.id;
          logStep("Auth user created successfully", { authUserId });
        }

        // Create user in public.users table
        logStep("Creating user in public.users table", { authUserId, email: onboardingData.email });
        
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert([{
            user_id: authUserId,
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
          logStep("Failed to create user in public.users", { error: userError.message });
          // If user creation fails and we created the auth user, clean it up
          if (!userExists && authUserId) {
            await supabase.auth.admin.deleteUser(authUserId);
            logStep("Cleaned up auth user after failed public.users creation");
          }
          break;
        }

        // Update onboarding status to confirmed
        const { error: updateError } = await supabase
          .from('onboarding')
          .update({ 
            payment_confirmed: true,
            trial_start_date: trialStart.toISOString(),
            trial_end_date: trialEnd.toISOString(),
            registration_stage: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', onboardingData.id);

        if (updateError) {
          logStep("Failed to update onboarding status", { error: updateError.message });
        } else {
          logStep("Onboarding status updated successfully");
        }

        logStep("User created successfully", { 
          userId: newUser.id, 
          authUserId: authUserId,
          email: onboardingData.email,
          planType: onboardingData.selected_plan
        });
        break;
      }

      case "customer.subscription.created":
      case "invoice.payment_succeeded": {
        const subscription = event.type === "customer.subscription.created" 
          ? event.data.object 
          : event.data.object.subscription;
        
        if (!subscription) {
          logStep("No subscription found in event");
          break;
        }

        logStep("Processing subscription event", { 
          type: event.type, 
          subscriptionId: typeof subscription === 'string' ? subscription : subscription.id 
        });

        // Get full subscription if we only have ID
        const fullSubscription = typeof subscription === 'string' 
          ? await stripe.subscriptions.retrieve(subscription)
          : subscription;

        const customer = await stripe.customers.retrieve(fullSubscription.customer);
        if (customer.deleted || !customer.email) {
          logStep("Invalid customer data", { customerId: fullSubscription.customer });
          break;
        }

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
          const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
            user_id: userData.id,
            plan_type: planType,
            status: fullSubscription.status,
            current_period_start: new Date(fullSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(fullSubscription.current_period_end * 1000).toISOString(),
            stripe_customer_id: fullSubscription.customer,
            stripe_subscription_id: fullSubscription.id,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          if (subscriptionError) {
            logStep("Failed to update subscription", { error: subscriptionError.message });
          } else {
            logStep("Subscription updated successfully", { userId: userData.id, planType });
          }
        } else {
          logStep("User not found for subscription update", { email: customer.email });
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
    logStep("ERROR in webhook", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
