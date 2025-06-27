
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .order('tx_date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user,
  });
}

export function useFinancialMetrics() {
  const { data: transactions = [], isLoading } = useTransactions();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const today = new Date();

  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.tx_date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  // Calculate total balance only with past and present transactions (not future)
  const totalBalance = transactions
    .filter(t => new Date(t.tx_date) <= today)
    .reduce((sum, t) => {
      return t.type === 'receita' ? sum + Number(t.amount) : sum - Number(t.amount);
    }, 0);

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'receita')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'despesa')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate recurring expenses - transactions marked as recurring
  const monthlyRecurringExpenses = currentMonthTransactions
    .filter(t => t.type === 'despesa' && t.is_recurring)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyRecurringExpenses,
    isLoading,
  };
}

export function useChartData() {
  const { data: transactions = [] } = useTransactions();

  // Get last 6 months data
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.getMonth(),
      year: date.getFullYear(),
      name: date.toLocaleDateString('pt-BR', { month: 'short' })
    };
  }).reverse();

  const monthlyData = last6Months.map(period => {
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.tx_date);
      return transactionDate.getMonth() === period.month && 
             transactionDate.getFullYear() === period.year;
    });

    const receitas = monthTransactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const despesas = monthTransactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate recurring expenses for this month
    const gastosRecorrentes = monthTransactions
      .filter(t => t.type === 'despesa' && t.is_recurring)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      mes: period.name,
      receitas,
      despesas,
      gastosRecorrentes
    };
  });

  // Category data with improved colors following the identity
  const categoryData = transactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => {
      const category = t.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  // Enhanced color palette following the identity
  const colorPalette = [
    '#61710C', // Primary brand color
    '#84CC16', // Lime green
    '#22C55E', // Green
    '#10B981', // Emerald
    '#059669', // Emerald 600
    '#047857', // Emerald 700
    '#065F46', // Emerald 800
    '#064E3B', // Emerald 900
    '#F59E0B', // Amber (complementary)
    '#EF4444', // Red (complementary)
  ];

  const categoryChartData = Object.entries(categoryData)
    .sort(([,a], [,b]) => b - a) // Sort by value descending
    .map(([name, value], index) => ({
      name,
      value,
      color: colorPalette[index % colorPalette.length]
    }));

  return {
    monthlyData,
    categoryData: categoryChartData
  };
}

// Enhanced function to get daily data for specific periods
export function useDailyData(days: number) {
  const { data: transactions = [] } = useTransactions();

  return useQuery({
    queryKey: ['daily-data', days, transactions.length],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));

      const dailyData = Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const dayTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.tx_date);
          return transactionDate.toDateString() === date.toDateString();
        });

        const receitas = dayTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const despesas = dayTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const gastosRecorrentes = dayTransactions
          .filter(t => t.type === 'despesa' && t.is_recurring)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          mes: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          receitas,
          despesas,
          gastosRecorrentes,
          fluxoLiquido: receitas - despesas,
          isFuture: false
        };
      });

      return dailyData;
    },
    enabled: true,
  });
}

// New function to process installment transactions for chart data
export function useChartDataWithInstallments() {
  const { data: transactions = [] } = useTransactions();

  return useQuery({
    queryKey: ['chart-data-installments', transactions.length],
    queryFn: () => {
      // Get last 6 months data
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.getMonth(),
          year: date.getFullYear(),
          name: date.toLocaleDateString('pt-BR', { month: 'short' })
        };
      }).reverse();

      const monthlyData = last6Months.map(period => {
        // Get transactions for this specific month and year
        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.tx_date);
          return transactionDate.getMonth() === period.month && 
                 transactionDate.getFullYear() === period.year;
        });

        // Calculate installment transactions for this period
        const installmentTransactions = transactions.filter(t => {
          if (!t.is_installment || !t.installment_start_date) return false;
          
          const startDate = new Date(t.installment_start_date);
          const currentPeriodDate = new Date(period.year, period.month, 1);
          
          // Calculate which installment would fall in this period
          const monthsDiff = (currentPeriodDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (currentPeriodDate.getMonth() - startDate.getMonth());
          
          return monthsDiff >= 0 && monthsDiff < (t.total_installments || 0);
        });

        const receitas = monthTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const regularDespesas = monthTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Add installment amounts for this period
        const installmentDespesas = installmentTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalDespesas = regularDespesas + installmentDespesas;

        // Calculate recurring expenses for this month
        const gastosRecorrentes = monthTransactions
          .filter(t => t.type === 'despesa' && t.is_recurring)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          mes: period.name,
          receitas,
          despesas: totalDespesas,
          gastosRecorrentes
        };
      });

      return monthlyData;
    },
    enabled: true,
  });
}
