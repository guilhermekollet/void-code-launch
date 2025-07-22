import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-REACTIVATION] ${step}${detailsStr}`);
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    // Input validation
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      throw new Error('Valid session ID is required');
    }
    
    // Sanitize sessionId to prevent injection
    if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
      throw new Error('Invalid session ID format');
    }
    
    logStep('Verifying reactivation for session', { sessionId });
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep('Stripe session status', { status: session.payment_status, sessionId });

    if (session.payment_status === 'paid' && session.metadata?.reactivation === 'true') {
      const userId = session.metadata.userId;
      const planType = session.metadata.planType;
      const billingCycle = session.metadata.billingCycle;

      logStep('Processing reactivation', { userId, planType, billingCycle });

      if (!userId) {
        throw new Error("UserId não encontrado nos metadados da sessão");
      }

      // Update user status to active
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ 
          plan_status: 'active',
          plan_type: planType,
          billing_cycle: billingCycle,
          stripe_session_id: sessionId
        })
        .eq('user_id', userId);

      if (updateUserError) {
        logStep('Error updating user status', updateUserError);
        throw updateUserError;
      }

      logStep('User status updated to active', { userId });

      // Get Stripe customer and subscription info if available
      let stripeCustomerId = null;
      let stripeSubscriptionId = null;

      if (session.customer && session.subscription) {
        stripeCustomerId = session.customer as string;
        stripeSubscriptionId = session.subscription as string;
        logStep('Stripe IDs found', { stripeCustomerId, stripeSubscriptionId });
      }

      // Try to update or create subscription record
      const { error: upsertSubscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_type: planType,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
        }, { 
          onConflict: 'user_id' 
        });

      if (upsertSubscriptionError) {
        logStep('Error upserting subscription', upsertSubscriptionError);
        // Continue even if subscription record fails, as user status was updated
      } else {
        logStep('Subscription record updated');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          session,
          userId,
          planType,
          billingCycle,
          message: "Reativação confirmada com sucesso!",
          reactivated: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } else {
      logStep('Payment not completed or not a reactivation', { 
        paymentStatus: session.payment_status,
        isReactivation: session.metadata?.reactivation 
      });
      return new Response(
        JSON.stringify({ success: false, error: "Reativação não foi concluída" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in verify-reactivation', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});