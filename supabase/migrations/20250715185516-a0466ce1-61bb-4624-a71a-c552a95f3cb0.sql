
-- Adicionar coluna billing_cycle na tabela users
ALTER TABLE public.users 
ADD COLUMN billing_cycle TEXT DEFAULT 'monthly';

-- Adicionar constraint para garantir valores válidos
ALTER TABLE public.users 
ADD CONSTRAINT check_billing_cycle 
CHECK (billing_cycle IN ('monthly', 'yearly'));
