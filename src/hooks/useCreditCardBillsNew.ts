
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CreditCardBill {
  id: number;
  user_id: number;
  credit_card_id: number;
  bill_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  close_date: string | null;
  status: string;
  archived: boolean | null;
  created_at: string;
  updated_at: string;
  credit_cards: {
    bank_name: string;
    card_name: string | null;
    color: string;
    due_date: number;
    close_date: number | null;
  };
}

export function useCreditCardBillsNew() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-card-bills-new'],
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

      const today = new Date();
      const bills: CreditCardBill[] = [];

      // Generate bills for each credit card for the next 12 months
      for (const card of creditCards) {
        for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
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

          // Calculate bill amount - now using 'value' instead of 'amount'
          const billAmount = transactions?.reduce((sum, transaction) => {
            return sum + Number(transaction.value);
          }, 0) || 0;

          // Skip bills with no transactions and future bills
          if (billAmount === 0 && dueDate > today) continue;

          // Check if bill already exists in database
          const { data: existingBill } = await supabase
            .from('credit_card_bills')
            .select('*')
            .eq('credit_card_id', card.id)
            .eq('due_date', dueDate.toISOString().split('T')[0])
            .maybeSingle();

          if (existingBill) {
            // Use existing bill data
            bills.push({
              ...existingBill,
              credit_cards: {
                bank_name: card.bank_name,
                card_name: card.card_name,
                color: card.color,
                due_date: card.due_date,
                close_date: card.close_date,
              }
            });
          } else if (billAmount > 0) {
            // Create new bill if there are transactions
            const newBill = {
              id: Date.now() + Math.random(), // Temporary ID for new bills
              user_id: userData.id,
              credit_card_id: card.id,
              bill_amount: billAmount,
              paid_amount: 0,
              remaining_amount: billAmount,
              due_date: dueDate.toISOString().split('T')[0],
              close_date: card.close_date ? closeDate.toISOString().split('T')[0] : null,
              status: dueDate < today ? 'overdue' : 'pending',
              archived: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              credit_cards: {
                bank_name: card.bank_name,
                card_name: card.card_name,
                color: card.color,
                due_date: card.due_date,
                close_date: card.close_date,
              }
            };

            bills.push(newBill);
          }
        }
      }

      return bills.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGenerateAndSaveBills() {
  const { user } = useAuth();

  return async () => {
    if (!user) throw new Error('User not authenticated');

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!userData) throw new Error('User not found');

    // Get all user's credit cards
    const { data: creditCards } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userData.id);

    if (!creditCards?.length) return;

    const today = new Date();
    const billsToSave = [];

    // Generate bills for each credit card for the next 12 months
    for (const card of creditCards) {
      for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
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

        // Calculate bill amount
        const billValue = transactions?.reduce((sum, transaction) => {
          return sum + Number(transaction.value);
        }, 0) || 0;

        // Skip bills with no transactions
        if (billValue === 0) continue;

        // Check if bill already exists
        const { data: existingBill } = await supabase
          .from('credit_card_bills')
          .select('id')
          .eq('credit_card_id', card.id)
          .eq('due_date', dueDate.toISOString().split('T')[0])
          .maybeSingle();

        if (!existingBill) {
          billsToSave.push({
            user_id: userData.id,
            credit_card_id: card.id,
            bill_amount: billValue,
            paid_amount: 0,
            remaining_amount: billValue,
            due_date: dueDate.toISOString().split('T')[0],
            close_date: card.close_date ? closeDate.toISOString().split('T')[0] : null,
            status: dueDate < today ? 'overdue' : 'pending',
          });
        }
      }
    }

    // Save all bills to database
    if (billsToSave.length > 0) {
      const { error } = await supabase
        .from('credit_card_bills')
        .insert(billsToSave);

      if (error) {
        console.error('Error saving bills:', error);
        throw error;
      }
    }

    return billsToSave.length;
  };
}
