
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CreditCardTransaction {
  id: number;
  amount: number;
  credit_card_id: number;
  tx_date: string;
  installments: number;
  installment_value: number;
  description: string;
}

export function useGenerateCreditCardBills() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const calculateBillDueDate = (transactionDate: Date, creditCardDueDate: number) => {
    const txDate = new Date(transactionDate);
    const currentMonth = txDate.getMonth();
    const currentYear = txDate.getFullYear();
    
    // Se a compra foi feita antes do dia de fechamento, vai para a próxima fatura
    // Se foi depois, vai para a fatura do mês seguinte
    const closeDate = Math.max(1, creditCardDueDate - 7); // Assumindo que fechamento é 7 dias antes do vencimento
    
    let billMonth = currentMonth;
    let billYear = currentYear;
    
    if (txDate.getDate() > closeDate) {
      billMonth += 1;
      if (billMonth > 11) {
        billMonth = 0;
        billYear += 1;
      }
    }
    
    return new Date(billYear, billMonth, creditCardDueDate);
  };

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) throw new Error('User not found');

      // Get all credit cards
      const { data: creditCards } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', userData.id);

      if (!creditCards || creditCards.length === 0) return;

      // Get all credit card transactions from the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .eq('is_credit_card_expense', true)
        .gte('tx_date', twelveMonthsAgo.toISOString())
        .order('tx_date', { ascending: true });

      if (!transactions || transactions.length === 0) return;

      // Group transactions by credit card and calculate bills
      const billsToCreate = new Map();

      for (const transaction of transactions) {
        const creditCard = creditCards.find(card => card.id === transaction.credit_card_id);
        if (!creditCard) continue;

        const installments = transaction.installments || 1;
        const installmentValue = transaction.installment_value || transaction.amount;

        // Calculate each installment bill
        for (let i = 0; i < installments; i++) {
          const installmentDate = new Date(transaction.tx_date);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          const dueDate = calculateBillDueDate(installmentDate, creditCard.due_date);
          const billKey = `${transaction.credit_card_id}-${dueDate.getFullYear()}-${dueDate.getMonth()}`;

          if (!billsToCreate.has(billKey)) {
            billsToCreate.set(billKey, {
              user_id: userData.id,
              credit_card_id: transaction.credit_card_id,
              bill_amount: 0,
              paid_amount: 0,
              remaining_amount: 0,
              due_date: dueDate.toISOString().split('T')[0],
              status: dueDate < new Date() ? 'overdue' : 'pending'
            });
          }

          const bill = billsToCreate.get(billKey);
          bill.bill_amount += installmentValue;
          bill.remaining_amount += installmentValue;
        }
      }

      // Insert or update bills
      const bills = Array.from(billsToCreate.values());
      
      for (const bill of bills) {
        // Check if bill already exists
        const { data: existingBill } = await supabase
          .from('credit_card_bills')
          .select('id, paid_amount')
          .eq('user_id', bill.user_id)
          .eq('credit_card_id', bill.credit_card_id)
          .eq('due_date', bill.due_date)
          .single();

        if (existingBill) {
          // Update existing bill
          await supabase
            .from('credit_card_bills')
            .update({
              bill_amount: bill.bill_amount,
              remaining_amount: bill.bill_amount - existingBill.paid_amount
            })
            .eq('id', existingBill.id);
        } else {
          // Create new bill
          await supabase
            .from('credit_card_bills')
            .insert(bill);
        }
      }

      return bills;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
      toast({
        title: "Sucesso",
        description: "Faturas dos cartões atualizadas!",
      });
    },
    onError: (error) => {
      console.error('Error generating credit card bills:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar faturas dos cartões.",
        variant: "destructive",
      });
    },
  });
}
