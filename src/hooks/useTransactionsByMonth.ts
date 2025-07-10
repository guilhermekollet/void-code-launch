
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const useTransactionsByMonth = (selectedMonth: Date) => {
  return useQuery({
    queryKey: ['transactions-by-month', format(selectedMonth, 'yyyy-MM')],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userData) throw new Error('Dados do usuário não encontrados');

      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories!inner(name, icon, color)
        `)
        .eq('user_id', userData.id)
        .gte('tx_date', format(startDate, 'yyyy-MM-dd'))
        .lte('tx_date', format(endDate, 'yyyy-MM-dd'))
        .order('tx_date', { ascending: false });

      if (error) throw error;

      // Group by category and calculate totals
      const categoryTotals = transactions?.reduce((acc, transaction) => {
        const category = transaction.category;
        const amount = Number(transaction.value || 0); // Using 'value' instead of 'amount'
        
        if (!acc[category]) {
          acc[category] = {
            name: category,
            total: 0,
            count: 0,
            color: transaction.categories?.color || '#61710C',
            icon: transaction.categories?.icon || 'tag'
          };
        }
        
        acc[category].total += amount;
        acc[category].count += 1;
        
        return acc;
      }, {} as Record<string, any>) || {};

      const sortedCategories = Object.values(categoryTotals)
        .sort((a: any, b: any) => b.total - a.total);

      return {
        transactions: transactions || [],
        categoryTotals: sortedCategories,
        totalTransactions: transactions?.length || 0,
        totalAmount: transactions?.reduce((sum, t) => sum + Number(t.value || 0), 0) || 0
      };
    },
  });
};
