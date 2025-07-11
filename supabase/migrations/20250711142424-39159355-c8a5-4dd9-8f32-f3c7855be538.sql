
-- Adicionar colunas de controle de datas e trial na tabela onboarding
ALTER TABLE public.onboarding 
ADD COLUMN onboarding_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Atualizar registros existentes para ter onboarding_start_date
UPDATE public.onboarding 
SET onboarding_start_date = created_at 
WHERE onboarding_start_date IS NULL;

-- Adicionar colunas na tabela users para controle de trial
ALTER TABLE public.users
ADD COLUMN trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN stripe_session_id TEXT;

-- Criar índices para melhor performance
CREATE INDEX idx_onboarding_trial_dates ON public.onboarding(trial_start_date, trial_end_date);
CREATE INDEX idx_users_trial_dates ON public.users(trial_start, trial_end);

-- Função para atualizar last_updated_date automaticamente
CREATE OR REPLACE FUNCTION update_onboarding_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_date = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente last_updated_date
CREATE TRIGGER update_onboarding_last_updated_trigger
  BEFORE UPDATE ON public.onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_last_updated();
