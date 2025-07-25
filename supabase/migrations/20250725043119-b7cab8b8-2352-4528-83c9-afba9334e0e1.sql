-- Remover trigger e função com CASCADE
DROP TRIGGER IF EXISTS on_auth_user_created_welcome_email ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.trigger_welcome_email() CASCADE;