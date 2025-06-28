
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CreditCardBill {
  id: number;
  user_id: number;
  credit_card_id: number;
  bill_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
  credit_cards: {
    bank_name: string;
    card_name: string | null;
    color: string;
  };
}

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

export function useCreditCardBills() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-card-bills'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) throw new Error('User not found');

      // Generate bills automatically based on credit card transactions
      await generateBillsFromTransactions(userData.id);

      const { data, error } = await supabase
        .from('credit_card_bills')
        .select(`
          *,
          credit_cards (
            bank_name,
            card_name,
            color
          )
        `)
        .eq('user_id', userData.id)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching credit card bills:', error);
        throw error;
      }

      return data as CreditCardBill[];
    },
    enabled: !!user,
  });
}

async function generateBillsFromTransactions(userId: number) {
  // Get all credit cards for this user
  const { data: creditCards } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', userId);

  if (!creditCards || creditCards.length === 0) return;

  // Get all credit card transactions from the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
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
          user_id: userId,
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
      .maybeSingle();

    if (existingBill) {
      // Update existing bill
      await supabase
        .from('credit_card_bills')
        .update({
          bill_amount: bill.bill_amount,
          remaining_amount: bill.bill_amount - existingBill.paid_amount,
          status: bill.status
        })
        .eq('id', existingBill.id);
    } else {
      // Create new bill
      await supabase
        .from('credit_card_bills')
        .insert(bill);
    }
  }
}

export function usePayBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ billId, paymentAmount }: { billId: number; paymentAmount: number }) => {
      if (!user) throw new Error('User not authenticated');

      // Get current bill details
      const { data: bill, error: billError } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('id', billId)
        .single();

      if (billError || !bill) throw new Error('Bill not found');

      const newPaidAmount = bill.paid_amount + paymentAmount;
      const newRemainingAmount = bill.bill_amount - newPaidAmount;
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'pending';

      // Update bill
      const { error } = await supabase
        .from('credit_card_bills')
        .update({
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus,
        })
        .eq('id', billId);

      if (error) throw error;

      return { billId, paymentAmount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error paying bill:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}
