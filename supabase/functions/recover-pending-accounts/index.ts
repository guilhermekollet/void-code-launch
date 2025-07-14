
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [RECOVER-ACCOUNTS] ${step}${detailsStr}`);
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
    logStep("🔍 === STARTING ACCOUNT RECOVERY ===");

    // Buscar registros de onboarding com pagamento confirmado mas sem usuário criado
    const { data: pendingAccounts, error: pendingError } = await supabase
      .from("onboarding")
      .select("*")
      .eq("payment_confirmed", true)
      .not("email", "is", null);

    if (pendingError) {
      logStep("❌ Error fetching pending accounts", { error: pendingError.message });
      throw new Error(`Failed to fetch pending accounts: ${pendingError.message}`);
    }

    logStep("📋 Found pending accounts", { count: pendingAccounts?.length || 0 });

    const results = [];

    for (const account of pendingAccounts || []) {
      try {
        logStep("🔄 Processing account", { 
          email: account.email,
          onboardingId: account.id,
          paymentConfirmed: account.payment_confirmed
        });

        // Verificar se usuário já existe
        const { data: existingUser, error: userCheckError } = await supabase
          .from("users")
          .select("id, email, user_id")
          .eq("email", account.email)
          .maybeSingle();

        if (userCheckError) {
          logStep("⚠️ Error checking existing user", { 
            error: userCheckError.message,
            email: account.email 
          });
          continue;
        }

        if (existingUser) {
          logStep("✅ User already exists, skipping", { 
            email: account.email,
            userId: existingUser.id 
          });
          results.push({
            email: account.email,
            status: "already_exists",
            userId: existingUser.id
          });
          continue;
        }

        // Criar usuário auth
        logStep("👨‍💼 Creating auth user", {
          email: account.email,
          phone: account.phone,
          name: account.name
        });

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: account.email,
          phone: account.phone,
          user_metadata: {
            name: account.name,
            phone_number: account.phone
          },
          email_confirm: true
        });

        if (authError || !authUser.user) {
          logStep("💥 Failed to create auth user", { 
            error: authError?.message,
            email: account.email
          });
          results.push({
            email: account.email,
            status: "auth_creation_failed",
            error: authError?.message
          });
          continue;
        }

        logStep("✅ Auth user created", { 
          authUserId: authUser.user.id,
          email: account.email
        });

        // Calcular datas do trial
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);

        // Criar usuário na tabela users
        const { data: newUser, error: userError } = await supabase
          .from("users")
          .insert([{
            user_id: authUser.user.id,
            name: account.name,
            email: account.email,
            phone_number: account.phone,
            plan_type: account.selected_plan,
            stripe_session_id: account.stripe_session_id,
            trial_start: trialStart.toISOString(),
            trial_end: trialEnd.toISOString(),
            completed_onboarding: true
          }])
          .select()
          .single();

        if (userError) {
          logStep("💥 Failed to create user in public.users", { 
            error: userError.message,
            email: account.email
          });
          
          // Limpar usuário auth
          try {
            await supabase.auth.admin.deleteUser(authUser.user.id);
            logStep("🧹 Cleaned up auth user");
          } catch (cleanupError) {
            logStep("⚠️ Failed to cleanup auth user", { error: cleanupError });
          }
          
          results.push({
            email: account.email,
            status: "user_creation_failed",
            error: userError.message
          });
          continue;
        }

        // Atualizar onboarding com datas do trial
        await supabase
          .from("onboarding")
          .update({ 
            trial_start_date: trialStart.toISOString(),
            trial_end_date: trialEnd.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", account.id);

        logStep("🎊 Account recovery successful", {
          email: account.email,
          userId: newUser.id,
          authUserId: authUser.user.id
        });

        results.push({
          email: account.email,
          status: "recovered",
          userId: newUser.id,
          authUserId: authUser.user.id
        });

      } catch (error) {
        logStep("💥 Error processing account", { 
          email: account.email,
          error: error.message 
        });
        results.push({
          email: account.email,
          status: "processing_failed",
          error: error.message
        });
      }
    }

    logStep("✅ === ACCOUNT RECOVERY COMPLETED ===", { 
      totalProcessed: results.length,
      recovered: results.filter(r => r.status === "recovered").length,
      alreadyExists: results.filter(r => r.status === "already_exists").length,
      failed: results.filter(r => r.status.includes("failed")).length
    });

    return new Response(JSON.stringify({
      success: true,
      totalProcessed: results.length,
      results: results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 === RECOVERY ERROR ===", { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
