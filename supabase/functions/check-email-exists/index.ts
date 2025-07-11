
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Check if email exists in users table (completed registration)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, trial_start, trial_end')
      .eq('email', email)
      .single();

    if (user && !error) {
      // Check if trial is still active
      const now = new Date().toISOString();
      const trialActive = user.trial_end && new Date(user.trial_end) > new Date(now);
      
      return new Response(
        JSON.stringify({ 
          exists: true, 
          completed: true,
          trialActive,
          trialEnd: user.trial_end,
          message: trialActive ? "Email já cadastrado com trial ativo" : "Email já cadastrado com registro completo"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if email exists in onboarding table
    const { data: onboarding, error: onboardingError } = await supabase
      .from('onboarding')
      .select('*')
      .eq('email', email)
      .single();

    if (onboarding && !onboardingError) {
      // Check if payment was completed and trial started
      if (onboarding.payment_confirmed && onboarding.trial_start_date) {
        const now = new Date().toISOString();
        const trialActive = onboarding.trial_end_date && new Date(onboarding.trial_end_date) > new Date(now);
        
        return new Response(
          JSON.stringify({ 
            exists: true, 
            completed: true,
            trialActive,
            trialEnd: onboarding.trial_end_date,
            shouldCreateUser: true, // Indica que precisa migrar para users
            onboardingId: onboarding.id,
            message: "Cadastro concluído, iniciando acesso ao sistema"
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Return existing incomplete registration data
      return new Response(
        JSON.stringify({ 
          exists: true,
          completed: false,
          canContinue: true,
          onboardingId: onboarding.id,
          existingData: {
            name: onboarding.name,
            email: onboarding.email,
            phone: onboarding.phone,
            selectedPlan: onboarding.selected_plan,
            billingCycle: onboarding.billing_cycle,
            registrationStage: onboarding.registration_stage,
            paymentConfirmed: onboarding.payment_confirmed,
            stripeSessionId: onboarding.stripe_session_id
          },
          message: "Cadastro incompleto encontrado. Você pode continuar de onde parou."
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Email not found anywhere
    return new Response(
      JSON.stringify({ 
        exists: false,
        canContinue: false,
        message: "Email disponível para cadastro"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
