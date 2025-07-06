
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface BillPayment {
  id: number;
  bill_id: number;
  amount: number;
  payment_date: string;
  user_id: number;
  created_at: string;
}

export function useBillPayments(billId: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bill-payments', billId],
    queryFn: async () => {
      if (!user || !billId) return [];

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return [];

      const { data, error } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('bill_id', billId)
        .eq('user_id', userData.id)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching bill payments:', error);
        return [];
      }

      return data as BillPayment[];
    },
    enabled: !!user && !!billId,
  });
}

export function useUndoPayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentId: number) => {
      if (!user) throw new Error('User not authenticated');

      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) throw new Error('Payment not found');

      // Get bill details
      const { data: bill, error: billError } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('id', payment.bill_id)
        .single();

      if (billError || !bill) throw new Error('Bill not found');

      // Check if bill is archived
      if (bill.archived) {
        throw new Error('Cannot undo payment for archived bill');
      }

      // Calculate new amounts
      const newPaidAmount = bill.paid_amount - payment.amount;
      const newRemainingAmount = bill.bill_amount - newPaidAmount;
      const newStatus = newRemainingAmount > 0 ? 
        (new Date() > new Date(bill.due_date) ? 'overdue' : 'closed') : 'paid';

      // Delete payment record
      const { error: deleteError } = await supabase
        .from('bill_payments')
        .delete()
        .eq('id', paymentId);

      if (deleteError) throw deleteError;

      // Update bill
      const { error: updateError } = await supabase
        .from('credit_card_bills')
        .update({
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus,
        })
        .eq('id', payment.bill_id);

      if (updateError) throw updateError;

      return { paymentId, amount: payment.amount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      queryClient.invalidateQueries({ queryKey: ['bill-payments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Sucesso",
        description: `Pagamento de ${new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(data.amount)} desfeito com sucesso!`,
      });
    },
    onError: (error) => {
      console.error('Error undoing payment:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao desfazer pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}
