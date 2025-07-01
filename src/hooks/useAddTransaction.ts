
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
  is_credit_card_expense?: boolean;
  credit_card_id?: number;
  installments?: number;
  installment_value?: number;
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

      // Se for despesa de cartão de crédito, criar uma única transação com as informações de parcelamento
      if (transactionData.is_credit_card_expense && transactionData.credit_card_id) {
        // Get credit card info to calculate billing dates
        const { data: creditCard } = await supabase
          .from('credit_cards')
          .select('due_date, close_date')
          .eq('id', transactionData.credit_card_id)
          .single();

        if (!creditCard) throw new Error('Credit card not found');

        // Para cartão de crédito, criar uma única transação com as informações de parcelamento
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: userData.id,
            amount: transactionData.amount,
            type: transactionData.type,
            category: transactionData.category,
            description: transactionData.description,
            tx_date: transactionData.tx_date,
            is_credit_card_expense: true,
            credit_card_id: transactionData.credit_card_id,
            installments: transactionData.installments || 1,
            installment_value: transactionData.installment_value || transactionData.amount,
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding credit card transaction:', error);
          throw error;
        }

        return data;
      }
      // Se for despesa parcelada (não cartão), criar múltiplas transações
      else if (transactionData.is_installment && transactionData.total_installments && transactionData.installment_start_date && !transactionData.is_credit_card_expense) {
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
    onSuccess: (data, variables) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Se for despesa de cartão de crédito, invalidar também as queries de faturas
      if (variables.is_credit_card_expense) {
        queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
        queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      }
      
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
