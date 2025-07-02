
-- Corrigir o constraint da tabela credit_card_bills para aceitar os status corretos
ALTER TABLE public.credit_card_bills 
DROP CONSTRAINT IF EXISTS credit_card_bills_status_check;

-- Adicionar o constraint correto com todos os status válidos
ALTER TABLE public.credit_card_bills 
ADD CONSTRAINT credit_card_bills_status_check 
CHECK (status IN ('open', 'closed', 'paid', 'overdue', 'pending'));

-- Limpar dados de teste que podem ter status inválidos
DELETE FROM public.credit_card_bills 
WHERE status NOT IN ('open', 'closed', 'paid', 'overdue', 'pending');
