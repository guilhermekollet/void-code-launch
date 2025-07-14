
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [FIX-ORPHANED] ${step}${detailsStr}`);
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
    logStep("🔍 === STARTING ORPHANED ACCOUNTS FIX ===");

    // Buscar todos os usuários auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }

    logStep("👥 Found auth users", { count: authUsers.users.length });

    // Buscar todos os usuários na tabela public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from("users")
      .select("user_id, email");

    if (publicError) {
      throw new Error(`Failed to fetch public users: ${publicError.message}`);
    }

    logStep("📋 Found public users", { count: publicUsers?.length || 0 });

    const publicUserIds = new Set(publicUsers?.map(u => u.user_id) || []);
    const orphanedUsers = authUsers.users.filter(authUser => 
      authUser.email && !publicUserIds.has(authUser.id)
    );

    logStep("🚨 Found orphaned auth users", { 
      count: orphanedUsers.length,
      emails: orphanedUsers.map(u => u.email)
    });

    const results = [];

    for (const orphanedUser of orphanedUsers) {
      try {
        logStep("🔧 Processing orphaned user", { 
          authUserId: orphanedUser.id,
          email: orphanedUser.email
        });

        // Buscar dados de onboarding para este usuário
        const { data: onboardingData, error: onboardingError } = await supabase
          .from("onboarding")
          .select("*")
          .eq("email", orphanedUser.email)
          .eq("payment_confirmed", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (onboardingError) {
          logStep("⚠️ Error fetching onboarding data", { 
            error: onboardingError.message,
            email: orphanedUser.email 
          });
          continue;
        }

        if (!onboardingData) {
          logStep("ℹ️ No confirmed onboarding found for orphaned user", { 
            email: orphanedUser.email 
          });
          results.push({
            email: orphanedUser.email,
            status: "no_onboarding_data",
            authUserId: orphanedUser.id
          });
          continue;
        }

        // Calcular datas do trial
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);

        // Criar registro na tabela public.users
        const { data: newUser, error: userError } = await supabase
          .from("users")
          .insert([{
            user_id: orphanedUser.id,
            name: onboardingData.name,
            email: orphanedUser.email,
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
          logStep("💥 Failed to create public.users record", { 
            error: userError.message,
            email: orphanedUser.email
          });
          results.push({
            email: orphanedUser.email,
            status: "creation_failed",
            error: userError.message,
            authUserId: orphanedUser.id
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
          .eq("id", onboardingData.id);

        logStep("✅ Successfully fixed orphaned account", {
          email: orphanedUser.email,
          userId: newUser.id,
          authUserId: orphanedUser.id
        });

        results.push({
          email: orphanedUser.email,
          status: "fixed",
          userId: newUser.id,
          authUserId: orphanedUser.id
        });

      } catch (error) {
        logStep("💥 Error processing orphaned user", { 
          email: orphanedUser.email,
          error: error.message 
        });
        results.push({
          email: orphanedUser.email,
          status: "processing_failed",
          error: error.message,
          authUserId: orphanedUser.id
        });
      }
    }

    logStep("✅ === ORPHANED ACCOUNTS FIX COMPLETED ===", { 
      totalOrphaned: orphanedUsers.length,
      fixed: results.filter(r => r.status === "fixed").length,
      failed: results.filter(r => r.status.includes("failed")).length,
      noData: results.filter(r => r.status === "no_onboarding_data").length
    });

    return new Response(JSON.stringify({
      success: true,
      totalOrphaned: orphanedUsers.length,
      results: results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 === FIX ORPHANED ACCOUNTS ERROR ===", { 
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
