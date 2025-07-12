
-- Adicionar trigger para sincronizar dados entre users e subscriptions
CREATE OR REPLACE FUNCTION sync_user_subscription_data()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar triggers para sincronização automática
DROP TRIGGER IF EXISTS sync_subscription_to_user ON public.subscriptions;
CREATE TRIGGER sync_subscription_to_user
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_subscription_data();

DROP TRIGGER IF EXISTS sync_user_to_subscription ON public.users;
CREATE TRIGGER sync_user_to_subscription
  AFTER UPDATE ON public.users
  FOR each ROW
  EXECUTE FUNCTION sync_user_subscription_data();

-- Adicionar políticas RLS para subscriptions se não existirem
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
FOR SELECT
USING (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
FOR UPDATE
USING (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Insert subscriptions for authenticated users" ON public.subscriptions;
CREATE POLICY "Insert subscriptions for authenticated users" ON public.subscriptions
FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()));
