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
  status: 'open' | 'closed' | 'paid' | 'overdue' | 'pending';
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

      // Show bills from current month and next 2 months only (more focused)
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);

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
        .gte('due_date', startDate.toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching credit card bills:', error);
        throw error;
      }

      return data as CreditCardBill[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });
}

async function generateRealBills(userId: number) {
  // Get all credit cards for this user
  const { data: creditCards } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', userId);

  if (!creditCards || creditCards.length === 0) return;

  // Get all credit card transactions from the last 2 months only (optimized timeframe)
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_credit_card_expense', true)
    .gte('tx_date', twoMonthsAgo.toISOString())
    .order('tx_date', { ascending: true });

  if (!transactions || transactions.length === 0) return;

  // Group transactions by credit card and billing period
  for (const creditCard of creditCards) {
    const cardTransactions = transactions.filter(t => t.credit_card_id === creditCard.id);
    if (cardTransactions.length === 0) continue;

    // Calculate bill periods for this card (limited to next 6 months only)
    const billPeriods = new Map();

    for (const transaction of cardTransactions) {
      const installments = transaction.installments || 1;
      const installmentValue = transaction.installment_value || transaction.amount;

      // Calculate each installment billing (limit to 6 months ahead)
      for (let i = 0; i < installments; i++) {
        const installmentDate = new Date(transaction.tx_date);
        installmentDate.setMonth(installmentDate.getMonth() + i);
        
        // Skip if installment is more than 6 months in the future
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        if (installmentDate > sixMonthsFromNow) continue;
        
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

// Melhorada a função getBillStatus para ser mais precisa
function getBillStatus(closeDate: string, dueDate: string): 'open' | 'closed' | 'overdue' | 'pending' {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa
  
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
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
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

// CORRIGIDA: Função para calcular despesas de fatura vigente apenas
export function useBillExpenses() {
  const { data: bills = [] } = useCreditCardBills();
  
  // Filtrar apenas faturas vigentes (não pagas e com vencimento próximo)
  const today = new Date();
  const in45Days = new Date();
  in45Days.setDate(today.getDate() + 45);
  
  const currentBills = bills.filter(bill => {
    const dueDate = new Date(bill.due_date);
    return (
      bill.status !== 'paid' && // Não foi paga
      dueDate >= today && // Não venceu ainda OU
      dueDate <= in45Days // Vence nos próximos 45 dias
    ) || (
      bill.status === 'overdue' && // OU está vencida
      bill.remaining_amount > 0 // E ainda tem saldo
    );
  });
  
  const totalBillExpenses = currentBills.reduce((sum, bill) => sum + bill.remaining_amount, 0);
    
  console.log('Current bills for expenses:', currentBills.length, 'Total:', totalBillExpenses);
    
  return { totalBillExpenses };
}
