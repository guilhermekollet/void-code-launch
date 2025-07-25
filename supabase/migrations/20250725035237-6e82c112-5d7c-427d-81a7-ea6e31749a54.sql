-- Corrigir problema de search_path na função trigger_welcome_email
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_catalog';