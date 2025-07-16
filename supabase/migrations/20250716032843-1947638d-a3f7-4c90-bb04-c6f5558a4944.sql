
-- Adicionar coluna sended_email na tabela onboarding
ALTER TABLE public.onboarding 
ADD COLUMN sended_email BOOLEAN DEFAULT FALSE;
