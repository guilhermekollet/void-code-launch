
-- Create onboarding table to track pre-registration data
CREATE TABLE public.onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  selected_plan TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  payment_confirmed BOOLEAN DEFAULT false,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY;

-- Create policy for edge functions to insert onboarding data
CREATE POLICY "insert_onboarding" ON public.onboarding
FOR INSERT
WITH CHECK (true);

-- Create policy for edge functions to update onboarding data
CREATE POLICY "update_onboarding" ON public.onboarding
FOR UPDATE
USING (true);

-- Create policy for users to view their onboarding data (if needed)
CREATE POLICY "select_onboarding" ON public.onboarding
FOR SELECT
USING (true);

-- Create index for better performance
CREATE INDEX idx_onboarding_email ON public.onboarding(email);
CREATE INDEX idx_onboarding_phone ON public.onboarding(phone);
CREATE INDEX idx_onboarding_stripe_session ON public.onboarding(stripe_session_id);
