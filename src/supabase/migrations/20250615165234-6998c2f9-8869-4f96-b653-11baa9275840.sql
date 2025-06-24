
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

-- Função para criar perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id, email, phone_number, name, completed_onboarding)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone_number', ''),
    COALESCE(new.raw_user_meta_data->>'name', ''),
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();