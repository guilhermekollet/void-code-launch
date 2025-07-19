-- Remove the incorrect unique constraint on user_id that's preventing multiple transactions per user
-- This constraint should not exist as users should be able to have multiple transactions
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_key;