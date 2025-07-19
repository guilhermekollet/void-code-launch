
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useInstallmentTransactions(description: string, totalInstallments: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['installment-transactions', description, totalInstallments, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) throw new Error('User not found');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('total_installments', totalInstallments)
        .like('description', `%${description.split(' (')[0]}%`)
        .eq('is_installment', true)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!description && totalInstallments > 1,
  });
}
