
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

      // Get all user's credit cards
      const { data: creditCards } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', userData.id);

      if (!creditCards?.length) return [];

      const bills = [];
      const today = new Date();

      // Generate bills for each credit card for the next few months
      for (const card of creditCards) {
        // Generate bills for current and next 3 months
        for (let monthOffset = 0; monthOffset < 4; monthOffset++) {
          const billMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
          
          // Calculate close date for this bill
          let closeDate: Date;
          if (card.close_date) {
            closeDate = new Date(billMonth.getFullYear(), billMonth.getMonth(), card.close_date);
            // If close date has passed this month, move to next month
            if (closeDate < today && monthOffset === 0) {
              closeDate = new Date(billMonth.getFullYear(), billMonth.getMonth() + 1, card.close_date);
            }
          } else {
            // If no close date, use the end of the month
            closeDate = new Date(billMonth.getFullYear(), billMonth.getMonth() + 1, 0);
          }

          // Calculate due date (usually 1 month after close date)
          const dueDate = new Date(closeDate.getFullYear(), closeDate.getMonth() + 1, card.due_date);

          // Calculate the billing period start (1 month before close date)
          const billingPeriodStart = new Date(closeDate);
          billingPeriodStart.setMonth(billingPeriodStart.getMonth() - 1);

          // Get transactions for this billing period
          const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userData.id)
            .eq('credit_card_id', card.id)
            .eq('is_credit_card_expense', true)
            .gte('tx_date', billingPeriodStart.toISOString())
            .lt('tx_date', closeDate.toISOString());

          // Calculate bill value - now using 'value' instead of 'amount'
          const billValue = transactions?.reduce((sum, transaction) => {
            return sum + Number(transaction.value);
          }, 0) || 0;

          // Only include bills that have transactions or are current/overdue
          if (billValue > 0 || dueDate <= today) {
            bills.push({
              id: `${card.id}-${dueDate.toISOString().split('T')[0]}`,
              creditCard: card,
              value: billValue,
              dueDate: dueDate.toISOString().split('T')[0],
              closeDate: closeDate.toISOString().split('T')[0],
              status: dueDate < today ? 'overdue' : 'pending',
              transactions: transactions || []
            });
          }
        }
      }

      return bills.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
