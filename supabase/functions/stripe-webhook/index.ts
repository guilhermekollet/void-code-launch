
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
    logStep("🎯 === WEBHOOK REQUEST RECEIVED ===", {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });
    
    const signature = req.headers.get("Stripe-Signature");
    if (!signature) {
      logStep("❌ Missing Stripe signature in headers");
      return new Response("Missing Stripe signature", { status: 400 });
    }

    const body = await req.text();
    logStep("📨 Request body received", { bodyLength: body.length });
    
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("❌ STRIPE_WEBHOOK_SECRET not configured in environment");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    let event;
    try {
      logStep("🔐 Attempting webhook signature verification");
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("✅ Webhook signature verified successfully", { 
        eventType: event.type, 
        eventId: event.id,
        created: new Date(event.created * 1000).toISOString()
      });
    } catch (err) {
      logStep("❌ Webhook signature verification failed", { 
        error: err.message,
        signatureProvided: !!signature,
        secretConfigured: !!webhookSecret
      });
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
        amountTotal: session.amount_total,
        customerId: session.customer
      });

      if (session.payment_status === "paid") {
        try {
          await processSuccessfulPayment(session, supabase);
        } catch (error) {
          logStep("💥 Error processing successful payment", { 
            error: error.message,
            sessionId: session.id 
          });
          throw error;
        }
      } else {
        logStep("⚠️ Payment not confirmed", { 
          paymentStatus: session.payment_status,
          sessionId: session.id 
        });
      }
    } else {
      logStep("ℹ️ Unhandled event type", { eventType: event.type });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 === WEBHOOK PROCESSING ERROR ===", { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(`Webhook error: ${errorMessage}`, { status: 500 });
  }
});

async function processSuccessfulPayment(session: Stripe.Checkout.Session, supabase: any) {
  logStep("🔍 Starting payment processing", { sessionId: session.id });

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
      throw new Error("Onboarding data not found");
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
    throw new Error("Onboarding data not found");
  }

  logStep("📋 Found onboarding data", {
    onboardingId: onboardingData.id,
    email: onboardingData.email,
    name: onboardingData.name,
    paymentConfirmed: onboardingData.payment_confirmed
  });

  // GARANTIR que payment_confirmed seja atualizado para true
  logStep("💰 Updating payment_confirmed status");
  const { error: updatePaymentError } = await supabase
    .from("onboarding")
    .update({ 
      payment_confirmed: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", onboardingData.id);

  if (updatePaymentError) {
    logStep("❌ CRITICAL: Failed to update payment_confirmed", { error: updatePaymentError.message });
    throw new Error("Failed to update payment status");
  }

  logStep("✅ CONFIRMED: Updated payment_confirmed to true", { onboardingId: onboardingData.id });

  // Verificar se usuário já existe
  logStep("👤 Checking if user already exists");
  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id, email, user_id")
    .eq("email", onboardingData.email)
    .maybeSingle();

  if (existingUserError) {
    logStep("⚠️ Error checking existing user", { error: existingUserError.message });
  }

  if (existingUser) {
    logStep("👤 User already exists", { 
      userId: existingUser.id, 
      email: existingUser.email,
      authUserId: existingUser.user_id 
    });
    return;
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
      errorCode: authError?.status,
      email: onboardingData.email
    });
    throw new Error(`Failed to create auth user: ${authError?.message}`);
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
  logStep("🏗️ Creating user in public.users table");
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
      errorCode: userError.code,
      authUserId: authUser.user.id
    });
    
    // Limpar usuário auth em caso de erro
    try {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      logStep("🧹 Cleaned up auth user after failed user creation");
    } catch (cleanupError) {
      logStep("⚠️ Failed to cleanup auth user", { error: cleanupError });
    }
    
    throw new Error(`Failed to create user: ${userError.message}`);
  }

  logStep("✅ User created successfully in public.users", {
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

  logStep("🎊 === USER CREATION COMPLETED SUCCESSFULLY ===", {
    userId: newUser.id,
    authUserId: authUser.user.id,
    email: onboardingData.email,
    paymentConfirmed: true,
    trialStart: trialStart.toISOString(),
    trialEnd: trialEnd.toISOString()
  });
}
