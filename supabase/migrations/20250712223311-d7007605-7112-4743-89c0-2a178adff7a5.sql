
-- Criar tabela para arquivar dados dos usuários
CREATE TABLE public.users_archive (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_user_id INTEGER NOT NULL,
  auth_user_id UUID,
  full_name TEXT,
  phone_number TEXT NOT NULL,
  email TEXT,
  plan_type TEXT,
  account_created_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para arquivar transações dos usuários
CREATE TABLE public.transactions_archive (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_transaction_id INTEGER NOT NULL,
  original_user_id INTEGER NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  value NUMERIC NOT NULL,
  tx_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  registered_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  type TEXT,
  is_recurring BOOLEAN,
  is_installment BOOLEAN,
  installments INTEGER,
  installment_number INTEGER,
  total_installments INTEGER,
  credit_card_info JSONB,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas de arquivo
ALTER TABLE public.users_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_archive ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permitir apenas inserção via edge functions
-- Usuários normais não devem ter acesso aos dados arquivados
CREATE POLICY "Service role can manage users_archive" 
  ON public.users_archive 
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage transactions_archive" 
  ON public.transactions_archive 
  FOR ALL 
  USING (auth.role() = 'service_role');
