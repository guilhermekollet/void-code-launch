
-- Corrigir a estrutura da tabela auth_codes
-- Alterar o tipo da coluna token de UUID para TEXT para armazenar códigos de 4 dígitos
ALTER TABLE auth_codes ALTER COLUMN token TYPE TEXT;

-- Verificar se a estrutura está correta
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'auth_codes' 
ORDER BY ordinal_position;
