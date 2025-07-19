
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CreditCardBill } from "./useCreditCardBillsNew";

export function useCurrentCreditCardBill(creditCardId: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current-credit-card-bill', creditCardId],
    queryFn: async () => {
      if (!user || !creditCardId) return null;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return null;

      // Get the current month's bill for this credit card
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Look for bills in current month and next month
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 2, 0);

      const { data, error } = await supabase
        .from('credit_card_bills')
        .select(`
          *,
          credit_cards (
            id,
            bank_name,
            card_name,
            color,
            due_date,
            close_date
          )
        `)
        .eq('user_id', userData.id)
        .eq('credit_card_id', creditCardId)
        .gte('due_date', startDate.toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current credit card bill:', error);
        return null;
      }

      if (!data) return null;

      // Type cast to ensure proper typing with status
      return {
        ...data,
        status: data.status as 'pending' | 'paid' | 'overdue' | 'partial'
      } as CreditCardBill;
    },
    enabled: !!user && !!creditCardId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
