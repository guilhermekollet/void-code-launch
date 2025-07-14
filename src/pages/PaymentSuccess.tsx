
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'checking' | 'success' | 'processing' | 'error'>('loading');
  const [userCreated, setUserCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setError('Session ID não encontrado');
      return;
    }

    const checkPaymentAndUser = async () => {
      try {
        setStatus('checking');
        
        // Aguardar um pouco para dar tempo do webhook processar
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verificar se o usuário foi criado
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, completed_onboarding')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Erro ao verificar usuário:', userError);
          throw new Error('Erro ao verificar status do usuário');
        }

        if (userData) {
          console.log('Usuário encontrado:', userData);
          setUserCreated(true);
          setStatus('success');
          
          // Redirecionar para login após alguns segundos
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        // Se não encontrou usuário, verificar se o pagamento foi confirmado no onboarding
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (onboardingError && onboardingError.code !== 'PGRST116') {
          console.error('Erro ao verificar onboarding:', onboardingError);
          throw new Error('Erro ao verificar dados do onboarding');
        }

        if (onboardingData?.payment_confirmed) {
          console.log('Pagamento confirmado, mas conta ainda sendo processada');
          setStatus('processing');
        } else {
          console.log('Pagamento ainda não confirmado');
          setStatus('loading');
          
          // Continuar verificando por mais 30 segundos
          setTimeout(checkPaymentAndUser, 2000);
        }

      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
        setStatus('error');
      }
    };

    // Aguardar um pouco antes de começar a verificação
    const timer = setTimeout(checkPaymentAndUser, 1000);
    
    // Timeout de segurança para evitar loop infinito
    const safetyTimeout = setTimeout(() => {
      if (status === 'loading' || status === 'checking') {
        setStatus('processing');
      }
    }, 60000); // 60 segundos

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimeout);
    };
  }, [sessionId, navigate, status]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
      case 'checking':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
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

      case 'success':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-green-700">Pagamento Confirmado!</CardTitle>
              <CardDescription>
                Sua conta foi criada com sucesso. Redirecionando para o login...
              </CardDescription>
            </CardHeader>
          </Card>
        );

      case 'processing':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <AlertCircle className="h-12 w-12 text-orange-500" />
              </div>
              <CardTitle className="text-orange-700">Conta em Processamento</CardTitle>
              <CardDescription>
                Seu pagamento foi confirmado e sua conta está sendo criada. Este processo pode levar alguns minutos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <p>Você receberá um email de confirmação quando sua conta estiver pronta.</p>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Precisa de ajuda?</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>suporte@bolsofy.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>WhatsApp: (11) 99999-9999</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/login')} 
                className="w-full"
                variant="outline"
              >
                Ir para Login
              </Button>
            </CardContent>
          </Card>
        );

      case 'error':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
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
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Precisa de ajuda?</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>suporte@bolsofy.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>WhatsApp: (11) 99999-9999</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/login')} 
                className="w-full"
                variant="outline"
              >
                Voltar ao Login
              </Button>
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
