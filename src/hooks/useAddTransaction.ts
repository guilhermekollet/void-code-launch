
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
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transactionData: TransactionData) => {
      console.log('[useAddTransaction] Starting transaction creation:', { user: !!user, session: !!session });
      
      if (!user || !session) {
        console.error('[useAddTransaction] Authentication failed:', { user: !!user, session: !!session });
        throw new Error('User not authenticated');
      }

      // Verify session is still valid by checking auth state
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !currentSession) {
        console.error('[useAddTransaction] Session validation failed:', sessionError);
        throw new Error('Session expired. Please login again.');
      }

      // Input validation
      console.log('[useAddTransaction] Validating amount:', transactionData.amount, typeof transactionData.amount);
      
      if (!transactionData.amount || transactionData.amount === 0) {
        console.error('[useAddTransaction] Amount validation failed:', transactionData.amount);
        throw new Error('Amount must be greater than 0');
      }
      
      const absoluteAmount = Math.abs(transactionData.amount);
      if (absoluteAmount > 999999999) {
        throw new Error('Amount is too large');
      }

      if (!transactionData.type || !['receita', 'despesa'].includes(transactionData.type)) {
        throw new Error('Invalid transaction type');
      }

      if (!transactionData.category || transactionData.category.trim().length === 0) {
        throw new Error('Category is required');
      }

      if (!transactionData.description || transactionData.description.trim().length === 0) {
        throw new Error('Description is required');
      }

      if (transactionData.description.length > 500) {
        throw new Error('Description is too long (max 500 characters)');
      }

      if (!transactionData.tx_date) {
        throw new Error('Transaction date is required');
      }

      // Validate date
      const txDate = new Date(transactionData.tx_date);
      if (isNaN(txDate.getTime())) {
        throw new Error('Invalid transaction date');
      }

      // Validate installments
      if (transactionData.installments && (transactionData.installments < 1 || transactionData.installments > 36)) {
        throw new Error('Installments must be between 1 and 36');
      }

      // Validate credit card ownership if specified
      if (transactionData.credit_card_id) {
        const { data: cardOwnership, error: cardError } = await supabase
          .from('credit_cards')
          .select('user_id')
          .eq('id', transactionData.credit_card_id)
          .single();

        if (cardError || !cardOwnership) {
          throw new Error('Invalid credit card');
        }

        // Since we don't have direct access to the user's numeric ID in the users table,
        // we'll verify through the auth context that they own this card
        const { data: userRecord } = await supabase
          .from('users')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!userRecord || cardOwnership.user_id !== userRecord.id) {
          throw new Error('You can only use your own credit cards');
        }
      }

      // Se for despesa de cartão de crédito com parcelamento, criar múltiplas transações
      if (transactionData.is_credit_card_expense && transactionData.credit_card_id && transactionData.installments && transactionData.installments > 1) {
        // Get credit card info to calculate billing dates
        const { data: creditCard } = await supabase
          .from('credit_cards')
          .select('due_date, close_date')
          .eq('id', transactionData.credit_card_id)
          .single();

        if (!creditCard) throw new Error('Credit card not found');

        const installmentAmount = transactionData.amount / transactionData.installments;
        const transactions = [];
        
        for (let i = 1; i <= transactionData.installments; i++) {
          const installmentDate = new Date(transactionData.tx_date);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
          
          const { data, error } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              value: installmentAmount,
              type: transactionData.type,
              category: transactionData.category,
              description: `${transactionData.description} (${i}/${transactionData.installments})`,
              tx_date: installmentDate.toISOString(),
              registered_at: new Date().toISOString(),
              is_credit_card_expense: true,
              credit_card_id: transactionData.credit_card_id,
              installments: transactionData.installments,
              installment_value: installmentAmount,
              installment_number: i,
              total_installments: transactionData.installments,
              is_installment: true,
              installment_start_date: transactionData.tx_date,
            } as any)
            .select()
            .single();

        if (error) {
          console.error('[useAddTransaction] Error adding credit card installment transaction:', error);
          if (error.code === 'PGRST301') {
            throw new Error('Authentication failed. Please login again.');
          }
          throw error;
        }
          
          transactions.push(data);
        }
        
        return transactions;
      }
      // Se for despesa de cartão de crédito sem parcelamento
      else if (transactionData.is_credit_card_expense && transactionData.credit_card_id) {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            value: transactionData.amount,
            type: transactionData.type,
            category: transactionData.category,
            description: transactionData.description,
            tx_date: transactionData.tx_date,
            registered_at: new Date().toISOString(),
            is_credit_card_expense: true,
            credit_card_id: transactionData.credit_card_id,
            installments: 1,
            installment_value: transactionData.amount,
          } as any)
          .select()
          .single();

        if (error) {
          console.error('[useAddTransaction] Error adding credit card transaction:', error);
          if (error.code === 'PGRST301') {
            throw new Error('Authentication failed. Please login again.');
          }
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
              user_id: user.id,
              value: installmentAmount,
              type: transactionData.type,
              category: transactionData.category,
              description: `${transactionData.description} (${i}/${transactionData.total_installments})`,
              tx_date: installmentDate.toISOString(),
              registered_at: new Date().toISOString(),
              is_installment: true,
              installment_number: i,
              total_installments: transactionData.total_installments,
              installment_start_date: transactionData.installment_start_date,
            } as any)
            .select()
            .single();

          if (error) {
            console.error('[useAddTransaction] Error adding installment transaction:', error);
            if (error.code === 'PGRST301') {
              throw new Error('Authentication failed. Please login again.');
            }
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
            user_id: user.id,
            value: transactionData.amount,
            type: transactionData.type,
            category: transactionData.category,
            description: transactionData.description,
            tx_date: transactionData.tx_date,
            registered_at: new Date().toISOString(),
            is_recurring: transactionData.is_recurring || false,
            recurring_date: transactionData.recurring_date,
          } as any)
          .select()
          .single();

        if (error) {
          console.error('[useAddTransaction] Error adding transaction:', error);
          if (error.code === 'PGRST301') {
            throw new Error('Authentication failed. Please login again.');
          }
          throw error;
        }

        return data;
      }
    },
    onSuccess: () => {
      // Invalidar TODAS as queries relacionadas ao dashboard para garantir atualização completa
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financialData'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['chartData'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      queryClient.invalidateQueries({ queryKey: ['credit-card-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dailyData'] });
      
      // Força uma re-busca completa dos dados financeiros
      queryClient.refetchQueries({ queryKey: ['financialData'] });
      queryClient.refetchQueries({ queryKey: ['financial-data'] });
      
      console.log('[useAddTransaction] All dashboard queries invalidated and refetched for fresh data');
      
      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('[useAddTransaction] Error adding transaction:', error);
      
      let errorMessage = "Erro ao adicionar transação. Tente novamente.";
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication failed') || error.message.includes('Session expired')) {
          errorMessage = "Sessão expirada. Faça login novamente.";
          // Redirect to login after showing error
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (error.message.includes('User not authenticated')) {
          errorMessage = "Usuário não autenticado. Faça login novamente.";
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}
