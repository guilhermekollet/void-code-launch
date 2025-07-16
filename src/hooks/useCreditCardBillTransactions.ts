
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCreditCardBillTransactions(billId?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-card-bill-transactions', billId],
    queryFn: async () => {
      if (!user || !billId) return [];

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return [];

      // Get the bill details first
      const { data: bill } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('id', billId)
        .single();

      if (!bill) return [];

      // Calculate the billing period for this specific bill
      const closeDate = new Date(bill.close_date || bill.due_date);
      const previousCloseDate = new Date(closeDate);
      previousCloseDate.setMonth(previousCloseDate.getMonth() - 1);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .eq('credit_card_id', bill.credit_card_id)
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
    enabled: !!user && !!billId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
