import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePlanStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['planStatus', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('plan_status, plan_type, completed_onboarding')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching plan status:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}