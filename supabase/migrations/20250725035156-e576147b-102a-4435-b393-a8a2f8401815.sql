-- Adicionar novas colunas na tabela onboarding para data de nascimento e cidade
ALTER TABLE public.onboarding 
ADD COLUMN birth_date DATE,
ADD COLUMN city TEXT;

-- Criar trigger para envio automático de email de boas-vindas
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamar edge function send-welcome-email após criar usuário
  PERFORM 
    net.http_post(
      url := 'https://vkmyobxdztspftuamiyp.supabase.co/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'name', COALESCE(NEW.raw_user_meta_data->>'name', ''),
        'planType', COALESCE(NEW.raw_user_meta_data->>'plan_type', 'basic')
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que executa após inserção na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_welcome_email ON auth.users;
CREATE TRIGGER on_auth_user_created_welcome_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();