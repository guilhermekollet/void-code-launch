
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useRecurringTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recurring-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      console.log('Fetching recurring transactions for user:', user.id);

      // First get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) {
        console.log('No user data found');
        return [];
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_recurring', true)
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Error fetching recurring transactions:', error);
        return [];
      }

      console.log('Found recurring transactions:', data?.length || 0);
      console.log('Recurring transactions details:', data);

      return data || [];
    },
    enabled: !!user,
  });
}
