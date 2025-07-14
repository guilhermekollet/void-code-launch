
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANUAL-PROCESS] ${step}${detailsStr}`);
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
    logStep("=== MANUAL PROCESSING STARTED ===");
    
    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    logStep("Processing session", { sessionId });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Verify payment status in Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Stripe session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email
    });

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Payment not completed in Stripe",
        paymentStatus: session.payment_status
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get onboarding data
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('onboarding')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (onboardingError || !onboardingData) {
      logStep("Onboarding data not found", { error: onboardingError });
      
      // Try to find by email if available
      if (session.customer_email) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('onboarding')
          .select('*')
          .eq('email', session.customer_email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (fallbackError || !fallbackData) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Onboarding data not found" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          });
        }
        
        // Update with correct session_id
        await supabase
          .from('onboarding')
          .update({ stripe_session_id: sessionId })
          .eq('id', fallbackData.id);
          
        onboardingData = { ...fallbackData, stripe_session_id: sessionId };
        logStep("Found onboarding via email fallback");
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Onboarding data not found" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, user_id')
      .eq('email', onboardingData.email)
      .single();

    if (existingUser) {
      logStep("User already exists, updating payment confirmation");
      
      await supabase
        .from('onboarding')
        .update({ 
          payment_confirmed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', onboardingData.id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "User already exists, payment confirmed",
        userId: existingUser.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create auth user
    logStep("Creating auth user");
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
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to create auth user",
        details: authError?.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

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
      logStep("Failed to create user", { error: userError });
      // Clean up auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to create user",
        details: userError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Update onboarding status
    await supabase
      .from('onboarding')
      .update({ 
        payment_confirmed: true,
        trial_start_date: trialStart.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', onboardingData.id);

    logStep("=== MANUAL PROCESSING COMPLETED ===", {
      userId: newUser.id,
      email: onboardingData.email
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Account created successfully",
      userId: newUser.id,
      email: onboardingData.email
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("=== MANUAL PROCESSING ERROR ===", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
