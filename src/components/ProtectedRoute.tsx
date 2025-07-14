
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Check if user has completed onboarding and subscription status
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log('[ProtectedRoute] Checking user profile for:', user.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('completed_onboarding, plan_type')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      console.log('[ProtectedRoute] User profile data:', data);
      return data;
    },
    enabled: !!user,
  });

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      console.log('[ProtectedRoute] Checking subscription for user:', user.id);

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
        return {
          plan_type: 'free',
          status: 'active',
          current_period_end: null
        };
      }

      console.log('[ProtectedRoute] Subscription data:', data);
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  if (loading || isLoadingProfile || isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#61710C]"></div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If user doesn't have a profile yet, this means they're completely new
  if (!userProfile) {
    console.log('[ProtectedRoute] No user profile found, redirecting to register');
    return <Navigate to="/register" replace />;
  }

  // Check if user has an active subscription (not free plan)
  const hasActivePlan = subscription && subscription.plan_type !== 'free' && subscription.status === 'active';
  
  // If user hasn't completed onboarding AND doesn't have an active plan, send to register
  if (!userProfile.completed_onboarding && !hasActivePlan) {
    console.log('[ProtectedRoute] User needs to complete onboarding, redirecting to register');
    return <Navigate to="/register" replace />;
  }

  // If user has active plan but onboarding not completed, mark as completed
  if (hasActivePlan && !userProfile.completed_onboarding) {
    console.log('[ProtectedRoute] User has active plan, updating onboarding status');
    // Update user profile asynchronously
    supabase
      .from('users')
      .update({ completed_onboarding: true })
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating onboarding status:', error);
        } else {
          console.log('[ProtectedRoute] Onboarding status updated successfully');
        }
      });
  }

  console.log('[ProtectedRoute] User authenticated and authorized, allowing access');
  return <>{children}</>;
}
