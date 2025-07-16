
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

      // Verificar edge function primeiro
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');

        if (error) {
          console.error('Error checking subscription via edge function:', error);
        } else if (data) {
          console.log('[useSubscription] Subscription data from edge function:', data);
          return data;
        }
      } catch (error) {
        console.error('Edge function call failed:', error);
      }

      // Fallback: verificar tabela users diretamente
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('plan_type, billing_cycle, trial_start, trial_end')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userError) {
          console.error('Error fetching user profile:', userError);
        } else if (userData) {
          console.log('[useSubscription] Found user profile data:', userData);
          const isTrialActive = userData.trial_end ? new Date(userData.trial_end) > new Date() : false;
          return {
            plan_type: userData.plan_type || 'basic',
            billing_cycle: userData.billing_cycle || 'monthly',
            status: userData.plan_type === 'free' ? 'active' : (isTrialActive ? 'trialing' : 'active'),
            current_period_end: userData.trial_end
          };
        }
      } catch (error) {
        console.error('User profile query failed:', error);
      }

      // Ultimate fallback
      console.log('[useSubscription] Returning default basic plan');
      return {
        plan_type: 'basic',
        billing_cycle: 'monthly',
        status: 'active',
        current_period_end: null
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutos (reduzido para garantir dados frescos)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
