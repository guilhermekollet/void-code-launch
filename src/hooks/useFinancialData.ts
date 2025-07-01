
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

  // Calculate total balance excluding credit card expenses (they don't impact balance until bill is paid)
  const totalBalance = transactions
    .filter(t => new Date(t.tx_date) <= today && !t.is_credit_card_expense)
    .reduce((sum, t) => {
      return t.type === 'receita' ? sum + Number(t.amount) : sum - Number(t.amount);
    }, 0);

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'receita')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Monthly expenses exclude credit card expenses (they are tracked in bills)
  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'despesa' && !t.is_credit_card_expense)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate recurring expenses - transactions marked as recurring (excluding credit card)
  const monthlyRecurringExpenses = currentMonthTransactions
    .filter(t => t.type === 'despesa' && t.is_recurring && !t.is_credit_card_expense)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate credit card expenses that are in bills
  const monthlyBillExpenses = currentMonthTransactions
    .filter(t => t.is_credit_card_expense)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyRecurringExpenses,
    monthlyBillExpenses,
    isLoading,
  };
}

export function useChartData() {
  const { data: chartData = [] } = useChartDataWithInstallments();

  // For backward compatibility, return the data in the expected format
  const monthlyData = chartData;

  // Category data with improved colors following the identity
  const { data: transactions = [] } = useTransactions();
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

// Corrected function to process installment transactions for chart data
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
        // Get regular transactions for this specific month and year
        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.tx_date);
          return transactionDate.getMonth() === period.month && 
                 transactionDate.getFullYear() === period.year;
        });

        // Calculate installment transactions for this period - FIXED LOGIC
        const installmentTransactions = transactions.filter(t => {
          if (!t.is_installment || !t.installment_start_date || !t.total_installments) return false;
          
          const startDate = new Date(t.installment_start_date);
          const currentPeriodDate = new Date(period.year, period.month, 1);
          
          // Calculate which installment would fall in this period
          const monthsDiff = (currentPeriodDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (currentPeriodDate.getMonth() - startDate.getMonth());
          
          // Only include if this month falls within the installment period
          return monthsDiff >= 0 && monthsDiff < t.total_installments;
        });

        // Regular income from transactions in this month
        const regularReceitas = monthTransactions
          .filter(t => t.type === 'receita' && !t.is_installment)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Installment income for this period
        const installmentReceitas = installmentTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalReceitas = regularReceitas + installmentReceitas;

        // Regular expenses from transactions in this month (excluding credit card)
        const regularDespesas = monthTransactions
          .filter(t => t.type === 'despesa' && !t.is_installment && !t.is_credit_card_expense)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Installment expenses for this period - each installment counts only once (excluding credit card)
        const installmentDespesas = installmentTransactions
          .filter(t => t.type === 'despesa' && !t.is_credit_card_expense)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalDespesas = regularDespesas + installmentDespesas;

        // Calculate recurring expenses for this month (excluding credit card)
        const gastosRecorrentes = monthTransactions
          .filter(t => t.type === 'despesa' && t.is_recurring && !t.is_credit_card_expense)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Calculate bill expenses (credit card expenses accumulated in this period)
        const billExpenses = monthTransactions
          .filter(t => t.is_credit_card_expense)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          mes: period.name,
          receitas: totalReceitas,
          despesas: totalDespesas,
          gastosRecorrentes,
          faturas: billExpenses
        };
      });

      return monthlyData;
    },
    enabled: true,
  });
}
