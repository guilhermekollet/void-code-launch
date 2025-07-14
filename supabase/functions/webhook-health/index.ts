
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const now = new Date();
    const healthData = {
      timestamp: now.toISOString(),
      webhook_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/stripe-webhook`,
      environment_checks: {
        SUPABASE_URL: !!Deno.env.get("SUPABASE_URL"),
        SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
        STRIPE_SECRET_KEY: !!Deno.env.get("STRIPE_SECRET_KEY"),
        STRIPE_WEBHOOK_SECRET: !!Deno.env.get("STRIPE_WEBHOOK_SECRET")
      }
    };

    // Verificar contas pendentes (pagamento confirmado mas usuário não criado)
    const { data: pendingAccounts, error: pendingError } = await supabase
      .from("onboarding")
      .select("id, email, payment_confirmed, created_at")
      .eq("payment_confirmed", true);

    if (pendingError) {
      console.error("Error checking pending accounts:", pendingError.message);
      healthData.pending_accounts_error = pendingError.message;
    } else {
      const pendingAccountsWithoutUsers = [];
      
      for (const account of pendingAccounts || []) {
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("email", account.email)
          .maybeSingle();
          
        if (!user && !userError) {
          pendingAccountsWithoutUsers.push({
            email: account.email,
            onboardingId: account.id,
            paymentConfirmedAt: account.created_at
          });
        }
      }
      
      healthData.pending_accounts = {
        total_confirmed_payments: pendingAccounts?.length || 0,
        accounts_without_users: pendingAccountsWithoutUsers.length,
        details: pendingAccountsWithoutUsers
      };
    }

    // Verificar estatísticas recentes
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: recentOnboarding, error: recentError } = await supabase
      .from("onboarding")
      .select("id, payment_confirmed, created_at")
      .gte("created_at", oneDayAgo.toISOString());

    if (!recentError) {
      healthData.recent_stats = {
        last_24h_onboarding: recentOnboarding?.length || 0,
        last_24h_confirmed_payments: recentOnboarding?.filter(o => o.payment_confirmed).length || 0
      };
    }

    return new Response(JSON.stringify(healthData, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorResponse = {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
