
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
    
    console.log('[create-user-from-onboarding] Starting with onboardingId:', onboardingId);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get onboarding data
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('onboarding')
      .select('*')
      .eq('id', onboardingId)
      .single();

    if (onboardingError) {
      console.error('[create-user-from-onboarding] Onboarding query error:', onboardingError);
      throw new Error(`Onboarding query failed: ${onboardingError.message}`);
    }

    if (!onboardingData) {
      console.error('[create-user-from-onboarding] No onboarding data found for ID:', onboardingId);
      throw new Error('Onboarding data not found');
    }

    console.log('[create-user-from-onboarding] Found onboarding data:', {
      email: onboardingData.email,
      phone: onboardingData.phone,
      name: onboardingData.name,
      plan: onboardingData.selected_plan
    });

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

    // Validate required fields
    if (!onboardingData.email || !onboardingData.phone || !onboardingData.name) {
      console.error('[create-user-from-onboarding] Missing required fields:', {
        email: !!onboardingData.email,
        phone: !!onboardingData.phone,
        name: !!onboardingData.name
      });
      throw new Error('Missing required fields: email, phone, or name');
    }

    // Create user in auth.users first
    console.log('[create-user-from-onboarding] Creating auth user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: onboardingData.email,
      phone: onboardingData.phone,
      user_metadata: {
        name: onboardingData.name,
        phone_number: onboardingData.phone
      },
      email_confirm: true
    });

    if (authError) {
      console.error('[create-user-from-onboarding] Auth creation error:', authError);
      throw new Error(`Auth creation failed: ${authError.message}`);
    }

    if (!authUser.user) {
      console.error('[create-user-from-onboarding] No auth user returned');
      throw new Error('Auth creation failed: No user returned');
    }

    console.log('[create-user-from-onboarding] Auth user created successfully:', authUser.user.id);

    // Calculate trial dates (3 days from now)
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 3);

    // Create user in public.users table with all necessary data
    console.log('[create-user-from-onboarding] Creating public user...');
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{
        user_id: authUser.user.id,
        name: onboardingData.name,
        email: onboardingData.email,
        phone_number: onboardingData.phone || '', // Ensure not null
        plan_type: onboardingData.selected_plan,
        billing_cycle: onboardingData.billing_cycle || 'monthly',
        stripe_session_id: onboardingData.stripe_session_id,
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        completed_onboarding: true
      }])
      .select()
      .single();

    if (userError) {
      console.error('[create-user-from-onboarding] User creation error:', userError);
      // If user creation fails, clean up auth user
      console.log('[create-user-from-onboarding] Cleaning up auth user...');
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Database error creating new user: ${userError.message}`);
    }

    console.log('[create-user-from-onboarding] Public user created successfully:', newUser.id);

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
        trialDays: 3,
        planType: onboardingData.selected_plan,
        completedOnboarding: true,
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
