
-- Fix the transactions table to ensure id is auto-generated with proper sequence
-- First, ensure the sequence exists
CREATE SEQUENCE IF NOT EXISTS transactions_id_seq OWNED BY transactions.id;

-- Set the id column to use the sequence as default
ALTER TABLE public.transactions ALTER COLUMN id SET DEFAULT nextval('transactions_id_seq'::regclass);

-- Update the sequence to start from the current max id + 1 to avoid conflicts
SELECT setval('transactions_id_seq', COALESCE((SELECT MAX(id) FROM transactions), 0) + 1, false);
