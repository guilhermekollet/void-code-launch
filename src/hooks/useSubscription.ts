
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      console.log('[useSubscription] Checking subscription for user:', user.id);

      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');

        if (error) {
          console.error('Error checking subscription:', error);
          return {
            plan_type: 'free',
            billing_cycle: 'monthly',
            status: 'active',
            current_period_end: null
          };
        }

        console.log('[useSubscription] Subscription data from function:', data);

        // Se não há dados válidos, verificar na tabela users local
        if (!data || !data.plan_type) {
          console.log('[useSubscription] No data from function, checking local users table');
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('plan_type, billing_cycle, trial_start, trial_end')
            .eq('user_id', user.id)
            .single();

          if (userError) {
            console.error('[useSubscription] Error fetching user data:', userError);
            return {
              plan_type: 'free',
              billing_cycle: 'monthly',
              status: 'active',
              current_period_end: null
            };
          }

          if (userData) {
            console.log('[useSubscription] User data from local table:', userData);
            return {
              plan_type: userData.plan_type || 'free',
              billing_cycle: userData.billing_cycle || 'monthly',
              status: 'active',
              current_period_end: userData.trial_end
            };
          }
        }

        return data;
      } catch (error) {
        console.error('[useSubscription] Exception during subscription check:', error);
        return {
          plan_type: 'free',
          billing_cycle: 'monthly',
          status: 'active',
          current_period_end: null
        };
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
