-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS trigger_generate_credit_card_bill_improved ON transactions;
DROP TRIGGER IF EXISTS recalculate_bills_on_update ON transactions;
DROP TRIGGER IF EXISTS recalculate_bills_on_delete ON transactions;
DROP FUNCTION IF EXISTS generate_credit_card_bill_improved(integer, date);
DROP FUNCTION IF EXISTS trigger_generate_credit_card_bill_improved();
DROP FUNCTION IF EXISTS recalculate_credit_card_bills();

-- Improved function to generate credit card bills
CREATE OR REPLACE FUNCTION generate_credit_card_bill_improved(card_id integer, transaction_date date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
    bill_id INTEGER;
    card_record RECORD;
    close_date_for_bill DATE;
    due_date_for_bill DATE;
    billing_start_date DATE;
    total_amount NUMERIC := 0;
    existing_bill_id INTEGER;
BEGIN
    -- Get card information
    SELECT * INTO card_record FROM credit_cards WHERE id = card_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Credit card not found';
    END IF;
    
    -- Calculate bill cycle dates based on transaction date
    -- Find the close date for the transaction
    close_date_for_bill := DATE_TRUNC('month', transaction_date) + (card_record.close_date - 1 || ' days')::INTERVAL;
    
    -- If transaction is after close date, move to next month's cycle
    IF transaction_date > close_date_for_bill THEN
        close_date_for_bill := close_date_for_bill + INTERVAL '1 month';
    END IF;
    
    -- Due date is close_date + due_date days (due_date represents days after close)
    due_date_for_bill := close_date_for_bill + (card_record.due_date || ' days')::INTERVAL;
    
    -- Billing period starts one month before close date
    billing_start_date := close_date_for_bill - INTERVAL '1 month' + INTERVAL '1 day';
    
    -- Check if bill already exists for this period
    SELECT id INTO existing_bill_id 
    FROM credit_card_bills 
    WHERE credit_card_id = card_id 
    AND close_date = close_date_for_bill;
    
    -- Calculate total amount for this billing period
    SELECT COALESCE(SUM(value), 0) INTO total_amount
    FROM transactions 
    WHERE credit_card_id = card_id 
    AND is_credit_card_expense = true
    AND tx_date >= billing_start_date 
    AND tx_date <= close_date_for_bill;
    
    IF existing_bill_id IS NOT NULL THEN
        -- Update existing bill
        UPDATE credit_card_bills 
        SET 
            bill_amount = total_amount,
            remaining_amount = total_amount - paid_amount,
            updated_at = now()
        WHERE id = existing_bill_id;
        
        RETURN existing_bill_id;
    ELSE
        -- Create new bill only if there are transactions
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
                due_date_for_bill,
                close_date_for_bill,
                total_amount,
                0,
                total_amount,
                'pending',
                false
            ) RETURNING id INTO bill_id;
            
            RETURN bill_id;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Trigger function for automatic bill generation
CREATE OR REPLACE FUNCTION trigger_generate_credit_card_bill_improved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
    -- Generate bill for credit card transactions
    IF NEW.is_credit_card_expense = true AND NEW.credit_card_id IS NOT NULL THEN
        PERFORM generate_credit_card_bill_improved(NEW.credit_card_id, NEW.tx_date::date);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to recalculate bills when transactions are updated/deleted
CREATE OR REPLACE FUNCTION recalculate_credit_card_bills()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
    affected_card_id INTEGER;
    affected_date DATE;
BEGIN
    -- Handle UPDATE operation
    IF TG_OP = 'UPDATE' THEN
        -- Recalculate for old card if it was a credit card transaction
        IF OLD.is_credit_card_expense = true AND OLD.credit_card_id IS NOT NULL THEN
            PERFORM generate_credit_card_bill_improved(OLD.credit_card_id, OLD.tx_date::date);
        END IF;
        
        -- Recalculate for new card if it's a credit card transaction
        IF NEW.is_credit_card_expense = true AND NEW.credit_card_id IS NOT NULL THEN
            PERFORM generate_credit_card_bill_improved(NEW.credit_card_id, NEW.tx_date::date);
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE operation
    IF TG_OP = 'DELETE' THEN
        IF OLD.is_credit_card_expense = true AND OLD.credit_card_id IS NOT NULL THEN
            PERFORM generate_credit_card_bill_improved(OLD.credit_card_id, OLD.tx_date::date);
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_generate_credit_card_bill_improved
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_credit_card_bill_improved();

CREATE TRIGGER recalculate_bills_on_update
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_credit_card_bills();

CREATE TRIGGER recalculate_bills_on_delete
    AFTER DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_credit_card_bills();