
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYMENT-MANUALLY] ${step}${detailsStr}`);
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
    logStep("Manual payment processing started");
    
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Retrieved Stripe session", { 
      sessionId, 
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email 
    });

    if (session.payment_status !== 'paid') {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }

    // Get onboarding data
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('onboarding')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (onboardingError || !onboardingData) {
      throw new Error(`Onboarding data not found for session: ${sessionId}`);
    }

    logStep("Found onboarding data", { 
      onboardingId: onboardingData.id,
      email: onboardingData.email,
      paymentConfirmed: onboardingData.payment_confirmed
    });

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, user_id')
      .eq('email', onboardingData.email)
      .single();

    if (existingUser) {
      logStep("User already exists", { userId: existingUser.id });
      
      // Just update payment confirmation
      await supabase
        .from('onboarding')
        .update({ 
          payment_confirmed: true,
          registration_stage: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', onboardingData.id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payment confirmed for existing user",
        userId: existingUser.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    logStep("Auth user created", { authUserId: authUser.user.id });

    // Calculate trial dates
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
        stripe_session_id: sessionId,
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        completed_onboarding: true
      }])
      .select()
      .single();

    if (userError) {
      logStep("Failed to create user", { error: userError.message });
      // Clean up auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    // Update onboarding status
    await supabase
      .from('onboarding')
      .update({ 
        payment_confirmed: true,
        trial_start_date: trialStart.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        registration_stage: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', onboardingData.id);

    logStep("User created successfully via manual processing", { 
      userId: newUser.id, 
      authUserId: authUser.user.id 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "User created successfully",
      userId: newUser.id,
      authUserId: authUser.user.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in manual payment processing", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
