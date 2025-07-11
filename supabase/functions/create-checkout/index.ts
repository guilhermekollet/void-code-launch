
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { planType, billingCycle, onboardingId } = await req.json();
    logStep("Request received", { planType, billingCycle, onboardingId });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurado");
    }

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
    
    // Criar sessão do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Plano ${planType === 'basic' ? 'Básico' : 'Premium'}`,
              description: `Assinatura ${billingCycle === 'monthly' ? 'mensal' : 'anual'}`
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
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/register`,
      metadata: {
        planType,
        billingCycle,
        onboardingId: onboardingId || ''
      }
    });

    logStep("Stripe session created", { sessionId: session.id, url: session.url });

    // Atualizar onboarding com session_id real
    if (onboardingId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false } }
      );

      const { error: updateError } = await supabase
        .from('onboarding')
        .update({ 
          stripe_session_id: session.id,
          registration_stage: 'payment',
          updated_at: new Date().toISOString()
        })
        .eq('id', onboardingId);

      if (updateError) {
        logStep("Error updating onboarding", updateError);
      } else {
        logStep("Onboarding updated with session ID", { onboardingId, sessionId: session.id });
      }
    }

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
