import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REACTIVATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Step 1: Authenticate the user first
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("Missing authorization header");
      throw new Error("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData.user) {
      logStep("Authentication failed", { error: userError?.message });
      throw new Error("Invalid or expired authentication token");
    }

    const authenticatedUser = userData.user;
    logStep("User authenticated", { userId: authenticatedUser.id, email: authenticatedUser.email });

    // Step 2: Parse and validate request
    const { planType, billingCycle: rawBillingCycle, userId, email } = await req.json();
    
    // Garantir que billingCycle tem um valor padrão válido
    const billingCycle = rawBillingCycle || 'yearly';
    
    logStep("Request received", { planType, billingCycle, userId, email });

    // Step 3: Critical security check - ensure user can only reactivate their own account
    if (authenticatedUser.id !== userId || authenticatedUser.email !== email) {
      logStep("Authorization failed - user mismatch", { 
        authenticatedUserId: authenticatedUser.id, 
        requestedUserId: userId,
        authenticatedEmail: authenticatedUser.email,
        requestedEmail: email
      });
      throw new Error("Unauthorized: You can only reactivate your own account");
    }

    // Step 4: Validate input parameters
    const allowedPlans = ['basic', 'premium'];
    const allowedCycles = ['monthly', 'yearly'];
    
    if (!planType || !allowedPlans.includes(planType.toLowerCase())) {
      logStep("Invalid plan type", { planType, allowedPlans });
      throw new Error(`Invalid plan type. Must be one of: ${allowedPlans.join(', ')}`);
    }
    
    if (!billingCycle || !allowedCycles.includes(billingCycle.toLowerCase())) {
      logStep("Invalid billing cycle", { billingCycle, allowedCycles });
      throw new Error(`Invalid billing cycle. Must be one of: ${allowedCycles.join(', ')}`);
    }

    if (!userId || !email) {
      throw new Error("userId e email são obrigatórios para reativação");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurado");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Verificar se o usuário existe na tabela users
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError || !userRecord) {
      logStep("User not found in users table", { userId, error: userError });
      throw new Error("Usuário não encontrado");
    }

    logStep("User found", { userId: userRecord.user_id, email: userRecord.email });

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Definir preços baseados no plano e ciclo
    const priceMap = {
      basic: {
        monthly: 1990, // R$ 19.90 em centavos
        yearly: 19990  // R$ 199.90 em centavos
      },
      premium: {
        monthly: 2990, // R$ 29.90 em centavos
        yearly: 28990  // R$ 289.90 em centavos
      }
    };

    const price = priceMap[planType as keyof typeof priceMap]?.[billingCycle as keyof typeof priceMap.basic];
    if (!price) {
      throw new Error(`Configuração de preço inválida: ${planType} - ${billingCycle}`);
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Verificar se já existe customer para este email no Stripe
    let customerId;
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId, email });
    }

    // Criar sessão do Stripe para reativação
    const sessionConfig: any = {
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Plano ${planType === 'basic' ? 'Básico' : 'Premium'}`,
              description: `Reativação ${billingCycle === 'monthly' ? 'mensal' : 'anual'} - Continue aproveitando o Bolsofy!`
            },
            unit_amount: price,
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 'year'
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/repayment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/recover`,
      metadata: {
        planType,
        billingCycle,
        userId,
        reactivation: 'true'
      }
    };

    // Se temos customer existente, usar ele; senão, pré-preencher email
    if (customerId) {
      sessionConfig.customer = customerId;
    } else {
      sessionConfig.customer_email = email;
      logStep("Using email for checkout", { email });
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Stripe session created for reactivation", { sessionId: session.id, url: session.url, userId });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in reactivate-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});