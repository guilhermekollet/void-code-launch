import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TransactionData {
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  tx_date: string;
  is_recurring?: boolean;
  recurring_date?: number;
  is_installment?: boolean;
  total_installments?: number;
  installment_start_date?: string;
}

export function useAddTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transactionData: TransactionData) => {
      if (!user) throw new Error('User not authenticated');

      // First get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) throw new Error('User not found');

      // Se for despesa parcelada, criar múltiplas transações
      if (transactionData.is_installment && transactionData.total_installments && transactionData.installment_start_date) {
        const installmentAmount = transactionData.amount / transactionData.total_installments;
        const transactions = [];
        
        for (let i = 1; i <= transactionData.total_installments; i++) {
          const installmentDate = new Date(transactionData.installment_start_date);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
          
          const { data, error } = await supabase
            .from('transactions')
            .insert({
              user_id: userData.id,
              amount: installmentAmount,
              type: transactionData.type,
              category: transactionData.category,
              description: `${transactionData.description} (${i}/${transactionData.total_installments})`,
              tx_date: installmentDate.toISOString(),
              is_installment: true,
              installment_number: i,
              total_installments: transactionData.total_installments,
              installment_start_date: transactionData.installment_start_date,
            })
            .select()
            .single();

          if (error) {
            console.error('Error adding installment transaction:', error);
            throw error;
          }
          
          transactions.push(data);
        }
        
        return transactions;
      } else {
        // Transação única (normal ou recorrente)
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: userData.id,
            amount: transactionData.amount,
            type: transactionData.type,
            category: transactionData.category,
            description: transactionData.description,
            tx_date: transactionData.tx_date,
            is_recurring: transactionData.is_recurring || false,
            recurring_date: transactionData.recurring_date,
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding transaction:', error);
          throw error;
        }

        return data;
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error adding transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar transação. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}
