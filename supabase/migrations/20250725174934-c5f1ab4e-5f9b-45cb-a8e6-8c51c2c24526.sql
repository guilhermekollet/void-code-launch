-- Atualizar função para incluir campos faltantes com valores padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Inserir dados básicos do usuário com campos adicionais
  INSERT INTO public.users (
    user_id, 
    email, 
    phone_number, 
    name, 
    completed_onboarding,
    birth_date,
    city,
    insights_alerts,
    inactive_alerts
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone_number', ''),
    COALESCE(new.raw_user_meta_data->>'name', ''),
    false,
    (new.raw_user_meta_data->>'birth_date')::date,
    new.raw_user_meta_data->>'city',
    true,
    true
  );

  -- Chamar a edge function handle-new-user de forma assíncrona para processar dados adicionais
  PERFORM pg_notify('new_user_created', json_build_object(
    'record', to_json(new)
  )::text);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;