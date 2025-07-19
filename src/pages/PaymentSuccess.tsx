import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Tipos para melhor type safety
interface PaymentStatus {
  status: 'loading' | 'success' | 'error';
  message?: string;
  userCreated?: boolean;
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const sessionId = searchParams.get('session_id');
  const { paymentStatus, verifyPayment } = usePaymentVerification();

  // Validação segura do session ID
  const validateSessionId = (id: string | null): string | null => {
    if (!id) return null;
    
    // Whitelist rigorosa: apenas caracteres alfanuméricos, hífens e underscores
    const validSessionIdRegex = /^[a-zA-Z0-9_-]{10,100}$/;
    
    if (!validSessionIdRegex.test(id)) {
      logger.warn('Invalid session ID format attempted');
      return null;
    }
    
    return id;
  };

  const validSessionId = validateSessionId(sessionId);

  const handleContactSupport = (): void => {
    const whatsappUrl = 'https://wa.me/5551995915520';
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGoToDashboard = (): void => {
    navigate('/', { replace: true });
  };

  const handleBackToLogin = (): void => {
    navigate('/login', { replace: true });
  };

  // Efeito principal para verificação de pagamento
  useEffect(() => {
    if (!validSessionId) {
      logger.error('Payment verification failed: Invalid session ID');
      return;
    }

    // Delay inicial para evitar race conditions
    const timeoutId = setTimeout(() => {
      verifyPayment(validSessionId);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [validSessionId, verifyPayment]);

  const renderLoadingState = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <img 
            src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
            alt="Bolsofy Logo" 
            className="h-12 w-auto mx-auto" 
          />
        </div>
        <div className="mx-auto mb-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <CardTitle>Processando Pagamento</CardTitle>
        <CardDescription>
          Aguarde enquanto confirmamos seu pagamento e criamos sua conta...
        </CardDescription>
      </CardHeader>
    </Card>
  );

  const renderSuccessState = () => (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <img 
            src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
            alt="Bolsofy Logo" 
            className="h-12 w-auto mx-auto" 
          />
        </div>
        <CardTitle className="text-2xl text-green-700 mb-2">
          Bem-vindo ao Bolsofy! 🎉
        </CardTitle>
        <CardDescription className="text-lg">
          Sua conta foi criada com sucesso! Você tem 3 dias grátis para explorar todos os recursos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <p className="font-medium">🎁 Período de teste ativo!</p>
          <p>Aproveite 3 dias grátis para conhecer todos os recursos do Bolsofy.</p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleGoToDashboard}
            className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
            aria-label="Ir para o dashboard principal"
          >
            Entrar no Dashboard
          </Button>
          
          <Button
            onClick={handleContactSupport}
            variant="outline"
            className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
            aria-label="Entrar em contato com suporte via WhatsApp"
          >
            Falar com Agente no WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <img 
            src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
            alt="Bolsofy Logo" 
            className="h-12 w-auto mx-auto" 
          />
        </div>
        <div className="mx-auto mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <CardTitle className="text-red-700">Erro no Processamento</CardTitle>
        <CardDescription>
          Ocorreu um erro ao processar seu pagamento ou criar sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentStatus.message && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {paymentStatus.message}
          </div>
        )}
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Precisa de ajuda?</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>suporte@bolsofy.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>WhatsApp: (51) 99591-5520</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <Button 
            onClick={handleContactSupport}
            className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
            aria-label="Contatar suporte via WhatsApp"
          >
            Falar com Agente no WhatsApp
          </Button>
          
          <Button 
            onClick={handleBackToLogin}
            variant="outline"
            className="w-full"
            aria-label="Voltar para a página de login"
          >
            Voltar ao Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    // Se session ID é inválido, mostrar erro imediatamente
    if (!validSessionId) {
      return renderErrorState();
    }

    switch (paymentStatus.status) {
      case 'loading':
        return renderLoadingState();
      case 'success':
        return renderSuccessState();
      case 'error':
        return renderErrorState();
      default:
        return renderLoadingState();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      {renderContent()}
    </div>
  );
};

export default PaymentSuccess;

// ===== CUSTOM HOOK: usePaymentVerification =====

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAccountRecovery } from '@/hooks/useAccountRecovery';
import { logger } from '../utils/logger.ts';

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

export const usePaymentVerification = () => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentVerificationState>({
    status: 'loading'
  });
  
  const { verifyAndRecoverPlan } = useAccountRecovery();
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 3000;
  const BACKOFF_MULTIPLIER = 1.5;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Verificar usuário existente
  const checkExistingUser = async (sessionId: string): Promise<any> => {
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

  // Verificar dados de onboarding
  const checkOnboardingData = async (sessionId: string): Promise<any> => {
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

  // Criar usuário via edge function
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

  // Processo principal de verificação
  const performPaymentVerification = async (
    sessionId: string,
    attempt: number = 1
  ): Promise<PaymentVerificationResult> => {
    try {
      logger.info('Starting payment verification', { sessionId, attempt });

      // Verificar se usuário já existe e está completo
      const userData = await checkExistingUser(sessionId);
      
      if (userData && userData.completed_onboarding && userData.plan_type) {
        logger.info('User found and onboarding complete', { userId: userData.id });
        return { success: true, userCreated: true };
      }

      // Verificar dados de onboarding
      const onboardingData = await checkOnboardingData(sessionId);

      // Se pagamento não confirmado, tentar novamente ou recovery
      if (!onboardingData.payment_confirmed) {
        if (attempt < MAX_RETRIES) {
          logger.info('Payment not confirmed, will retry', { attempt, maxRetries: MAX_RETRIES });
          
          // Delay com backoff exponencial
          const delay = RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
          
          return new Promise((resolve) => {
            setTimeout(async () => {
              try {
                const result = await performPaymentVerification(sessionId, attempt + 1);
                resolve(result);
              } catch (error) {
                resolve({ success: false, message: error.message });
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

  // Função principal exportada
  const verifyPayment = useCallback(async (sessionId: string) => {
    // Cleanup previous operation
    cleanup();
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    // Reset retry count
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

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    paymentStatus,
    verifyPayment
  };
};