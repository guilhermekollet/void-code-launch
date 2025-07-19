// hooks/usePaymentVerification.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAccountRecovery } from '@/hooks/useAccountRecovery';
import { logger } from '@/utils/logger';

interface PaymentVerificationState {
    status: 'loading' | 'success' | 'error';
    message?: string;
    userCreated?: boolean;
  }
  
  interface PaymentVerificationResult {
    success: boolean;
    userCreated?: boolean;
    message?: string;
  }
  
  interface UserData {
    id: number;
    email: string;
    completed_onboarding: boolean;
    plan_type: string;
    billing_cycle: string;
    trial_end: string;
  }
  
  interface OnboardingData {
    id: string;
    email: string;
    payment_confirmed: boolean;
    stripe_session_id: string;
  }
  
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 3000;
  const BACKOFF_MULTIPLIER = 1.5;
  
  export const usePaymentVerification = () => {
    const [paymentStatus, setPaymentStatus] = useState<PaymentVerificationState>({
      status: 'loading'
    });
    
    const { verifyAndRecoverPlan } = useAccountRecovery();
    const abortControllerRef = useRef<AbortController | null>(null);
    const retryCountRef = useRef(0);
  
    const cleanup = useCallback(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }, []);
  
    const checkExistingUser = async (sessionId: string): Promise<UserData | null> => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, completed_onboarding, plan_type, billing_cycle, trial_end')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();
  
      if (error && error.code !== 'PGRST116') {
        logger.error('Error checking existing user', { error, sessionId });
        throw new Error('Erro ao verificar status do usuário');
      }
  
      return data;
    };
  
    const checkOnboardingData = async (sessionId: string): Promise<OnboardingData> => {
      const { data, error } = await supabase
        .from('onboarding')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();
  
      if (error && error.code !== 'PGRST116') {
        logger.error('Error checking onboarding data', { error, sessionId });
        throw new Error('Erro ao verificar dados do onboarding');
      }
  
      if (!data) {
        throw new Error('Dados de onboarding não encontrados');
      }
  
      return data;
    };
  
    const createUserViaEdgeFunction = async (onboardingId: string): Promise<boolean> => {
      const { data, error } = await supabase.functions.invoke('create-user-from-onboarding', {
        body: { onboardingId }
      });
  
      if (error) {
        logger.error('Error creating user via edge function', { error, onboardingId });
        throw new Error('Erro ao criar conta do usuário');
      }
  
      return data?.success || false;
    };
  
    const performPaymentVerification = async (
      sessionId: string,
      attempt: number = 1
    ): Promise<PaymentVerificationResult> => {
      try {
        logger.info('Starting payment verification', { sessionId, attempt });
  
        // Verificar se usuário já existe e está completo
        const userData = await checkExistingUser(sessionId);
        
        if (userData?.completed_onboarding && userData.plan_type) {
          logger.info('User found and onboarding complete', { userId: userData.id });
          return { success: true, userCreated: true };
        }
  
        // Verificar dados de onboarding
        const onboardingData = await checkOnboardingData(sessionId);
  
        // Se pagamento não confirmado, tentar novamente ou recovery
        if (!onboardingData.payment_confirmed) {
          if (attempt < MAX_RETRIES) {
            logger.info('Payment not confirmed, will retry', { attempt, maxRetries: MAX_RETRIES });
            
            const delay = RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
            
            return new Promise((resolve) => {
              setTimeout(async () => {
                try {
                  const result = await performPaymentVerification(sessionId, attempt + 1);
                  resolve(result);
                } catch (error) {
                  resolve({ 
                    success: false, 
                    message: error instanceof Error ? error.message : 'Erro desconhecido' 
                  });
                }
              }, delay);
            });
          } else {
            // Última tentativa - tentar recovery
            logger.info('Max retries reached, attempting recovery');
            const recoveryResult = await verifyAndRecoverPlan(sessionId, onboardingData.email);
            
            if (recoveryResult.success && recoveryResult.recovered) {
              return { success: true, userCreated: true };
            } else {
              throw new Error('Não foi possível confirmar o pagamento após múltiplas tentativas');
            }
          }
        }
  
        // Pagamento confirmado mas usuário não criado - tentar recovery
        logger.info('Payment confirmed but user not created, attempting recovery');
        const recoveryResult = await verifyAndRecoverPlan(sessionId, onboardingData.email);
        
        if (recoveryResult.success && (recoveryResult.recovered || recoveryResult.planType)) {
          return { success: true, userCreated: true };
        }
  
        // Último recurso - criar via edge function
        logger.info('Attempting user creation via edge function');
        const userCreated = await createUserViaEdgeFunction(onboardingData.id);
        
        if (userCreated) {
          return { success: true, userCreated: true };
        } else {
          throw new Error('Falha na criação do usuário');
        }
  
      } catch (error) {
        logger.error('Payment verification failed', { error, sessionId, attempt });
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Erro desconhecido' 
        };
      }
    };
  
    const verifyPayment = useCallback(async (sessionId: string) => {
      cleanup();
      
      abortControllerRef.current = new AbortController();
      retryCountRef.current = 0;
      
      setPaymentStatus({ status: 'loading' });
  
      try {
        const result = await performPaymentVerification(sessionId);
        
        if (result.success) {
          setPaymentStatus({ 
            status: 'success', 
            userCreated: result.userCreated 
          });
        } else {
          setPaymentStatus({ 
            status: 'error', 
            message: result.message || 'Erro desconhecido' 
          });
        }
      } catch (error) {
        setPaymentStatus({ 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
      }
    }, [cleanup, verifyAndRecoverPlan]);
  
    useEffect(() => {
      return cleanup;
    }, [cleanup]);
  
    return {
      paymentStatus,
      verifyPayment
    };
  };
  