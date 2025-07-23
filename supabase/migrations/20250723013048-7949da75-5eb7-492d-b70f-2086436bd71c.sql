-- Remove last_used_credit_card_id column from users table
ALTER TABLE public.users DROP COLUMN IF EXISTS last_used_credit_card_id;