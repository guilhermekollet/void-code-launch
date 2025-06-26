
-- Criar tabela para configurações do agente de IA
CREATE TABLE public.ai_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar Row Level Security
ALTER TABLE public.ai_agent_settings ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias configurações
CREATE POLICY "Users can view own AI settings" ON public.ai_agent_settings
FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários atualizarem apenas suas próprias configurações
CREATE POLICY "Users can update own AI settings" ON public.ai_agent_settings
FOR UPDATE USING (auth.uid() = user_id);

-- Política para inserção de configurações
CREATE POLICY "Users can insert own AI settings" ON public.ai_agent_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_agent_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_agent_settings_updated_at
  BEFORE UPDATE ON public.ai_agent_settings
  FOR EACH ROW EXECUTE FUNCTION update_ai_agent_settings_updated_at();
