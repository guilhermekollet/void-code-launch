
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    const { planType, billingCycle } = await req.json();
    logStep("Request received", { planType, billingCycle });

    // Map plan types and billing cycles to Stripe checkout URLs
    const checkoutUrls = {
      basic: {
        monthly: "https://buy.stripe.com/test_bJe28r23b5uk7G3bUafQI00",
        yearly: "https://buy.stripe.com/test_fZubJ16jrcWM2lJ8HYfQI01"
      },
      premium: {
        monthly: "https://buy.stripe.com/test_8x28wP37f0a00dB3nEfQI02",
        yearly: "https://buy.stripe.com/test_3cI4gz5fng8Ye4r1fwfQI03"
      }
    };

    const url = checkoutUrls[planType as keyof typeof checkoutUrls]?.[billingCycle as keyof typeof checkoutUrls.basic];
    
    if (!url) {
      throw new Error(`Invalid plan configuration: ${planType} - ${billingCycle}`);
    }

    logStep("Checkout URL found", { url });

    return new Response(JSON.stringify({ url }), {
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
