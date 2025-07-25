-- Remover o trigger problemático que usa a extensão net
DROP TRIGGER IF EXISTS trigger_welcome_email_after_user_creation ON auth.users;
DROP FUNCTION IF EXISTS public.trigger_welcome_email();