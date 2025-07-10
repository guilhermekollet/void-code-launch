
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

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
        monthlyBillExpenses
      };
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

      // Generate data for last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const startDate = startOfMonth(date);
        const endDate = endOfMonth(date);

        const [receitasResult, despesasResult] = await Promise.all([
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
            .lte('tx_date', endDate.toISOString())
        ]);

        const receitas = receitasResult.data?.reduce((sum, t) => sum + Number(t.value), 0) || 0;
        const despesas = despesasResult.data?.reduce((sum, t) => sum + Number(t.value), 0) || 0;

        months.push({
          month: format(date, 'MMM'),
          receitas,
          despesas,
        });
      }

      return months;
    },
  });
};
