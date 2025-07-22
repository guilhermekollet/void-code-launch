-- Fix remaining RLS policy issues

-- Check which tables have RLS enabled but no policies
-- Based on the linter results, we need to add policies for tables without them

-- Add missing policies for analytics table (if needed for application logic)
CREATE POLICY "Service role can manage analytics" ON public.analytics
FOR ALL USING (auth.role() = 'service_role');

-- Add missing policies for balances table (if needed for application logic)  
CREATE POLICY "Service role can manage balances" ON public.balances
FOR ALL USING (auth.role() = 'service_role');

-- Alternatively, if these tables should have user-specific access, add appropriate policies
-- For now, restricting to service role is the safest approach