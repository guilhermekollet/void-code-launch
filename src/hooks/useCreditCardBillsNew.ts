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
  close_date: string;
  status: 'open' | 'closed' | 'paid' | 'overdue';
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

export function useCreditCardBills() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-card-bills-new'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) throw new Error('User not found');

      // Generate bills based on actual transactions
      await generateRealBills(userData.id);

      // Fetch current and upcoming bills (last 1 month + next 2 months)
      const today = new Date();
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const twoMonthsAhead = new Date(today);
      twoMonthsAhead.setMonth(twoMonthsAhead.getMonth() + 2);

      const { data, error } = await supabase
        .from('credit_card_bills')
        .select(`
          *,
          credit_cards (
            bank_name,
            card_name,
            color,
            due_date,
            close_date
          )
        `)
        .eq('user_id', userData.id)
        .gte('due_date', oneMonthAgo.toISOString().split('T')[0])
        .lte('due_date', twoMonthsAhead.toISOString().split('T')[0])
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

async function generateRealBills(userId: number) {
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

  // Group transactions by credit card and billing period
  for (const creditCard of creditCards) {
    const cardTransactions = transactions.filter(t => t.credit_card_id === creditCard.id);
    if (cardTransactions.length === 0) continue;

    // Calculate bill periods for this card
    const billPeriods = new Map();

    for (const transaction of cardTransactions) {
      const installments = transaction.installments || 1;
      const installmentValue = transaction.installment_value || transaction.amount;

      // Calculate each installment billing
      for (let i = 0; i < installments; i++) {
        const installmentDate = new Date(transaction.tx_date);
        installmentDate.setMonth(installmentDate.getMonth() + i);
        
        const { closeDate, dueDate, billKey } = calculateBillPeriod(installmentDate, creditCard);
        
        if (!billPeriods.has(billKey)) {
          billPeriods.set(billKey, {
            credit_card_id: creditCard.id,
            user_id: userId,
            close_date: closeDate,
            due_date: dueDate,
            bill_amount: 0,
            paid_amount: 0,
            remaining_amount: 0,
            status: getBillStatus(closeDate, dueDate)
          });
        }

        const bill = billPeriods.get(billKey);
        bill.bill_amount += installmentValue;
        bill.remaining_amount += installmentValue;
      }
    }

    // Insert or update bills
    for (const bill of billPeriods.values()) {
      // Only create bills that are within the relevant time frame
      const billDate = new Date(bill.due_date);
      const today = new Date();
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const sixMonthsAhead = new Date(today);
      sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);

      if (billDate < threeMonthsAgo || billDate > sixMonthsAhead) {
        continue;
      }

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
            status: getBillStatus(bill.close_date, bill.due_date),
            close_date: bill.close_date
          })
          .eq('id', existingBill.id);
      } else {
        // Create new bill only if there are transactions
        if (bill.bill_amount > 0) {
          await supabase
            .from('credit_card_bills')
            .insert({
              ...bill,
              close_date: bill.close_date
            });
        }
      }
    }
  }
}

function calculateBillPeriod(transactionDate: Date, creditCard: any) {
  const closeDay = creditCard.close_date || Math.max(1, creditCard.due_date - 7);
  const dueDay = creditCard.due_date;
  
  let closeMonth = transactionDate.getMonth();
  let closeYear = transactionDate.getFullYear();
  
  // If transaction is after close date, it goes to next bill
  if (transactionDate.getDate() > closeDay) {
    closeMonth += 1;
    if (closeMonth > 11) {
      closeMonth = 0;
      closeYear += 1;
    }
  }
  
  // Due date is always after close date
  let dueMonth = closeMonth;
  let dueYear = closeYear;
  if (dueDay <= closeDay) {
    dueMonth += 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }
  
  const closeDate = new Date(closeYear, closeMonth, closeDay).toISOString().split('T')[0];
  const dueDate = new Date(dueYear, dueMonth, dueDay).toISOString().split('T')[0];
  const billKey = `${creditCard.id}-${closeDate}`;
  
  return { closeDate, dueDate, billKey };
}

function getBillStatus(closeDate: string, dueDate: string): 'open' | 'closed' | 'overdue' {
  const today = new Date();
  const close = new Date(closeDate);
  const due = new Date(dueDate);
  
  if (today < close) return 'open';
  if (today < due) return 'closed';
  return 'overdue';
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
      const newStatus = newRemainingAmount <= 0 ? 'paid' : bill.status;

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

      // Create expense transaction for the payment
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (userData) {
        await supabase
          .from('transactions')
          .insert({
            user_id: userData.id,
            amount: paymentAmount,
            description: `Pagamento de fatura - Cartão`,
            category: 'Cartão de Crédito',
            type: 'despesa',
            tx_date: new Date().toISOString(),
            is_credit_card_expense: false
          });
      }

      return { billId, paymentAmount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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

export function useBillExpenses() {
  const { data: bills = [] } = useCreditCardBills();
  
  const totalBillExpenses = bills
    .filter(bill => bill.status !== 'paid')
    .reduce((sum, bill) => sum + bill.remaining_amount, 0);
    
  return { totalBillExpenses };
}
