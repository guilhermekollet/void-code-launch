
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
    const { onboardingId } = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get onboarding data
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('onboarding')
      .select('*')
      .eq('id', onboardingId)
      .single();

    if (onboardingError || !onboardingData) {
      throw new Error('Onboarding data not found');
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', onboardingData.email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          success: true,
          userId: existingUser.id,
          message: "User already exists"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create user in auth.users first
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

    // Calculate trial dates (7 days from now)
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
        stripe_session_id: onboardingData.stripe_session_id,
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        completed_onboarding: true
      }])
      .select()
      .single();

    if (userError) {
      // If user creation fails, clean up auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    // Update onboarding status
    await supabase
      .from('onboarding')
      .update({ 
        payment_confirmed: true,
        trial_start_date: trialStart.toISOString(),
        trial_end_date: trialEnd.toISOString()
      })
      .eq('id', onboardingId);

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: newUser.id,
        authUserId: authUser.user.id,
        trialStart: trialStart.toISOString(),
        trialEnd: trialEnd.toISOString(),
        message: "User created successfully"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Error creating user:', error);
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
