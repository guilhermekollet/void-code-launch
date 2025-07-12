
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns';

export const useFinancialData = () => {
  return useQuery({
    queryKey: ['financial-data'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userData) throw new Error('Dados do usuário não encontrados');

      const currentMonth = new Date();
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);

      const [receitasResult, despesasResult, recorrentesResult, billsResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('value')
          .eq('user_id', userData.id)
          .eq('type', 'receita')
          .gte('tx_date', startDate.toISOString())
          .lte('tx_date', endDate.toISOString()),
        
        supabase
          .from('transactions')
          .select('value')
          .eq('user_id', userData.id)
          .eq('type', 'despesa')
          .gte('tx_date', startDate.toISOString())
          .lte('tx_date', endDate.toISOString()),
        
        supabase
          .from('transactions')
          .select('value')
          .eq('user_id', userData.id)
          .eq('type', 'despesa')
          .eq('is_recurring', true)
          .gte('tx_date', startDate.toISOString())
          .lte('tx_date', endDate.toISOString()),

        supabase
          .from('credit_card_bills')
          .select('bill_amount')
          .eq('user_id', userData.id)
          .eq('status', 'pending')
      ]);

      const totalReceitas = receitasResult.data?.reduce((sum, t) => sum + Number(t.value), 0) || 0;
      const totalDespesas = despesasResult.data?.reduce((sum, t) => sum + Number(t.value), 0) || 0;
      const gastosRecorrentes = recorrentesResult.data?.reduce((sum, t) => sum + Number(t.value), 0) || 0;
      const monthlyBillExpenses = billsResult.data?.reduce((sum, bill) => sum + Number(bill.bill_amount), 0) || 0;

      const saldoAtual = totalReceitas - totalDespesas;

      return {
        totalReceitas,
        totalDespesas,
        saldoAtual,
        gastosRecorrentes,
        totalBalance: saldoAtual,
        monthlyIncome: totalReceitas,
        monthlyExpenses: totalDespesas,
        monthlyRecurringExpenses: gastosRecorrentes,
        monthlyBillExpenses,
        totalBillExpenses: monthlyBillExpenses,
        isLoading: false
      };
    },
  });
};

export const useFinancialMetrics = () => {
  const { data, isLoading } = useFinancialData();
  
  return {
    totalBalance: data?.totalBalance || 0,
    monthlyIncome: data?.monthlyIncome || 0,
    monthlyExpenses: data?.monthlyExpenses || 0,
    monthlyRecurringExpenses: data?.monthlyRecurringExpenses || 0,
    monthlyBillExpenses: data?.monthlyBillExpenses || 0,
    isLoading
  };
};

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userData) throw new Error('Dados do usuário não encontrados');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .order('tx_date', { ascending: false });

      if (error) throw error;
      
      // Map value to amount for compatibility
      return (data || []).map(transaction => ({
        ...transaction,
        amount: transaction.value
      }));
    },
  });
};

export const useDailyData = (days: number) => {
  return useQuery({
    queryKey: ['daily-data', days],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userData) throw new Error('Dados do usuário não encontrados');

      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .gte('tx_date', startDate.toISOString())
        .lte('tx_date', endDate.toISOString())
        .order('tx_date', { ascending: true });

      if (error) throw error;

      // Group by day and calculate daily totals
      const dailyData = [];
      for (let i = 0; i < days; i++) {
        const date = subDays(endDate, days - 1 - i);
        const dayTransactions = (data || []).filter(t => {
          const txDate = new Date(t.tx_date);
          return txDate.toDateString() === date.toDateString();
        });

        const receitas = dayTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => sum + Number(t.value), 0);
        const despesas = dayTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => sum + Number(t.value), 0);

        dailyData.push({
          mes: format(date, 'dd/MM'),
          receitas,
          despesas,
          fluxoLiquido: receitas - despesas,
          gastosRecorrentes: dayTransactions
            .filter(t => t.type === 'despesa' && t.is_recurring)
            .reduce((sum, t) => sum + Number(t.value), 0),
          isFuture: false
        });
      }

      return dailyData;
    },
  });
};

export const useChartData = () => {
  return useQuery({
    queryKey: ['chart-data'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userData) throw new Error('Dados do usuário não encontrados');

      // Get all transactions to process installments correctly
      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .order('tx_date', { ascending: true });

      // Generate data for last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const startDate = startOfMonth(date);
        const endDate = endOfMonth(date);

        // Get regular transactions for this month
        const monthRegularTransactions = (allTransactions || []).filter(t => {
          const txDate = new Date(t.tx_date);
          return txDate >= startDate && txDate <= endDate && !t.is_installment;
        });

        // Get installment transactions that should be counted in this month
        const monthInstallmentTransactions = (allTransactions || []).filter(t => {
          if (!t.is_installment || !t.installment_start_date || !t.total_installments) return false;
          
          const installmentStart = new Date(t.installment_start_date);
          const monthsDiff = (date.getFullYear() - installmentStart.getFullYear()) * 12 + 
                           (date.getMonth() - installmentStart.getMonth());
          
          return monthsDiff >= 0 && monthsDiff < t.total_installments;
        });

        // Calculate regular income and expenses
        const regularReceitas = monthRegularTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => sum + Number(t.value), 0);

        const regularDespesas = monthRegularTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => sum + Number(t.value), 0);

        // Calculate installment income and expenses - FIXED: Use individual installment value
        const installmentReceitas = monthInstallmentTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => {
            const installmentValue = t.installment_value ? Number(t.installment_value) : Number(t.value) / Number(t.total_installments);
            return sum + installmentValue;
          }, 0);

        const installmentDespesas = monthInstallmentTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => {
            const installmentValue = t.installment_value ? Number(t.installment_value) : Number(t.value) / Number(t.total_installments);
            return sum + installmentValue;
          }, 0);

        const receitas = regularReceitas + installmentReceitas;
        const despesas = regularDespesas + installmentDespesas;

        const gastosRecorrentes = monthRegularTransactions
          .filter(t => t.type === 'despesa' && t.is_recurring)
          .reduce((sum, t) => sum + Number(t.value), 0);

        // Get bills for this month
        const billsResult = await supabase
          .from('credit_card_bills')
          .select('bill_amount')
          .eq('user_id', userData.id)
          .gte('due_date', startDate.toISOString().split('T')[0])
          .lte('due_date', endDate.toISOString().split('T')[0]);

        const faturas = billsResult.data?.reduce((sum, bill) => sum + Number(bill.bill_amount), 0) || 0;

        months.push({
          mes: format(date, 'MMM'),
          receitas,
          despesas,
          gastosRecorrentes,
          faturas
        });
      }

      // Get category data
      const { data: categoryTransactions } = await supabase
        .from('transactions')
        .select('category, value')
        .eq('user_id', userData.id)
        .eq('type', 'despesa');

      const categoryTotals = {};
      categoryTransactions?.forEach(t => {
        if (!categoryTotals[t.category]) {
          categoryTotals[t.category] = 0;
        }
        categoryTotals[t.category] += Number(t.value);
      });

      const categoryData = Object.entries(categoryTotals).map(([name, value], index) => ({
        name,
        value: value as number,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
      })).sort((a, b) => b.value - a.value);

      return { 
        monthlyData: months, 
        categoryData 
      };
    },
  });
};

export const useChartDataWithInstallments = () => {
  const { data } = useChartData();
  return data?.monthlyData || [];
};
