
-- Remover a tabela auth_codes que não será mais necessária
DROP TABLE IF EXISTS auth_codes CASCADE;

-- Verificar se a remoção foi bem-sucedida
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'auth_codes';
