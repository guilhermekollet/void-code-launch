
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFinancialData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financialData', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[useFinancialData] No user ID available');
        return {
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          monthlyRecurringExpenses: 0
        };
      }

      console.log('[useFinancialData] Fetching financial data for user:', user.id);

      // Get user's internal ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, completed_onboarding')
        .eq('user_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('[useFinancialData] Error fetching user data:', userError);
        return {
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          monthlyRecurringExpenses: 0
        };
      }

      // If user hasn't completed onboarding, return zeros
      if (!userData.completed_onboarding) {
        console.log('[useFinancialData] User has not completed onboarding');
        return {
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          monthlyRecurringExpenses: 0
        };
      }

      const internalUserId = userData.id;
      console.log('[useFinancialData] Using internal user ID:', internalUserId);

      // Get current month start and end
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch transactions for current month
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('value, type, is_recurring')
        .eq('user_id', internalUserId)
        .gte('tx_date', startOfMonth.toISOString())
        .lte('tx_date', endOfMonth.toISOString());

      if (transactionsError) {
        console.error('[useFinancialData] Error fetching transactions:', transactionsError);
        return {
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          monthlyRecurringExpenses: 0
        };
      }

      console.log('[useFinancialData] Found transactions:', transactions?.length || 0);

      // Calculate financial data
      let monthlyIncome = 0;
      let monthlyExpenses = 0;
      let monthlyRecurringExpenses = 0;

      transactions?.forEach(transaction => {
        const value = Number(transaction.value) || 0;
        
        if (transaction.type === 'receita') {
          monthlyIncome += value;
        } else if (transaction.type === 'despesa') {
          monthlyExpenses += Math.abs(value);
          
          if (transaction.is_recurring) {
            monthlyRecurringExpenses += Math.abs(value);
          }
        }
      });

      // Calculate total balance (this is a simplified calculation)
      // In a real scenario, you might want to calculate this based on all transactions up to date
      const totalBalance = monthlyIncome - monthlyExpenses;

      const result = {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlyRecurringExpenses
      };

      console.log('[useFinancialData] Calculated financial data:', result);
      return result;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[useTransactions] No user ID available');
        return [];
      }

      console.log('[useTransactions] Fetching transactions for user:', user.id);

      // Get user's internal ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, completed_onboarding')
        .eq('user_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('[useTransactions] Error fetching user data:', userError);
        return [];
      }

      // If user hasn't completed onboarding, return empty array
      if (!userData.completed_onboarding) {
        console.log('[useTransactions] User has not completed onboarding');
        return [];
      }

      const internalUserId = userData.id;
      console.log('[useTransactions] Using internal user ID:', internalUserId);

      // Fetch recent transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          description,
          value,
          type,
          category,
          tx_date,
          is_recurring,
          is_installment,
          installment_number,
          total_installments,
          registered_at
        `)
        .eq('user_id', internalUserId)
        .order('tx_date', { ascending: false })
        .limit(50);

      if (transactionsError) {
        console.error('[useTransactions] Error fetching transactions:', transactionsError);
        return [];
      }

      console.log('[useTransactions] Found transactions:', transactions?.length || 0);
      return transactions || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
