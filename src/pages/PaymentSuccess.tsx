
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, Mail, Phone, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccountRecovery } from '@/hooks/useAccountRecovery';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [userCreated, setUserCreated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();
  const { verifyAndRecoverPlan, isRecovering } = useAccountRecovery();

  const sessionId = searchParams.get('session_id');
  const maxRetries = 3;

  const checkPaymentAndUser = async (attempt = 1) => {
    try {
      console.log(`[PaymentSuccess] Attempt ${attempt} - Checking payment and user creation...`);
      
      if (!sessionId) {
        setStatus('error');
        setError('Session ID não encontrado');
        return;
      }

      // Primeiro, tentar o processo normal
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, completed_onboarding, plan_type, billing_cycle, trial_end')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        console.error('[PaymentSuccess] Error checking user:', userError);
        throw new Error('Erro ao verificar status do usuário');
      }

      // Se usuário encontrado e onboarding completo, sucesso
      if (userData && userData.completed_onboarding && userData.plan_type) {
        console.log('[PaymentSuccess] User found and onboarding complete:', userData);
        setUserCreated(true);
        setStatus('success');
        return;
      }

      // Se não encontrou ou dados incompletos, verificar onboarding
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      if (onboardingError && onboardingError.code !== 'PGRST116') {
        console.error('[PaymentSuccess] Error checking onboarding:', onboardingError);
        throw new Error('Erro ao verificar dados do onboarding');
      }

      if (!onboardingData) {
        throw new Error('Dados de onboarding não encontrados');
      }

      // Se pagamento não foi confirmado, aguardar ou tentar recovery
      if (!onboardingData.payment_confirmed) {
        if (attempt < maxRetries) {
          console.log('[PaymentSuccess] Payment not confirmed, retrying in 3 seconds...');
          setTimeout(() => checkPaymentAndUser(attempt + 1), 3000);
          return;
        } else {
          // Última tentativa - tentar recovery
          console.log('[PaymentSuccess] Max retries reached, attempting recovery...');
          const recoveryResult = await verifyAndRecoverPlan(sessionId, onboardingData.email);
          
          if (recoveryResult.success && recoveryResult.recovered) {
            console.log('[PaymentSuccess] Recovery successful!');
            setUserCreated(true);
            setStatus('success');
            return;
          } else {
            throw new Error('Não foi possível confirmar o pagamento após múltiplas tentativas');
          }
        }
      }

      // Se chegou aqui, pagamento confirmado mas usuário não criado - tentar recovery
      console.log('[PaymentSuccess] Payment confirmed but user not created, attempting recovery...');
      const recoveryResult = await verifyAndRecoverPlan(sessionId, onboardingData.email);
      
      if (recoveryResult.success) {
        if (recoveryResult.recovered || recoveryResult.planType) {
          console.log('[PaymentSuccess] Recovery completed successfully');
          setUserCreated(true);
          setStatus('success');
          return;
        }
      }

      // Se ainda não resolveu, tentar criar via edge function como último recurso
      console.log('[PaymentSuccess] Attempting user creation via edge function...');
      const { data: createUserResult, error: createUserError } = await supabase.functions.invoke('create-user-from-onboarding', {
        body: { onboardingId: onboardingData.id }
      });

      if (createUserError) {
        console.error('[PaymentSuccess] Error creating user via edge function:', createUserError);
        throw new Error('Erro ao criar conta do usuário');
      }

      if (createUserResult?.success) {
        console.log('[PaymentSuccess] User created successfully via edge function');
        setUserCreated(true);
        setStatus('success');
      } else {
        throw new Error('Falha na criação do usuário');
      }

    } catch (error) {
      console.error('[PaymentSuccess] Error:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setStatus('error');
      setRetryCount(attempt);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setStatus('loading');
    setError(null);
    await checkPaymentAndUser(1);
    setIsRetrying(false);
  };

  const handleContactSupport = () => {
    window.open('https://wa.me/5551995915520', '_blank');
  };

  const handleGoToDashboard = () => {
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setError('Session ID não encontrado');
      return;
    }

    const timer = setTimeout(() => checkPaymentAndUser(1), 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [sessionId]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
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
                {retryCount > 0 && (
                  <div className="mt-2 text-sm text-gray-500">
                    Tentativa {retryCount} de {maxRetries}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        );

      case 'success':
        return (
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <img 
                  src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
                  alt="Bolsofy Logo" 
                  className="h-12 w-auto mx-auto" 
                />
              </div>
              <CardTitle className="text-2xl text-green-700 mb-2">Bem-vindo ao Bolsofy! 🎉</CardTitle>
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
                >
                  Entrar no Dashboard
                </Button>
                
                <Button
                  onClick={handleContactSupport}
                  variant="outline"
                  className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
                >
                  Falar com Agente no WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'error':
        return (
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
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              {retryCount < maxRetries && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    Tentamos {retryCount} vez(es). Você pode tentar novamente ou entrar em contato conosco.
                  </p>
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
                {retryCount < maxRetries && (
                  <Button 
                    onClick={handleRetry}
                    disabled={isRetrying || isRecovering}
                    className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
                  >
                    {isRetrying || isRecovering ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Tentando Novamente...
                      </>
                    ) : (
                      'Tentar Novamente'
                    )}
                  </Button>
                )}
                
                <Button 
                  onClick={handleContactSupport}
                  variant="outline"
                  className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
                >
                  Falar com Agente no WhatsApp
                </Button>
                
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="outline"
                  className="w-full"
                >
                  Voltar ao Login
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      {renderContent()}
    </div>
  );
};

export default PaymentSuccess;
