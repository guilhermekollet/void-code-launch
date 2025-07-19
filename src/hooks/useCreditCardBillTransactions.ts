
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCreditCardBillTransactions(creditCardId: number, billCloseDate: string, billDueDate: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-card-bill-transactions', creditCardId, billCloseDate, billDueDate],
    queryFn: async () => {
      if (!user || !creditCardId) return [];

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return [];

      // Calculate the billing period for this specific bill
      const closeDate = new Date(billCloseDate);
      const previousCloseDate = new Date(closeDate);
      previousCloseDate.setMonth(previousCloseDate.getMonth() - 1);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('credit_card_id', creditCardId)
        .eq('is_credit_card_expense', true)
        .gte('tx_date', previousCloseDate.toISOString())
        .lt('tx_date', closeDate.toISOString())
        .order('tx_date', { ascending: false });

      if (error) {
        console.error('Error fetching bill transactions:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user && !!creditCardId && !!billCloseDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
