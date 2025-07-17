
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCreditCardBills() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-card-bills'],
    queryFn: async () => {
      if (!user) return [];

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return [];

      // Agora buscar faturas reais do banco de dados ao invés de gerar virtualmente
      const { data: bills, error } = await supabase
        .from('credit_card_bills')
        .select(`
          *,
          credit_cards!inner(*)
        `)
        .eq('user_id', userData.id)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching credit card bills:', error);
        return [];
      }

      return bills?.map(bill => ({
        id: bill.id,
        creditCard: bill.credit_cards,
        value: bill.bill_amount,
        dueDate: bill.due_date,
        closeDate: bill.close_date,
        status: bill.status,
        transactions: [] // As transações serão carregadas separadamente quando necessário
      })) || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
