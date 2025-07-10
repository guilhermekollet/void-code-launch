
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addMonths, format, startOfMonth, endOfMonth } from 'date-fns';

export const useReportsFutureData = () => {
  return useQuery({
    queryKey: ['reports-future-data'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userData) throw new Error('Dados do usuário não encontrados');

      const currentDate = new Date();
      const nextMonth = addMonths(currentDate, 1);
      const monthAfterNext = addMonths(currentDate, 2);

      // Get recurring transactions
      const { data: recurringTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .eq('is_recurring', true);

      // Get installment transactions that will continue
      const { data: installmentTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .eq('is_installment', true)
        .gte('tx_date', format(currentDate, 'yyyy-MM-dd'));

      // Calculate future projections
      const nextMonthProjection = calculateMonthProjection(nextMonth, recurringTransactions || [], installmentTransactions || []);
      const monthAfterProjection = calculateMonthProjection(monthAfterNext, recurringTransactions || [], installmentTransactions || []);

      return {
        nextMonth: nextMonthProjection,
        monthAfterNext: monthAfterProjection,
        recurringCount: recurringTransactions?.length || 0,
        installmentCount: installmentTransactions?.length || 0
      };
    },
  });
};

function calculateMonthProjection(
  targetMonth: Date,
  recurringTransactions: any[],
  installmentTransactions: any[]
) {
  let totalIncome = 0;
  let totalExpenses = 0;

  // Process recurring transactions
  recurringTransactions.forEach(transaction => {
    const amount = Number(transaction.value || 0); // Using 'value' instead of 'amount'
    
    if (transaction.type === 'receita') {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }
  });

  // Process installment transactions
  installmentTransactions.forEach(transaction => {
    if (transaction.installment_start_date) {
      const startDate = new Date(transaction.installment_start_date);
      const totalInstallments = transaction.total_installments || 1;
      const installmentValue = Number(transaction.installment_value || transaction.value || 0); // Using 'value' as fallback
      
      // Check if this installment falls in the target month
      for (let i = 0; i < totalInstallments; i++) {
        const installmentDate = addMonths(startDate, i);
        if (
          installmentDate.getMonth() === targetMonth.getMonth() &&
          installmentDate.getFullYear() === targetMonth.getFullYear()
        ) {
          if (transaction.type === 'receita') {
            totalIncome += installmentValue;
          } else {
            totalExpenses += installmentValue;
          }
          break;
        }
      }
    }
  });

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    month: format(targetMonth, 'MMM yyyy')
  };
}
