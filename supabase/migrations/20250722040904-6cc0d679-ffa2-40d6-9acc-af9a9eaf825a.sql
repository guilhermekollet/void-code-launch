-- Priority 1: Critical Security Fixes

-- 1. Enable RLS on n8n_chat_histories table and add proper policies
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Add policy for n8n_chat_histories (assuming session_id should be tied to user)
-- Since there's no direct user_id, we'll restrict to service role only for now
CREATE POLICY "Service role can manage chat histories" ON public.n8n_chat_histories
FOR ALL USING (auth.role() = 'service_role');

-- 2. Fix Database Functions Security - Add proper search_path and security settings
CREATE OR REPLACE FUNCTION public.update_ai_agent_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'
AS $function$
BEGIN
  INSERT INTO public.users (user_id, email, phone_number, name, completed_onboarding)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone_number', ''),
    COALESCE(new.raw_user_meta_data->>'name', ''),
    false
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_credit_cards_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_credit_card_bills_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_onboarding_last_updated()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.last_updated_date = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_user_subscription_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Quando subscriptions é atualizada, sincronizar com users
  IF TG_TABLE_NAME = 'subscriptions' THEN
    UPDATE public.users 
    SET 
      plan_type = NEW.plan_type,
      updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
  
  -- Quando users é atualizada com dados de subscription, sincronizar com subscriptions
  IF TG_TABLE_NAME = 'users' AND (OLD.plan_type IS DISTINCT FROM NEW.plan_type) THEN
    INSERT INTO public.subscriptions (
      user_id, 
      plan_type, 
      status, 
      trial_start, 
      trial_end,
      current_period_start,
      current_period_end,
      stripe_customer_id,
      stripe_subscription_id
    ) VALUES (
      NEW.id,
      NEW.plan_type,
      CASE WHEN NEW.plan_type = 'free' THEN 'active' ELSE 'trialing' END,
      NEW.trial_start,
      NEW.trial_end,
      NEW.trial_start,
      NEW.trial_end,
      NULL,
      NULL
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan_type = EXCLUDED.plan_type,
      status = EXCLUDED.status,
      trial_start = EXCLUDED.trial_start,
      trial_end = EXCLUDED.trial_end,
      updated_at = now();
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_credit_card_bill(card_id integer, due_date_param date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.trigger_generate_credit_card_bill()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_credit_card_bill_amounts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'pg_catalog'
AS $function$
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
$function$;