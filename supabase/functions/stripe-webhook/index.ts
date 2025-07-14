
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    logStep("🎯 === STRIPE WEBHOOK STARTED ===");
    
    const signature = req.headers.get("Stripe-Signature");
    if (!signature) {
      logStep("❌ Missing Stripe signature");
      return new Response("Missing Stripe signature", { status: 400 });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("❌ STRIPE_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("✅ Webhook signature verified", { eventType: event.type, eventId: event.id });
    } catch (err) {
      logStep("❌ Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    logStep("🎫 Processing webhook event", { 
      type: event.type, 
      id: event.id,
      created: new Date(event.created * 1000).toISOString()
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      logStep("💳 Processing checkout.session.completed", {
        sessionId: session.id,
        customerEmail: session.customer_email,
        paymentStatus: session.payment_status,
        mode: session.mode,
        amountTotal: session.amount_total
      });

      if (session.payment_status === "paid") {
        // Buscar dados do onboarding pelo session_id
        let { data: onboardingData, error: onboardingError } = await supabase
          .from("onboarding")
          .select("*")
          .eq("stripe_session_id", session.id)
          .single();

        if (onboardingError && session.customer_email) {
          logStep("⚠️ Onboarding not found by session_id, trying email fallback", { 
            sessionId: session.id,
            customerEmail: session.customer_email,
            error: onboardingError.message
          });
          
          // Fallback: buscar por email
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("onboarding")
            .select("*")
            .eq("email", session.customer_email)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
            
          if (fallbackError) {
            logStep("❌ Email fallback also failed", { 
              email: session.customer_email,
              error: fallbackError.message
            });
            return new Response("Onboarding data not found", { status: 404 });
          }
          
          onboardingData = fallbackData;
          
          // Atualizar com o session_id correto
          const { error: updateError } = await supabase
            .from("onboarding")
            .update({ stripe_session_id: session.id })
            .eq("id", fallbackData.id);
            
          if (updateError) {
            logStep("⚠️ Failed to update session_id in onboarding", { error: updateError.message });
          } else {
            logStep("✅ Updated onboarding with correct session_id");
          }
        }

        if (!onboardingData) {
          logStep("❌ No onboarding data found", { sessionId: session.id });
          return new Response("Onboarding data not found", { status: 404 });
        }

        logStep("📋 Found onboarding data", {
          onboardingId: onboardingData.id,
          email: onboardingData.email,
          name: onboardingData.name,
          paymentConfirmed: onboardingData.payment_confirmed
        });

        // Atualizar payment_confirmed para true
        const { error: updatePaymentError } = await supabase
          .from("onboarding")
          .update({ 
            payment_confirmed: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", onboardingData.id);

        if (updatePaymentError) {
          logStep("❌ Failed to update payment_confirmed", { error: updatePaymentError.message });
          return new Response("Failed to update payment status", { status: 500 });
        }

        logStep("✅ Updated payment_confirmed to true", { onboardingId: onboardingData.id });

        // Verificar se usuário já existe
        const { data: existingUser, error: existingUserError } = await supabase
          .from("users")
          .select("id, email")
          .eq("email", onboardingData.email)
          .single();

        if (existingUserError && existingUserError.code !== 'PGRST116') {
          logStep("⚠️ Error checking existing user", { error: existingUserError.message });
        }

        if (existingUser) {
          logStep("👤 User already exists", { userId: existingUser.id, email: existingUser.email });
          return new Response("User already exists", { status: 200 });
        }

        // Criar usuário auth
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
            errorCode: authError?.status
          });
          return new Response("Failed to create auth user", { status: 500 });
        }

        logStep("✅ Auth user created successfully", { 
          authUserId: authUser.user.id,
          email: authUser.user.email
        });

        // Calcular datas do trial
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);

        logStep("📅 Trial dates calculated", {
          trialStart: trialStart.toISOString(),
          trialEnd: trialEnd.toISOString()
        });

        // Criar usuário na tabela users
        const { data: newUser, error: userError } = await supabase
          .from("users")
          .insert([{
            user_id: authUser.user.id,
            name: onboardingData.name,
            email: onboardingData.email,
            phone_number: onboardingData.phone,
            plan_type: onboardingData.selected_plan,
            stripe_session_id: session.id,
            trial_start: trialStart.toISOString(),
            trial_end: trialEnd.toISOString(),
            completed_onboarding: true
          }])
          .select()
          .single();

        if (userError) {
          logStep("💥 Failed to create user in public.users table", { 
            error: userError.message,
            errorCode: userError.code
          });
          
          // Limpar usuário auth em caso de erro
          try {
            await supabase.auth.admin.deleteUser(authUser.user.id);
            logStep("🧹 Cleaned up auth user after failed user creation");
          } catch (cleanupError) {
            logStep("⚠️ Failed to cleanup auth user", { error: cleanupError });
          }
          
          return new Response("Failed to create user", { status: 500 });
        }

        logStep("✅ User created successfully", {
          userId: newUser.id,
          authUserId: authUser.user.id,
          email: onboardingData.email
        });

        // Atualizar onboarding com datas do trial
        const { error: updateTrialError } = await supabase
          .from("onboarding")
          .update({ 
            trial_start_date: trialStart.toISOString(),
            trial_end_date: trialEnd.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", onboardingData.id);

        if (updateTrialError) {
          logStep("⚠️ Failed to update trial dates in onboarding (non-critical)", { 
            error: updateTrialError.message 
          });
        } else {
          logStep("✅ Updated trial dates in onboarding");
        }

        logStep("🎊 === WEBHOOK PROCESSING COMPLETED ===", {
          userId: newUser.id,
          authUserId: authUser.user.id,
          email: onboardingData.email,
          paymentConfirmed: true
        });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 === WEBHOOK ERROR ===", { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(`Webhook error: ${errorMessage}`, { status: 500 });
  }
});
