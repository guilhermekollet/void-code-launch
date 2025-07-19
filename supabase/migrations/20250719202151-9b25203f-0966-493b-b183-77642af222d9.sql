-- Remover foreign key circular problemático
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_id_fkey1;

-- Corrigir a foreign key da tabela transactions para referenciar auth.users diretamente
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Corrigir a foreign key da tabela balances para referenciar auth.users diretamente  
ALTER TABLE public.balances DROP CONSTRAINT IF EXISTS balances_user_id_fkey;
ALTER TABLE public.balances ADD CONSTRAINT balances_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;