
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TransactionData {
  description: string;
  amount: number; // Changed from 'value' to 'amount'
  category: string;
  tx_date: string;
  type: 'receita' | 'despesa';
  is_recurring?: boolean;
  recurring_date?: number;
  is_installment?: boolean;
  total_installments?: number;
  installments?: number;
  credit_card_id?: number;
  installment_start_date?: string;
  is_credit_card_expense?: boolean;
}

export function useAddTransaction() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionData: TransactionData) => {
      if (!user) throw new Error('User not authenticated');

      // Get user ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (userError) throw userError;

      const currentDate = new Date().toISOString();

      // If it's an installment transaction
      if (transactionData.is_installment && transactionData.installments && transactionData.installments > 1) {
        const installmentData = [];
        const startDate = new Date(transactionData.installment_start_date || transactionData.tx_date);
        
        for (let i = 1; i <= transactionData.installments; i++) {
          const installmentDate = new Date(startDate);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
          
          installmentData.push({
            user_id: userData.id,
            description: transactionData.description,
            value: transactionData.amount / transactionData.installments, // Use 'amount' from interface
            category: transactionData.category,
            tx_date: installmentDate.toISOString().split('T')[0],
            type: transactionData.type,
            registered_at: currentDate,
            is_installment: true,
            installment_number: i,
            total_installments: transactionData.installments,
            installment_start_date: transactionData.installment_start_date || transactionData.tx_date,
            installment_value: transactionData.amount / transactionData.installments, // Use 'amount' from interface
            credit_card_id: transactionData.credit_card_id,
            is_credit_card_expense: !!transactionData.credit_card_id,
          });
        }

        const { error } = await supabase
          .from('transactions')
          .insert(installmentData);

        if (error) throw error;
        return { success: true, type: 'installment', count: transactionData.installments };
      }

      // Regular or recurring transaction
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userData.id,
          description: transactionData.description,
          value: transactionData.amount, // Use 'amount' from interface
          category: transactionData.category,
          tx_date: transactionData.tx_date,
          type: transactionData.type,
          registered_at: currentDate,
          is_recurring: transactionData.is_recurring || false,
          recurring_date: transactionData.recurring_date,
          credit_card_id: transactionData.credit_card_id,
          is_credit_card_expense: !!transactionData.credit_card_id,
        });

      if (error) throw error;
      return { success: true, type: transactionData.is_recurring ? 'recurring' : 'single' };
    },
    onSuccess: (data) => {
      // Invalidate all related queries to update dashboard dynamically
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data'] });
      
      if (data.type === 'installment') {
        toast({
          title: "Sucesso!",
          description: `${data.count} parcelas foram criadas com sucesso.`,
        });
      } else if (data.type === 'recurring') {
        toast({
          title: "Sucesso!",
          description: "Transação recorrente criada com sucesso.",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Transação criada com sucesso.",
        });
      }
    },
    onError: (error) => {
      console.error('Error adding transaction:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a transação. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}
