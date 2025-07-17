
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [VERIFY-RECOVER-PLAN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, email } = await req.json();
    logStep("Starting plan verification and recovery", { sessionId, email });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // 1. Buscar dados do onboarding
    let onboardingData;
    
    if (sessionId) {
      const { data, error } = await supabase
        .from('onboarding')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();
      
      if (error && email) {
        logStep("Session ID not found, trying email fallback", { sessionId, email });
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('onboarding')
          .select('*')
          .eq('email', email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (fallbackError) {
          throw new Error('Onboarding data not found');
        }
        onboardingData = fallbackData;
      } else if (error) {
        throw new Error('Onboarding data not found');
      } else {
        onboardingData = data;
      }
    } else if (email) {
      const { data, error } = await supabase
        .from('onboarding')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        throw new Error('Onboarding data not found');
      }
      onboardingData = data;
    } else {
      throw new Error('Session ID or email required');
    }

    logStep("Found onboarding data", onboardingData);

    // 2. Verificar status no Stripe se temos session_id
    let stripePaymentConfirmed = false;
    if (onboardingData.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(onboardingData.stripe_session_id);
        stripePaymentConfirmed = session.payment_status === 'paid';
        logStep("Stripe payment status", { 
          sessionId: onboardingData.stripe_session_id, 
          paymentStatus: session.payment_status,
          confirmed: stripePaymentConfirmed 
        });
      } catch (error) {
        logStep("Error checking Stripe session", { error: error.message });
      }
    }

    // 3. Verificar se usuário existe na tabela users
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', onboardingData.email)
      .maybeSingle();

    if (userError) {
      logStep("Error checking existing user", { error: userError.message });
    }

    logStep("Existing user check", { found: !!existingUser, user: existingUser });

    // 4. Se pagamento foi confirmado no Stripe mas dados estão incompletos, corrigir
    if (stripePaymentConfirmed && (!existingUser || !existingUser.completed_onboarding || !existingUser.plan_type)) {
      logStep("Payment confirmed but user data incomplete, starting recovery");

      // Calcular datas do trial (3 dias)
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 3);

      // Atualizar onboarding se necessário
      if (!onboardingData.payment_confirmed) {
        await supabase
          .from('onboarding')
          .update({ 
            payment_confirmed: true,
            trial_start_date: trialStart.toISOString(),
            trial_end_date: trialEnd.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', onboardingData.id);
        logStep("Updated onboarding payment_confirmed");
      }

      if (existingUser) {
        // Atualizar usuário existente
        const { error: updateError } = await supabase
          .from('users')
          .update({
            plan_type: onboardingData.selected_plan,
            billing_cycle: onboardingData.billing_cycle,
            stripe_session_id: onboardingData.stripe_session_id,
            trial_start: trialStart.toISOString(),
            trial_end: trialEnd.toISOString(),
            completed_onboarding: true,
            updated_at: new Date().toISOString()
          })
          .eq('email', onboardingData.email);

        if (updateError) {
          logStep("Error updating existing user", { error: updateError.message });
          throw new Error('Failed to update user data');
        }
        logStep("Successfully updated existing user");
      } else {
        // Verificar se existe usuário auth órfão
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        const orphanedUser = authUsers?.users?.find(user => user.email === onboardingData.email);

        if (orphanedUser) {
          // Criar registro na tabela users para usuário órfão
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              user_id: orphanedUser.id,
              email: onboardingData.email,
              name: onboardingData.name,
              phone_number: onboardingData.phone,
              plan_type: onboardingData.selected_plan,
              billing_cycle: onboardingData.billing_cycle,
              stripe_session_id: onboardingData.stripe_session_id,
              trial_start: trialStart.toISOString(),
              trial_end: trialEnd.toISOString(),
              completed_onboarding: true
            });

          if (insertError) {
            logStep("Error creating user record for orphaned auth user", { error: insertError.message });
            throw new Error('Failed to create user record');
          }
          logStep("Successfully created user record for orphaned auth user");
        } else {
          // Criar novo usuário auth e registro na tabela users
          const { data: authUser, error: authCreateError } = await supabase.auth.admin.createUser({
            email: onboardingData.email,
            phone: onboardingData.phone,
            user_metadata: {
              name: onboardingData.name,
              phone_number: onboardingData.phone
            },
            email_confirm: true
          });

          if (authCreateError || !authUser.user) {
            logStep("Error creating auth user", { error: authCreateError?.message });
            throw new Error('Failed to create auth user');
          }

          const { error: insertError } = await supabase
            .from('users')
            .insert({
              user_id: authUser.user.id,
              email: onboardingData.email,
              name: onboardingData.name,
              phone_number: onboardingData.phone,
              plan_type: onboardingData.selected_plan,
              billing_cycle: onboardingData.billing_cycle,
              stripe_session_id: onboardingData.stripe_session_id,
              trial_start: trialStart.toISOString(),
              trial_end: trialEnd.toISOString(),
              completed_onboarding: true
            });

          if (insertError) {
            logStep("Error creating user record", { error: insertError.message });
            await supabase.auth.admin.deleteUser(authUser.user.id);
            throw new Error('Failed to create user record');
          }
          logStep("Successfully created new user and auth record");
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          recovered: true,
          planType: onboardingData.selected_plan,
          billingCycle: onboardingData.billing_cycle,
          trialEnd: trialEnd.toISOString(),
          message: "Account recovered successfully"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // 5. Retornar status atual
    return new Response(
      JSON.stringify({ 
        success: true,
        recovered: false,
        paymentConfirmed: onboardingData.payment_confirmed,
        stripePaymentConfirmed,
        userExists: !!existingUser,
        completedOnboarding: existingUser?.completed_onboarding || false,
        planType: existingUser?.plan_type || onboardingData.selected_plan,
        billingCycle: existingUser?.billing_cycle || onboardingData.billing_cycle,
        message: "Status checked successfully"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    logStep("Error in verify-and-recover-plan", { error: error.message });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
