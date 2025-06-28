
-- Adicionar campo para armazenar o último cartão utilizado
ALTER TABLE users 
ADD COLUMN last_used_credit_card_id INTEGER REFERENCES credit_cards(id);

-- Criar tabela para gerenciar faturas dos cartões
CREATE TABLE credit_card_bills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  credit_card_id INTEGER NOT NULL REFERENCES credit_cards(id),
  bill_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos para suporte a compras no cartão de crédito nas transações
ALTER TABLE transactions 
ADD COLUMN installments INTEGER DEFAULT 1,
ADD COLUMN installment_value NUMERIC;

-- Trigger para atualizar updated_at na tabela credit_card_bills
CREATE OR REPLACE FUNCTION update_credit_card_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credit_card_bills_updated_at_trigger
  BEFORE UPDATE ON credit_card_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_card_bills_updated_at();
