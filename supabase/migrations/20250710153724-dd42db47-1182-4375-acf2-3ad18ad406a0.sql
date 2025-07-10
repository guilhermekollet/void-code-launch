
-- Adicionar coluna registration_stage na tabela onboarding para rastrear o progresso do usuário
ALTER TABLE public.onboarding 
ADD COLUMN registration_stage TEXT NOT NULL DEFAULT 'email';

-- Adicionar índice para melhor performance nas consultas por email e stage
CREATE INDEX idx_onboarding_email_stage ON public.onboarding(email, registration_stage);

-- Comentário: Os estágios serão:
-- 'email' - usuário inseriu email
-- 'phone' - usuário inseriu telefone  
-- 'plan' - usuário escolheu plano
-- 'payment' - usuário foi para pagamento
-- 'completed' - pagamento confirmado
