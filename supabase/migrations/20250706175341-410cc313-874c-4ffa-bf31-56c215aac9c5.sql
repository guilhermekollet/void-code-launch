
-- Adicionar coluna archived para permitir arquivar faturas pagas
ALTER TABLE credit_card_bills ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Criar tabela de histórico de pagamentos da fatura
CREATE TABLE bill_payments (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES credit_card_bills(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar RLS policies para bill_payments
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

-- Policy para visualizar próprios pagamentos
CREATE POLICY "Users can view their own bill payments" 
  ON bill_payments 
  FOR SELECT 
  USING (user_id IN (SELECT users.id FROM users WHERE users.user_id = auth.uid()));

-- Policy para inserir próprios pagamentos
CREATE POLICY "Users can insert their own bill payments" 
  ON bill_payments 
  FOR INSERT 
  WITH CHECK (user_id IN (SELECT users.id FROM users WHERE users.user_id = auth.uid()));

-- Policy para deletar próprios pagamentos (para desfazer)
CREATE POLICY "Users can delete their own bill payments" 
  ON bill_payments 
  FOR DELETE 
  USING (user_id IN (SELECT users.id FROM users WHERE users.user_id = auth.uid()));

-- Criar índice para melhor performance
CREATE INDEX idx_bill_payments_bill_id ON bill_payments(bill_id);
CREATE INDEX idx_bill_payments_user_id ON bill_payments(user_id);
