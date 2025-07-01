-- Add close_date column to credit_card_bills table
ALTER TABLE public.credit_card_bills 
ADD COLUMN close_date date;

-- Add RLS policies for credit_card_bills
ALTER TABLE public.credit_card_bills ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own bills
CREATE POLICY "Users can view their own credit card bills" 
ON public.credit_card_bills 
FOR SELECT 
USING (user_id IN (
  SELECT users.id FROM users WHERE users.user_id = auth.uid()
));

-- Policy to allow users to update their own bills (for payments)
CREATE POLICY "Users can update their own credit card bills" 
ON public.credit_card_bills 
FOR UPDATE 
USING (user_id IN (
  SELECT users.id FROM users WHERE users.user_id = auth.uid()
));

-- Policy to allow the system to insert bills
CREATE POLICY "Users can insert their own credit card bills" 
ON public.credit_card_bills 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT users.id FROM users WHERE users.user_id = auth.uid()
));