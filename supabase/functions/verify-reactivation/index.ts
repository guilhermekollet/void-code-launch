import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [VERIFY-REACTIVATION] ${step}${detailsStr}`);
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');
    
    const requestBody = await req.json();
    const { sessionId } = requestBody;
    
    logStep('Request received', { sessionId });
    
    // Enhanced input validation
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      logStep('ERROR: Missing or invalid session ID', { sessionId });
      throw new Error('Valid session ID is required');
    }
    
    // Sanitize sessionId to prevent injection
    if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
      logStep('ERROR: Invalid session ID format', { sessionId });
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
    logStep('Stripe session retrieved', { 
      sessionId,
      paymentStatus: session.payment_status, 
      metadata: session.metadata,
      customer: session.customer,
      subscription: session.subscription
    });

    if (session.payment_status === 'paid') {
      // Enhanced metadata validation with fallback
      const isReactivation = session.metadata?.reactivation === 'true';
      
      if (!isReactivation) {
        logStep('Session is not a reactivation', { metadata: session.metadata });
        throw new Error("Esta sessão não é uma reativação válida");
      }

      const userId = session.metadata.userId;
      const planType = session.metadata.planType || 'basic'; // fallback
      const billingCycle = session.metadata.billingCycle || 'monthly'; // fallback

      logStep('Processing reactivation', { userId, planType, billingCycle });

      if (!userId) {
        logStep('ERROR: UserId missing from metadata', { metadata: session.metadata });
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

      logStep('User reactivated successfully', { userId, planType, billingCycle });

      // Send welcome email after successful reactivation
      try {
        logStep('Attempting to send welcome email', { userId, email: session.customer_details?.email });
        
        // Get user details for welcome email
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('user_id', userId)
          .single();

        if (userData?.email && userData?.name) {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: userData.email,
              name: userData.name,
              planType: planType
            }
          });

          if (emailError) {
            logStep('Warning: Failed to send welcome email', { error: emailError });
          } else {
            logStep('Welcome email sent successfully', { email: userData.email });
          }
        } else {
          logStep('Warning: User data incomplete for welcome email', { userData });
        }
      } catch (emailErr) {
        logStep('Warning: Exception sending welcome email', { error: emailErr });
        // Don't fail the reactivation if email fails
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