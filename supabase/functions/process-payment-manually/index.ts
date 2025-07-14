
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [MANUAL-PROCESS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    logStep("⚡ CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  if (req.method !== "POST") {
    logStep("❌ Invalid request method", { method: req.method });
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Method not allowed" 
    }), {
      headers: corsHeaders,
      status: 405,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    logStep("🚀 === MANUAL PROCESSING STARTED ===");
    
    let requestBody;
    try {
      const requestText = await req.text();
      logStep("📨 Raw request body", { body: requestText.substring(0, 500) });
      requestBody = JSON.parse(requestText);
    } catch (parseError) {
      logStep("❌ Failed to parse request body", { error: parseError.message });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid JSON in request body" 
      }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    const { sessionId } = requestBody;
    if (!sessionId || typeof sessionId !== 'string') {
      logStep("❌ No valid session ID provided, attempting auto-recovery", { sessionId });
      
      // Tentar recuperar contas órfãs automaticamente
      try {
        const fixOrphanedResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/fix-orphaned-accounts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            'Content-Type': 'application/json'
          }
        });
        
        const fixOrphanedResult = await fixOrphanedResponse.json();
        logStep("✅ Orphaned accounts fix attempted", fixOrphanedResult);
        
        // Tentar recuperar contas pendentes também
        const recoveryResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/recover-pending-accounts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            'Content-Type': 'application/json'
          }
        });
        
        const recoveryResult = await recoveryResponse.json();
        logStep("✅ Pending accounts recovery attempted", recoveryResult);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Automatic recovery initiated",
          fixOrphanedResult: fixOrphanedResult,
          recoveryResult: recoveryResult
        }), {
          headers: corsHeaders,
          status: 200,
        });
      } catch (recoveryError) {
        logStep("⚠️ Automatic recovery failed", { error: recoveryError.message });
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Session ID is required and must be a string" 
      }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    logStep("🎯 Processing session", { sessionId });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("❌ Stripe secret key not configured");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Stripe configuration error" 
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Verificar status do pagamento no Stripe
    logStep("🔍 Retrieving Stripe session");
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      logStep("❌ Failed to retrieve Stripe session", { 
        error: stripeError.message,
        sessionId 
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Session not found in Stripe" 
      }), {
        headers: corsHeaders,
        status: 404,
      });
    }

    logStep("💳 Stripe session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      mode: session.mode,
      amountTotal: session.amount_total
    });

    if (session.payment_status !== 'paid') {
      logStep("❌ Payment not completed in Stripe", { 
        paymentStatus: session.payment_status,
        expectedStatus: 'paid'
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Payment not completed",
        paymentStatus: session.payment_status
      }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    // Buscar dados do onboarding
    logStep("📋 Fetching onboarding data");
    let { data: onboardingData, error: onboardingError } = await supabase
      .from('onboarding')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (!onboardingData && session.customer_email) {
      logStep("⚠️ Onboarding data not found by session_id, trying email fallback", { 
        customerEmail: session.customer_email
      });
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('onboarding')
        .select('*')
        .eq('email', session.customer_email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (fallbackData) {
        onboardingData = fallbackData;
        
        // Atualizar com o session_id correto
        const { error: updateError } = await supabase
          .from('onboarding')
          .update({ stripe_session_id: sessionId })
          .eq('id', fallbackData.id);
          
        if (updateError) {
          logStep("⚠️ Failed to update session_id", { error: updateError.message });
        } else {
          logStep("✅ Updated onboarding with session_id");
        }
      }
    }

    if (!onboardingData) {
      logStep("❌ No onboarding data found", { 
        sessionId,
        customerEmail: session.customer_email 
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No onboarding data found" 
      }), {
        headers: corsHeaders,
        status: 404,
      });
    }

    logStep("📋 Onboarding data found", {
      onboardingId: onboardingData.id,
      email: onboardingData.email,
      name: onboardingData.name,
      paymentConfirmed: onboardingData.payment_confirmed
    });

    // Verificar se usuário já existe na tabela public.users
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id, user_id, email')
      .eq('email', onboardingData.email)
      .maybeSingle();

    if (existingUserError) {
      logStep("❌ Error checking existing user", { error: existingUserError.message });
    }

    if (existingUser) {
      logStep("👤 User already exists, updating payment confirmation", {
        userId: existingUser.id,
        email: existingUser.email
      });
      
      const { error: updateError } = await supabase
        .from('onboarding')
        .update({ 
          payment_confirmed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', onboardingData.id);

      if (updateError) {
        logStep("❌ Failed to update payment confirmation", { error: updateError.message });
      } else {
        logStep("✅ Payment confirmation updated for existing user");
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "User already exists, payment confirmed",
        userId: existingUser.id,
        email: existingUser.email
      }), {
        headers: corsHeaders,
        status: 200,
      });
    }

    // Verificar se existe usuário auth órfão
    logStep("🔍 Checking for orphaned auth user");
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    if (authUsersError) {
      logStep("⚠️ Error listing auth users", { error: authUsersError.message });
    }

    const orphanedAuthUser = authUsers?.users?.find(user => user.email === onboardingData.email);
    
    if (orphanedAuthUser) {
      logStep("🔧 Found orphaned auth user, will adopt it", { 
        authUserId: orphanedAuthUser.id,
        email: orphanedAuthUser.email
      });

      // Atualizar payment_confirmed primeiro
      const { error: confirmError } = await supabase
        .from('onboarding')
        .update({ 
          payment_confirmed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', onboardingData.id);

      if (confirmError) {
        logStep("❌ Failed to update payment_confirmed", { error: confirmError.message });
      }

      // Calcular datas do trial
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      // Criar registro na tabela public.users para o usuário órfão
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          user_id: orphanedAuthUser.id,
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
        logStep("💥 Failed to create public.users record for orphaned user", { 
          error: userError.message,
          authUserId: orphanedAuthUser.id
        });
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Failed to create user account",
          details: userError.message
        }), {
          headers: corsHeaders,
          status: 500,
        });
      }

      // Atualizar onboarding com datas do trial
      await supabase
        .from('onboarding')
        .update({ 
          trial_start_date: trialStart.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', onboardingData.id);

      logStep("✅ Successfully adopted orphaned auth user", {
        userId: newUser.id,
        authUserId: orphanedAuthUser.id,
        email: onboardingData.email
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Orphaned account adopted successfully",
        userId: newUser.id,
        email: onboardingData.email
      }), {
        headers: corsHeaders,
        status: 200,
      });
    }

    // Atualizar payment_confirmed primeiro
    logStep("💰 Updating payment_confirmed status");
    const { error: confirmError } = await supabase
      .from('onboarding')
      .update({ 
        payment_confirmed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', onboardingData.id);

    if (confirmError) {
      logStep("❌ Failed to update payment_confirmed", { error: confirmError.message });
    } else {
      logStep("✅ Payment_confirmed updated successfully");
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
      
      // Se o erro é 422 (usuário já existe), tentar executar fix-orphaned-accounts
      if (authError?.status === 422 || authError?.message?.includes("already been registered")) {
        logStep("🔧 Auth user already exists (422), attempting orphaned account fix");
        
        try {
          const fixOrphanedResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/fix-orphaned-accounts`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              'Content-Type': 'application/json'
            }
          });
          
          const fixOrphanedResult = await fixOrphanedResponse.json();
          logStep("✅ Orphaned accounts fix completed after 422 error", fixOrphanedResult);
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: "Orphaned account fixed after 422 error",
            fixResult: fixOrphanedResult
          }), {
            headers: corsHeaders,
            status: 200,
          });
        } catch (fixError) {
          logStep("❌ Failed to fix orphaned account after 422", { error: fixError.message });
        }
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to create user account",
        details: authError?.message
      }), {
        headers: corsHeaders,
        status: 500,
      });
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

    // Criar usuário na tabela public.users
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
      logStep("💥 Failed to create user in public.users table", { 
        error: userError.message,
        errorCode: userError.code
      });
      
      // Limpar usuário auth
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        logStep("🧹 Cleaned up auth user after failed user creation");
      } catch (cleanupError) {
        logStep("⚠️ Failed to cleanup auth user", { error: cleanupError });
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to create user account",
        details: userError.message
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    logStep("✅ User created successfully in public.users table", {
      userId: newUser.id,
      authUserId: authUser.user.id,
      email: onboardingData.email
    });

    // Atualizar onboarding com datas do trial
    const { error: updateError } = await supabase
      .from('onboarding')
      .update({ 
        trial_start_date: trialStart.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', onboardingData.id);

    if (updateError) {
      logStep("⚠️ Failed to update onboarding (non-critical)", { error: updateError.message });
    } else {
      logStep("✅ Onboarding updated with trial dates");
    }

    logStep("🎊 === MANUAL PROCESSING COMPLETED ===", {
      userId: newUser.id,
      authUserId: authUser.user.id,
      email: onboardingData.email,
      paymentConfirmed: true
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Account created successfully",
      userId: newUser.id,
      email: onboardingData.email
    }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 === MANUAL PROCESSING ERROR ===", { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Internal server error",
      details: errorMessage
    }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
