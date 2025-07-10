
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
    const { phoneNumber } = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Check if user exists with this phone number
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('phone_number', phoneNumber)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Conta não encontrada com este número" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Mask the email
    const maskEmail = (email: string) => {
      const [localPart, domain] = email.split('@');
      if (localPart.length <= 3) {
        return `***@${domain}`;
      }
      const visiblePart = localPart.slice(-2);
      return `***${visiblePart}@${domain}`;
    };

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store the code in auth_codes table
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    await supabase
      .from('auth_codes')
      .delete()
      .eq('phone_number', phoneNumber);

    const { error: insertError } = await supabase
      .from('auth_codes')
      .insert({
        phone_number: phoneNumber,
        token: code,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      throw insertError;
    }

    // Here you would normally send an email with the code
    // For now, we'll just log it
    console.log(`Verification code for ${phoneNumber}: ${code}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        maskedEmail: maskEmail(user.email || 'email@domain.com')
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
