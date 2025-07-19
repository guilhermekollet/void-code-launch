
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface CreditCardBill {
  id: number;
  user_id: string;
  credit_card_id: number;
  bill_amount: number;
  due_date: string;
  close_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paid_amount: number;
  remaining_amount: number;
  archived: boolean;
  created_at: string;
  credit_cards: {
    id: number;
    bank_name: string;
    card_name: string | null;
    color: string;
    due_date: number;
    close_date: number;
  };
}

export const useCreditCardBillsNew = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bills = [], isLoading, error } = useQuery({
    queryKey: ['credit-card-bills-new', user?.id],
    queryFn: async () => {
      if (!user) return [];

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
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching credit card bills:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user,
  });

  const payBillMutation = useMutation({
    mutationFn: async ({ billId, amount }: { billId: number; amount: number }) => {
      const { data: bill } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('id', billId)
        .single();

      if (!bill) throw new Error('Fatura não encontrada');

      const newPaidAmount = Number(bill.paid_amount) + amount;
      const newRemainingAmount = Number(bill.bill_amount) - newPaidAmount;
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';

      // Update bill
      const { error: updateError } = await supabase
        .from('credit_card_bills')
        .update({
          paid_amount: newPaidAmount,
          remaining_amount: Math.max(0, newRemainingAmount),
          status: newStatus
        })
        .eq('id', billId);

      if (updateError) throw updateError;

      // Record payment
      const { error: paymentError } = await supabase
        .from('bill_payments')
        .insert({
          bill_id: billId,
          user_id: user?.id,
          amount: amount,
          payment_date: new Date().toISOString()
        });

      if (paymentError) throw paymentError;

      return { billId, amount, newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      queryClient.invalidateQueries({ queryKey: ['bill-payments'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
      toast({
        title: "Pagamento registrado",
        description: "O pagamento da fatura foi registrado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error paying bill:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const archiveBillMutation = useMutation({
    mutationFn: async (billId: number) => {
      const { error } = await supabase
        .from('credit_card_bills')
        .update({ archived: true })
        .eq('id', billId);

      if (error) throw error;
      return billId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      toast({
        title: "Fatura arquivada",
        description: "A fatura foi arquivada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error archiving bill:', error);
      toast({
        title: "Erro",
        description: "Erro ao arquivar fatura. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
      return transactionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
      toast({
        title: "Transação excluída",
        description: "A transação foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir transação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const addBillPaymentMutation = useMutation({
    mutationFn: async ({ billAmount, description }: { billAmount: number; description: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'despesa',
          category: 'Cartão de Crédito',
          value: billAmount,
          description: description,
          tx_date: new Date().toISOString(),
          registered_at: new Date().toISOString(),
          is_credit_card_expense: false,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error adding bill payment transaction:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
      toast({
        title: "Pagamento adicionado",
        description: "O pagamento da fatura foi registrado como despesa.",
      });
    },
    onError: (error: any) => {
      console.error('Error adding bill payment:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    bills,
    isLoading,
    error,
    payBill: payBillMutation.mutate,
    isPayingBill: payBillMutation.isPending,
    archiveBill: archiveBillMutation.mutate,
    isArchivingBill: archiveBillMutation.isPending,
    deleteTransaction: deleteTransactionMutation.mutate,
    isDeletingTransaction: deleteTransactionMutation.isPending,
    addBillPayment: addBillPaymentMutation.mutate,
    isAddingBillPayment: addBillPaymentMutation.isPending,
  };
};

// Export alias for backward compatibility
export const useCreditCardBills = useCreditCardBillsNew;

// Export individual mutation hooks for cleaner component code
export const usePayBill = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ billId, amount }: { billId: number; amount: number }) => {
      const { data: bill } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('id', billId)
        .single();

      if (!bill) throw new Error('Fatura não encontrada');

      const newPaidAmount = Number(bill.paid_amount) + amount;
      const newRemainingAmount = Number(bill.bill_amount) - newPaidAmount;
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';

      // Update bill
      const { error: updateError } = await supabase
        .from('credit_card_bills')
        .update({
          paid_amount: newPaidAmount,
          remaining_amount: Math.max(0, newRemainingAmount),
          status: newStatus
        })
        .eq('id', billId);

      if (updateError) throw updateError;

      // Record payment
      const { error: paymentError } = await supabase
        .from('bill_payments')
        .insert({
          bill_id: billId,
          user_id: user?.id,
          amount: amount,
          payment_date: new Date().toISOString()
        });

      if (paymentError) throw paymentError;

      return { billId, amount, newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      queryClient.invalidateQueries({ queryKey: ['bill-payments'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
      toast({
        title: "Pagamento registrado",
        description: "O pagamento da fatura foi registrado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error paying bill:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useArchiveBill = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (billId: number) => {
      const { error } = await supabase
        .from('credit_card_bills')
        .update({ archived: true })
        .eq('id', billId);

      if (error) throw error;
      return billId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      toast({
        title: "Fatura arquivada",
        description: "A fatura foi arquivada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error archiving bill:', error);
      toast({
        title: "Erro",
        description: "Erro ao arquivar fatura. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useBillExpenses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bill-expenses', user?.id],
    queryFn: async () => {
      if (!user) return { totalBillExpenses: 0 };

      // Get current month's date range
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('transactions')
        .select('value')
        .eq('user_id', user.id)
        .eq('type', 'despesa')
        .eq('is_credit_card_expense', true)
        .gte('tx_date', firstDay.toISOString().split('T')[0])
        .lte('tx_date', lastDay.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching bill expenses:', error);
        return { totalBillExpenses: 0 };
      }

      const totalBillExpenses = data?.reduce((sum, transaction) => sum + transaction.value, 0) || 0;

      return { totalBillExpenses };
    },
    enabled: !!user,
  });
};
