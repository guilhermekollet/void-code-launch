
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];

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

export function useChartDataWithInstallments() {
  const { data: transactions = [] } = useTransactions();

  return useQuery({
    queryKey: ['chart-data-installments', transactions.length],
    queryFn: () => {
      // Process data for the last 6 months
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const receitas = transactions
          .filter(t => {
            const tDate = new Date(t.tx_date);
            return t.type === 'receita' && 
                   tDate.getMonth() === date.getMonth() && 
                   tDate.getFullYear() === date.getFullYear();
          })
          .reduce((sum, t) => sum + Number(t.value), 0);

        const despesas = transactions
          .filter(t => {
            const tDate = new Date(t.tx_date);
            return t.type === 'despesa' && 
                   tDate.getMonth() === date.getMonth() && 
                   tDate.getFullYear() === date.getFullYear();
          })
          .reduce((sum, t) => sum + Number(t.value), 0);

        const gastosRecorrentes = transactions
          .filter(t => {
            const tDate = new Date(t.tx_date);
            return t.type === 'despesa' && 
                   t.is_recurring && 
                   tDate.getMonth() === date.getMonth() && 
                   tDate.getFullYear() === date.getFullYear();
          })
          .reduce((sum, t) => sum + Number(t.value), 0);

        // Calculate credit card bills for this month
        const creditCardTransactions = transactions
          .filter(t => {
            const tDate = new Date(t.tx_date);
            return t.is_credit_card_expense && 
                   tDate.getMonth() === date.getMonth() && 
                   tDate.getFullYear() === date.getFullYear();
          })
          .reduce((sum, t) => sum + Number(t.value), 0);

        return {
          mes: date.toLocaleDateString('pt-BR', { month: 'short' }),
          receitas,
          despesas,
          gastosRecorrentes,
          faturas: creditCardTransactions,
          fluxoLiquido: receitas - despesas
        };
      }).reverse();

      return monthlyData;
    },
    enabled: transactions.length > 0,
  });
}

export function useDailyData(days: number = 30) {
  const { data: transactions = [] } = useTransactions();

  return useQuery({
    queryKey: ['daily-data', days, transactions.length],
    queryFn: () => {
      const today = new Date();
      const dailyData = [];

      // Generate data for the specified number of days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.tx_date);
          return transactionDate.toDateString() === date.toDateString();
        });

        const receitas = dayTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => sum + Number(t.value), 0);

        const despesas = dayTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => sum + Number(t.value), 0);

        const gastosRecorrentes = dayTransactions
          .filter(t => t.type === 'despesa' && t.is_recurring)
          .reduce((sum, t) => sum + Number(t.value), 0);

        const faturas = dayTransactions
          .filter(t => t.is_credit_card_expense)
          .reduce((sum, t) => sum + Number(t.value), 0);

        dailyData.push({
          mes: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          receitas,
          despesas,
          gastosRecorrentes,
          faturas,
          fluxoLiquido: receitas - despesas,
          isFuture: false
        });
      }

      return dailyData;
    },
    enabled: transactions.length > 0,
  });
}

export function useFinancialMetrics() {
  const { data: transactions = [] } = useTransactions();

  return useQuery({
    queryKey: ['financial-metrics', transactions.length],
    queryFn: () => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const currentMonthTransactions = transactions.filter(t => {
        const tDate = new Date(t.tx_date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      });

      const totalReceitas = currentMonthTransactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + Number(t.value), 0);

      const totalDespesas = currentMonthTransactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Number(t.value), 0);

      const saldoAtual = totalReceitas - totalDespesas;

      const gastosRecorrentes = currentMonthTransactions
        .filter(t => t.type === 'despesa' && t.is_recurring)
        .reduce((sum, t) => sum + Number(t.value), 0);

      return {
        totalReceitas,
        totalDespesas,
        saldoAtual,
        gastosRecorrentes
      };
    },
    enabled: transactions.length > 0,
  });
}
