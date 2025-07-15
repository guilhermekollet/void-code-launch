
-- Corrigir dados do usuário existente baseado nos dados do onboarding
UPDATE public.users 
SET 
  plan_type = o.selected_plan,
  billing_cycle = o.billing_cycle,
  trial_start = COALESCE(o.trial_start_date, users.trial_start),
  trial_end = COALESCE(o.trial_end_date, users.trial_end),
  completed_onboarding = true
FROM public.onboarding o
WHERE users.email = o.email 
  AND o.payment_confirmed = true
  AND (users.plan_type IS NULL OR users.plan_type != o.selected_plan);

-- Sincronizar tabela subscriptions com dados corretos
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
)
SELECT 
  u.id,
  u.plan_type,
  CASE WHEN u.plan_type = 'free' THEN 'active' ELSE 'trialing' END,
  u.trial_start,
  u.trial_end,
  u.trial_start,
  u.trial_end,
  NULL,
  NULL
FROM public.users u
WHERE u.completed_onboarding = true 
  AND u.plan_type IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id)
ON CONFLICT (user_id) DO UPDATE SET
  plan_type = EXCLUDED.plan_type,
  status = EXCLUDED.status,
  trial_start = EXCLUDED.trial_start,
  trial_end = EXCLUDED.trial_end,
  updated_at = now();
