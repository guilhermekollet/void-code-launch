
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [userCreated, setUserCreated] = useState(false);
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
        console.log('Verificando pagamento e criação de usuário...');
        
        // Verificar se o usuário já foi criado na tabela users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, completed_onboarding, plan_type, billing_cycle')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Erro ao verificar usuário:', userError);
          throw new Error('Erro ao verificar status do usuário');
        }

        if (userData && userData.completed_onboarding && userData.plan_type) {
          console.log('Usuário encontrado e onboarding completo:', userData);
          setUserCreated(true);
          setStatus('success');
          return;
        }

        // Se não encontrou na users, verificar no onboarding
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (onboardingError && onboardingError.code !== 'PGRST116') {
          console.error('Erro ao verificar onboarding:', onboardingError);
          throw new Error('Erro ao verificar dados do onboarding');
        }

        if (!onboardingData) {
          throw new Error('Dados de onboarding não encontrados');
        }

        if (!onboardingData.payment_confirmed) {
          // Aguardar confirmação do pagamento via webhook
          console.log('Aguardando confirmação do pagamento...');
          setTimeout(checkPaymentAndUser, 3000); // Tentar novamente em 3 segundos
          return;
        }

        // Se chegou aqui, o pagamento foi confirmado
        console.log('Pagamento confirmado, verificando criação do usuário...');
        
        // Verificar novamente se o usuário foi criado após o webhook
        const { data: updatedUserData, error: updatedUserError } = await supabase
          .from('users')
          .select('id, email, completed_onboarding, plan_type, billing_cycle')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (!updatedUserError && updatedUserData && updatedUserData.completed_onboarding) {
          console.log('Usuário criado com sucesso:', updatedUserData);
          setUserCreated(true);
          setStatus('success');
          return;
        }

        // Se ainda não foi criado, tentar criar via edge function
        console.log('Tentando criar usuário via edge function...');
        const { data: createUserResult, error: createUserError } = await supabase.functions.invoke('create-user-from-onboarding', {
          body: { onboardingId: onboardingData.id }
        });

        if (createUserError) {
          console.error('Erro ao criar usuário:', createUserError);
          throw new Error('Erro ao criar conta do usuário');
        }

        if (createUserResult?.success) {
          console.log('Usuário criado com sucesso via edge function:', createUserResult);
          setUserCreated(true);
          setStatus('success');
        } else {
          throw new Error('Falha na criação do usuário');
        }

      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
        setStatus('error');
      }
    };

    // Iniciar verificação após um breve delay
    const timer = setTimeout(checkPaymentAndUser, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [sessionId]);

  const handleContactSupport = () => {
    window.open('https://wa.me/5551995915520', '_blank');
  };

  const handleGoToDashboard = () => {
    navigate('/', { replace: true });
  };

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
