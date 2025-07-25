-- Adicionar colunas birth_date e city à tabela users
ALTER TABLE public.users 
ADD COLUMN birth_date DATE,
ADD COLUMN city TEXT;