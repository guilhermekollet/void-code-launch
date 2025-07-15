
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    console.log('Verifying payment for session:', sessionId);
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Stripe session status:', session.payment_status);

    if (session.payment_status === 'paid') {
      // Find onboarding record by stripe session id
      const { data: onboarding, error: onboardingFetchError } = await supabase
        .from('onboarding')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();

      if (onboardingFetchError || !onboarding) {
        console.error('Error finding onboarding:', onboardingFetchError);
        return new Response(
          JSON.stringify({ success: false, error: "Registro de onboarding não encontrado" }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Calculate trial dates (3 days from now)
      const now = new Date();
      const trialStart = now.toISOString();
      const trialEnd = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString(); // 3 days

      console.log('Trial period:', { trialStart, trialEnd });

      // Update onboarding with payment confirmation and trial dates
      const { error: updateOnboardingError } = await supabase
        .from('onboarding')
        .update({ 
          payment_confirmed: true,
          stripe_session_id: sessionId,
          trial_start_date: trialStart,
          trial_end_date: trialEnd,
          registration_stage: 'completed'
        })
        .eq('stripe_session_id', sessionId);

      if (updateOnboardingError) {
        console.error('Error updating onboarding:', updateOnboardingError);
      }

      // Create user account
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: onboarding.email,
        phone: onboarding.phone,
        password: Math.random().toString(36).slice(-8), // Temporary password
        email_confirm: true,
        user_metadata: {
          name: onboarding.name,
          phone_number: onboarding.phone,
          plan_type: onboarding.selected_plan,
          billing_cycle: onboarding.billing_cycle
        }
      });

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao criar usuário" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log('User created:', newUser.user?.id);

      // Insert into users table with complete information
      const { data: insertedUser, error: insertUserError } = await supabase
        .from('users')
        .insert({
          user_id: newUser.user!.id,
          email: onboarding.email,
          name: onboarding.name,
          phone_number: onboarding.phone,
          plan_type: onboarding.selected_plan,
          billing_cycle: onboarding.billing_cycle,
          trial_start: trialStart,
          trial_end: trialEnd,
          stripe_session_id: sessionId,
          completed_onboarding: true
        })
        .select('id')
        .single();

      if (insertUserError) {
        console.error('Error inserting user:', insertUserError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao inserir dados do usuário" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Create subscription record to maintain data consistency
      const { error: insertSubscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: insertedUser.id,
          plan_type: onboarding.selected_plan,
          status: 'trialing',
          trial_start: trialStart,
          trial_end: trialEnd,
          current_period_start: trialStart,
          current_period_end: trialEnd,
          stripe_customer_id: null, // Will be updated when subscription is activated
          stripe_subscription_id: null,
        });

      if (insertSubscriptionError) {
        console.error('Error inserting subscription:', insertSubscriptionError);
        // Continue even if this fails, as the main user record was created
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          session,
          user: newUser.user,
          trial: {
            start: trialStart,
            end: trialEnd,
            daysRemaining: 3
          },
          planType: onboarding.selected_plan,
          completedOnboarding: true,
          message: "Pagamento confirmado e trial de 3 dias iniciado!"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } else {
      console.log('Payment not completed, status:', session.payment_status);
      return new Response(
        JSON.stringify({ success: false, error: "Pagamento não foi concluído" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

  } catch (error) {
    console.error('Error in verify-stripe-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
