
-- Criar políticas RLS para a tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários atualizem apenas seus próprios dados
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir inserção de novos perfis
CREATE POLICY "Enable insert for authenticated users only" ON public.users
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Função para chamar a edge function handle-new-user em vez de inserir diretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  response_data jsonb;
BEGIN
  -- Chama a edge function handle-new-user que tem toda a lógica necessária
  -- incluindo verificação do Stripe e envio de email de boas-vindas
  SELECT content::jsonb INTO response_data
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url') || '/functions/v1/handle-new-user',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
    ],
    'application/json',
    jsonb_build_object('record', to_jsonb(new))::text
  )::http_request);
  
  -- Se a edge function falhar, ainda assim insere o registro básico para não bloquear o signup
  IF response_data IS NULL OR (response_data->>'success')::boolean IS NOT TRUE THEN
    INSERT INTO public.users (user_id, email, phone_number, name, completed_onboarding)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'phone_number', ''),
      COALESCE(new.raw_user_meta_data->>'name', ''),
      false
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
