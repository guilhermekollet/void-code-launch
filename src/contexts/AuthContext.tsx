
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAccountRecovery } from '@/hooks/useAccountRecovery';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // When user logs in, attempt automatic account recovery
        if (event === 'SIGNED_IN' && session?.user?.email) {
          console.log('[AuthContext] User signed in, checking for account recovery needs');
          
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(async () => {
            try {
              // Check if user needs recovery (has onboarding data but incomplete user profile)
              const { data: onboardingData } = await supabase
                .from('onboarding')
                .select('payment_confirmed, stripe_session_id')
                .eq('email', session.user.email)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              const { data: userData } = await supabase
                .from('users')
                .select('completed_onboarding, plan_type')
                .eq('email', session.user.email)
                .maybeSingle();

              // If has onboarding data but user profile is incomplete, attempt recovery
              if (onboardingData && (!userData?.completed_onboarding || !userData?.plan_type)) {
                console.log('[AuthContext] Attempting automatic recovery for user');
                
                // Import the hook function directly to avoid React hooks rules
                const { verifyAndRecoverPlan } = await import('@/hooks/useAccountRecovery').then(module => {
                  const hook = module.useAccountRecovery();
                  return hook;
                });
                
                await verifyAndRecoverPlan(onboardingData.stripe_session_id, session.user.email);
              }
            } catch (error) {
              console.error('[AuthContext] Error during automatic recovery check:', error);
            }
          }, 1000); // 1 second delay to ensure auth is fully established
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      // Check if we're in the account deletion flow or normal logout
      const currentPath = window.location.pathname;
      if (currentPath === '/configuracoes') {
        // If we're on settings page, likely account deletion - let the hook handle redirect
        return;
      }
      // Normal logout - redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
