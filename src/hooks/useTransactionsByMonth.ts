
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTransactionsByMonth = (monthString: string) => {
  return useQuery({
    queryKey: ['transactions-by-month', monthString],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userData) throw new Error('User data not found');

      // Get current year and convert month string to number
      const currentYear = new Date().getFullYear();
      const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                         'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const monthIndex = monthNames.indexOf(monthString.toLowerCase());
      
      if (monthIndex === -1) {
        throw new Error('Invalid month string');
      }

      const monthNumber = monthIndex + 1;
      const startDate = `${currentYear}-${monthNumber.toString().padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${monthNumber.toString().padStart(2, '0')}-31`;

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name,
            color,
            icon
          )
        `)
        .eq('user_id', userData.id)
        .gte('tx_date', startDate)
        .lte('tx_date', endDate)
        .order('tx_date', { ascending: false });

      if (error) throw error;

      // Map value to amount for compatibility
      return transactions?.map(transaction => ({
        ...transaction,
        amount: transaction.value
      })) || [];
    },
    enabled: !!monthString,
  });
};
