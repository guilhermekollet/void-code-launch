-- Remove the incorrect foreign key constraint that's causing the 409 conflict
-- The transactions.id column should not be a foreign key
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_id_fkey;

-- Also check if there are any issues with the id sequence
-- Make sure the sequence is properly owned by the id column
ALTER SEQUENCE IF EXISTS transactions_id_seq OWNED BY transactions.id;

-- Set the current value of the sequence to avoid conflicts
SELECT setval('transactions_id_seq', COALESCE((SELECT MAX(id) FROM transactions), 0) + 1, false);