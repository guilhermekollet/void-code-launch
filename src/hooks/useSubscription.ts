
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

      // First try to get subscription from edge function (most reliable)
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

      // Fallback: try to get from subscriptions table
      try {
        const { data: subscriptionData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', (await supabase.from('users').select('id').eq('user_id', user.id).single()).data?.id || 0)
          .maybeSingle();

        if (subError) {
          console.error('Error fetching subscription from table:', subError);
        } else if (subscriptionData) {
          console.log('[useSubscription] Found subscription in table:', subscriptionData);
          return {
            plan_type: subscriptionData.plan_type,
            billing_cycle: 'monthly', // Default if not available
            status: subscriptionData.status,
            current_period_end: subscriptionData.current_period_end
          };
        }
      } catch (error) {
        console.error('Subscription table query failed:', error);
      }

      // Final fallback: get from users table
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
            plan_type: userData.plan_type || 'free',
            billing_cycle: userData.billing_cycle || 'monthly',
            status: userData.plan_type === 'free' ? 'active' : (isTrialActive ? 'trialing' : 'active'),
            current_period_end: userData.trial_end
          };
        }
      } catch (error) {
        console.error('User profile query failed:', error);
      }

      // Ultimate fallback
      console.log('[useSubscription] Returning default free plan');
      return {
        plan_type: 'free',
        billing_cycle: 'monthly',
        status: 'active',
        current_period_end: null
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
