
-- Criar tabela para cartões de crédito
CREATE TABLE public.credit_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  card_name TEXT,
  close_date INTEGER, -- dia do mês (1-31)
  due_date INTEGER NOT NULL, -- dia do mês (1-31)
  card_type TEXT NOT NULL DEFAULT 'Outro' CHECK (card_type IN ('VISA', 'Mastercard', 'Outro')),
  color TEXT NOT NULL DEFAULT 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar colunas à tabela transactions para suportar cartões de crédito
ALTER TABLE public.transactions 
ADD COLUMN credit_card_id INTEGER REFERENCES public.credit_cards(id) ON DELETE SET NULL,
ADD COLUMN is_credit_card_expense BOOLEAN DEFAULT false,
ADD COLUMN installment_billing_date DATE;

-- Habilitar Row Level Security para credit_cards
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para credit_cards
CREATE POLICY "Users can view their own credit cards" ON public.credit_cards
FOR SELECT USING (user_id IN (
  SELECT id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their own credit cards" ON public.credit_cards
FOR INSERT WITH CHECK (user_id IN (
  SELECT id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own credit cards" ON public.credit_cards
FOR UPDATE USING (user_id IN (
  SELECT id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own credit cards" ON public.credit_cards
FOR DELETE USING (user_id IN (
  SELECT id FROM public.users WHERE user_id = auth.uid()
));

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_credit_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW EXECUTE FUNCTION update_credit_cards_updated_at();
