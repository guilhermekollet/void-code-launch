
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
        .eq('user_id', user.id)
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
          // Value is already negative for expenses
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
    staleTime: 1000 * 60 * 2, // Reduzido para 2 minutos para atualização mais rápida
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
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

      // Fetch recent transactions with all required fields, ordered by registered_at DESC
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
          installment_start_date,
          installment_value,
          credit_card_id,
          is_credit_card_expense,
          is_agent,
          registered_at
        `)
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false })
        .limit(50);

      if (transactionsError) {
        console.error('[useTransactions] Error fetching transactions:', transactionsError);
        return [];
      }

      console.log('[useTransactions] Found transactions:', transactions?.length || 0);
      
      // Map the data to include amount field and handle nulls
      return transactions?.map(transaction => ({
        ...transaction,
        amount: Number(transaction.value) || 0, // Map value to amount
        installment_start_date: transaction.installment_start_date || null,
        installment_value: transaction.installment_value || null,
        credit_card_id: transaction.credit_card_id || null,
        is_credit_card_expense: transaction.is_credit_card_expense || false,
        is_agent: transaction.is_agent || false,
      })) || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 1, // Reduzido para 1 minuto para atualização mais rápida
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
  });
}

// Add missing exports for chart data functionality
export function useFinancialMetrics() {
  const { data: financialData } = useFinancialData();
  
  return {
    totalBalance: financialData?.totalBalance || 0,
    monthlyIncome: financialData?.monthlyIncome || 0,
    monthlyExpenses: financialData?.monthlyExpenses || 0,
    monthlyRecurringExpenses: financialData?.monthlyRecurringExpenses || 0
  };
}

export function useChartData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chartData', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return { monthlyData: [], categoryData: [] };
      }

      // Get user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id, completed_onboarding')
        .eq('user_id', user.id)
        .single();

      if (!userData?.completed_onboarding) {
        return { monthlyData: [], categoryData: [] };
      }

      // Fetch transactions for chart data
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('tx_date', { ascending: false });

      if (!transactions) {
        return { monthlyData: [], categoryData: [] };
      }

      // Process monthly data
      const monthlyMap = new Map();
      const categoryMap = new Map();

      transactions.forEach(transaction => {
        const date = new Date(transaction.tx_date);
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
        const value = Number(transaction.value) || 0;

        // Monthly data
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { 
            mes: monthKey, 
            receitas: 0, 
            despesas: 0, 
            gastosRecorrentes: 0,
            fluxoLiquido: 0 
          });
        }

        const monthData = monthlyMap.get(monthKey);
        if (transaction.type === 'receita') {
          monthData.receitas += value;
        } else if (transaction.type === 'despesa') {
          // Garantir que despesas sempre sejam positivas no gráfico
          monthData.despesas += Math.abs(value);
          if (transaction.is_recurring) {
            monthData.gastosRecorrentes += Math.abs(value);
          }
        }
        
        // Calculate fluxo líquido
        monthData.fluxoLiquido = monthData.receitas - monthData.despesas;

        // Category data
        if (transaction.type === 'despesa') {
          if (!categoryMap.has(transaction.category)) {
            categoryMap.set(transaction.category, {
              name: transaction.category,
              value: 0,
              color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
            });
          }
          categoryMap.get(transaction.category).value += Math.abs(value);
        }
      });

      return {
        monthlyData: Array.from(monthlyMap.values()).slice(0, 12),
        categoryData: Array.from(categoryMap.values()).sort((a, b) => b.value - a.value)
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // Reduzido para 2 minutos
    refetchOnWindowFocus: true,
  });
}

export function useChartDataWithInstallments() {
  const { data: chartData } = useChartData();
  return chartData?.monthlyData || [];
}

export function useDailyData(days: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dailyData', user?.id, days],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id, completed_onboarding')
        .eq('user_id', user.id)
        .single();

      if (!userData?.completed_onboarding) {
        return [];
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('tx_date', startDate.toISOString())
        .lte('tx_date', endDate.toISOString())
        .order('tx_date', { ascending: true });

      if (!transactions) {
        return [];
      }

      const dailyMap = new Map();

      transactions.forEach(transaction => {
        const date = new Date(transaction.tx_date);
        const dayKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const value = Number(transaction.value) || 0;

        if (!dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, { 
            mes: dayKey, 
            receitas: 0, 
            despesas: 0, 
            gastosRecorrentes: 0,
            fluxoLiquido: 0 
          });
        }

        const dayData = dailyMap.get(dayKey);
        if (transaction.type === 'receita') {
          dayData.receitas += value;
        } else if (transaction.type === 'despesa') {
          // Garantir que despesas sempre sejam positivas no gráfico
          dayData.despesas += Math.abs(value);
          if (transaction.is_recurring) {
            dayData.gastosRecorrentes += Math.abs(value);
          }
        }
        
        // Calculate fluxo líquido
        dayData.fluxoLiquido = dayData.receitas - dayData.despesas;
      });

      return Array.from(dailyMap.values());
    },
    enabled: !!user?.id && days > 0,
    staleTime: 1000 * 60 * 1, // Reduzido para 1 minuto
    refetchOnWindowFocus: true,
  });
}
