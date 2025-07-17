-- Modificação para gerar faturas automaticamente baseado nas transações de cartão
-- Criar função para gerar faturas de cartão automaticamente

CREATE OR REPLACE FUNCTION generate_credit_card_bill(card_id INTEGER, due_date_param DATE)
RETURNS INTEGER AS $$
DECLARE
    bill_id INTEGER;
    card_record RECORD;
    close_date_for_bill DATE;
    billing_start_date DATE;
    total_amount NUMERIC := 0;
    existing_bill_id INTEGER;
BEGIN
    -- Buscar informações do cartão
    SELECT * INTO card_record FROM credit_cards WHERE id = card_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cartão de crédito não encontrado';
    END IF;
    
    -- Calcular data de fechamento para esta fatura
    close_date_for_bill := due_date_param - INTERVAL '1 month' + (card_record.close_date || ' days')::INTERVAL;
    
    -- Data de início do período de faturamento (1 mês antes do fechamento)
    billing_start_date := close_date_for_bill - INTERVAL '1 month';
    
    -- Verificar se já existe uma fatura para este período
    SELECT id INTO existing_bill_id 
    FROM credit_card_bills 
    WHERE credit_card_id = card_id 
    AND due_date = due_date_param;
    
    IF existing_bill_id IS NOT NULL THEN
        RETURN existing_bill_id;
    END IF;
    
    -- Calcular o valor total da fatura baseado nas transações
    SELECT COALESCE(SUM(value), 0) INTO total_amount
    FROM transactions 
    WHERE credit_card_id = card_id 
    AND is_credit_card_expense = true
    AND tx_date >= billing_start_date 
    AND tx_date < close_date_for_bill;
    
    -- Criar a fatura somente se há transações
    IF total_amount > 0 THEN
        INSERT INTO credit_card_bills (
            credit_card_id,
            user_id,
            due_date,
            close_date,
            bill_amount,
            paid_amount,
            remaining_amount,
            status,
            archived
        ) VALUES (
            card_id,
            card_record.user_id,
            due_date_param,
            close_date_for_bill,
            total_amount,
            0,
            total_amount,
            'pending',
            false
        ) RETURNING id INTO bill_id;
        
        RETURN bill_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar faturas automaticamente quando transações de cartão são inseridas
CREATE OR REPLACE FUNCTION trigger_generate_credit_card_bill()
RETURNS TRIGGER AS $$
DECLARE
    card_record RECORD;
    current_due_date DATE;
    next_due_date DATE;
BEGIN
    -- Verificar se é uma transação de cartão de crédito
    IF NEW.is_credit_card_expense = true AND NEW.credit_card_id IS NOT NULL THEN
        -- Buscar informações do cartão
        SELECT * INTO card_record FROM credit_cards WHERE id = NEW.credit_card_id;
        
        IF FOUND THEN
            -- Calcular as datas de vencimento (atual e próxima)
            current_due_date := DATE_TRUNC('month', NEW.tx_date) + (card_record.due_date || ' days')::INTERVAL;
            
            -- Se a data de vencimento já passou este mês, usar o próximo mês
            IF current_due_date <= NEW.tx_date THEN
                current_due_date := current_due_date + INTERVAL '1 month';
            END IF;
            
            next_due_date := current_due_date + INTERVAL '1 month';
            
            -- Gerar faturas para este mês e próximo
            PERFORM generate_credit_card_bill(NEW.credit_card_id, current_due_date);
            PERFORM generate_credit_card_bill(NEW.credit_card_id, next_due_date);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
DROP TRIGGER IF EXISTS auto_generate_credit_card_bills ON transactions;
CREATE TRIGGER auto_generate_credit_card_bills
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_credit_card_bill();

-- Também criar trigger para quando transações são atualizadas
CREATE OR REPLACE FUNCTION update_credit_card_bill_amounts()
RETURNS TRIGGER AS $$
DECLARE
    affected_bills RECORD;
BEGIN
    -- Recalcular valores das faturas afetadas
    FOR affected_bills IN 
        SELECT DISTINCT cb.id, cb.credit_card_id, cb.close_date, cb.due_date
        FROM credit_card_bills cb
        WHERE cb.credit_card_id IN (
            COALESCE(NEW.credit_card_id, OLD.credit_card_id)
        )
        AND cb.status != 'paid'
    LOOP
        -- Recalcular o valor da fatura
        UPDATE credit_card_bills 
        SET bill_amount = (
            SELECT COALESCE(SUM(value), 0)
            FROM transactions 
            WHERE credit_card_id = affected_bills.credit_card_id
            AND is_credit_card_expense = true
            AND tx_date >= (affected_bills.close_date - INTERVAL '1 month')
            AND tx_date < affected_bills.close_date
        ),
        remaining_amount = bill_amount - paid_amount,
        updated_at = now()
        WHERE id = affected_bills.id;
    END LOOP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar valores quando transações são modificadas ou deletadas
DROP TRIGGER IF EXISTS update_bill_amounts_on_transaction_change ON transactions;
CREATE TRIGGER update_bill_amounts_on_transaction_change
    AFTER UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_credit_card_bill_amounts();