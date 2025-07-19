
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BillPayment {
  id: number;
  bill_id: number;
  amount: number;
  payment_date: string;
  user_id: number;
}

export function useBillPayments(billId: number) {
  return useQuery({
    queryKey: ['bill-payments', billId],
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
        .from('bill_payments')
        .select('*')
        .eq('bill_id', billId)
        .eq('user_id', userProfile.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as BillPayment[];
    },
  });
}

export function useUndoPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentId: number) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userProfile) throw new Error('User profile not found');

      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('id', paymentId)
        .eq('user_id', userProfile.id)
        .single();

      if (paymentError) throw paymentError;
      if (!payment) throw new Error('Payment not found');

      // Get current bill details to identify the card
      const { data: bill, error: billError } = await supabase
        .from('credit_card_bills')
        .select(`
          *,
          credit_cards (
            id,
            bank_name,
            card_name
          )
        `)
        .eq('id', payment.bill_id)
        .single();

      if (billError) throw billError;
      if (!bill) throw new Error('Bill not found');

      // Find and delete the corresponding transaction
      const cardName = bill.credit_cards.card_name || bill.credit_cards.bank_name;
      const paymentDate = new Date(payment.payment_date);
      const startOfDay = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
      const endOfDay = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate() + 1);

      const { data: transactions, error: transactionSearchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('type', 'despesa')
        .eq('category', 'Cartão de Crédito')
        .eq('value', payment.amount)
        .gte('tx_date', startOfDay.toISOString())
        .lt('tx_date', endOfDay.toISOString())
        .ilike('description', `%${cardName}%`);

      if (transactionSearchError) throw transactionSearchError;

      // Delete the matching transaction if found
      if (transactions && transactions.length > 0) {
        const { error: deleteTransactionError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transactions[0].id);

        if (deleteTransactionError) throw deleteTransactionError;
      }

      // Delete the payment
      const { error: deleteError } = await supabase
        .from('bill_payments')
        .delete()
        .eq('id', paymentId);

      if (deleteError) throw deleteError;

      // Update bill amounts
      const newPaidAmount = Number(bill.paid_amount) - Number(payment.amount);
      const newRemainingAmount = Number(bill.bill_amount) - newPaidAmount;
      const newStatus = newRemainingAmount > 0 ? 'pending' : 'paid';

      const { error: updateError } = await supabase
        .from('credit_card_bills')
        .update({
          paid_amount: Math.max(0, newPaidAmount),
          remaining_amount: Math.max(0, newRemainingAmount),
          status: newStatus
        })
        .eq('id', payment.bill_id);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate multiple queries to ensure UI updates completely
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
      queryClient.invalidateQueries({ queryKey: ['bill-payments'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
      queryClient.invalidateQueries({ queryKey: ['chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bill-expenses'] });
      
      toast({
        title: "Pagamento desfeito",
        description: "O pagamento e a transação foram removidos com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível desfazer o pagamento.",
        variant: "destructive",
      });
      console.error('Error undoing payment:', error);
    },
  });
}
