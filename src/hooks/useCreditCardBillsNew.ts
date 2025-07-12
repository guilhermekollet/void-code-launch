
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CreditCardBill {
  id: number;
  credit_card_id: number;
  bill_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  close_date: string | null;
  status: 'pending' | 'paid' | 'overdue';
  archived: boolean | null;
  credit_cards: {
    id: number;
    bank_name: string;
    card_name: string | null;
    color: string;
  };
}

export function useCreditCardBills() {
  return useQuery({
    queryKey: ['credit-card-bills'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userProfile) throw new Error('User profile not found');

      const { data, error } = await supabase
        .from('credit_card_bills')
        .select(`
          *,
          credit_cards (
            id,
            bank_name,
            card_name,
            color
          )
        `)
        .eq('user_id', userProfile.id)
        .eq('archived', false)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as CreditCardBill[];
    },
  });
}

export function useBillExpenses() {
  return useQuery({
    queryKey: ['bill-expenses'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userProfile) throw new Error('User profile not found');

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const { data, error } = await supabase
        .from('credit_card_bills')
        .select('bill_amount')
        .eq('user_id', userProfile.id)
        .eq('archived', false)
        .gte('due_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('due_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (error) throw error;

      const totalBillExpenses = data?.reduce((sum, bill) => sum + bill.bill_amount, 0) || 0;
      
      return { totalBillExpenses };
    },
  });
}

export function useArchiveBill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (billId: number) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('credit_card_bills')
        .update({ archived: true })
        .eq('id', billId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
      queryClient.invalidateQueries({ queryKey: ['bill-expenses'] });
      
      toast({
        title: "Fatura arquivada",
        description: "A fatura foi arquivada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível arquivar a fatura.",
        variant: "destructive",
      });
      console.error('Error archiving bill:', error);
    },
  });
}

export function usePayBill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ billId, amount }: { billId: number; amount: number }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userProfile) throw new Error('User profile not found');

      // Get bill details for transaction creation
      const { data: bill } = await supabase
        .from('credit_card_bills')
        .select(`
          *,
          credit_cards (
            id,
            bank_name,
            card_name
          )
        `)
        .eq('id', billId)
        .single();

      if (!bill) throw new Error('Fatura não encontrada');

      // Create payment record
      const { error: paymentError } = await supabase
        .from('bill_payments')
        .insert({
          bill_id: billId,
          amount,
          user_id: userProfile.id,
          payment_date: new Date().toISOString()
        });

      if (paymentError) throw paymentError;

      // Update bill amounts
      const newPaidAmount = Number(bill.paid_amount) + amount;
      const newRemainingAmount = Number(bill.bill_amount) - newPaidAmount;
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'pending';

      const { error: billError } = await supabase
        .from('credit_card_bills')
        .update({
          paid_amount: newPaidAmount,
          remaining_amount: Math.max(0, newRemainingAmount),
          status: newStatus
        })
        .eq('id', billId);

      if (billError) throw billError;

      // Create transaction record for the payment
      const cardName = bill.credit_cards.card_name || bill.credit_cards.bank_name;
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userProfile.id,
          type: 'despesa',
          category: 'Cartão de Crédito',
          value: amount,
          description: `Pagamento de fatura - ${cardName}`,
          tx_date: new Date().toISOString(),
          registered_at: new Date().toISOString(),
          is_credit_card_expense: false
        });

      if (transactionError) throw transactionError;

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate multiple queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
      queryClient.invalidateQueries({ queryKey: ['bill-payments'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
      queryClient.invalidateQueries({ queryKey: ['chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bill-expenses'] });
      
      toast({
        title: "Pagamento registrado",
        description: "O pagamento da fatura foi registrado com sucesso e uma transação foi criada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
      console.error('Error paying bill:', error);
    },
  });
}
