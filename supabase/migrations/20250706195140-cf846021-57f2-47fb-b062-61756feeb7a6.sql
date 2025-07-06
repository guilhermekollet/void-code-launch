
-- Adicionar coluna type na tabela categories para diferenciar receitas e despesas
ALTER TABLE categories ADD COLUMN type TEXT NOT NULL DEFAULT 'despesa';

-- Criar índice para melhorar performance nas consultas por tipo
CREATE INDEX idx_categories_type ON categories(type);

-- Adicionar constraint para garantir que type seja apenas 'receita' ou 'despesa'
ALTER TABLE categories ADD CONSTRAINT categories_type_check 
CHECK (type IN ('receita', 'despesa'));
