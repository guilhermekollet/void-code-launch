import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, MessageCircle, ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { ConfettiRain } from '@/components/ConfettiRain';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userCreated, setUserCreated] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const [processingManually, setProcessingManually] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const checkUserCreation = async () => {
      if (!sessionId) {
        toast({
          title: "Erro",
          description: "ID da sessão não encontrado.",
          variant: "destructive"
        });
        navigate('/register');
        return;
      }

      try {
        console.log('Checking if user was created by webhook for session:', sessionId);
        
        // Check if onboarding exists and if payment was confirmed by webhook
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .single();

        if (onboardingError) {
          console.error('Error fetching onboarding data:', onboardingError);
          if (pollingCount < 15) { // Poll for up to 45 seconds (15 * 3s)
            setTimeout(() => {
              setPollingCount(prev => prev + 1);
              checkUserCreation();
            }, 3000);
            return;
          } else {
            console.log('Polling timeout, onboarding data not found');
            setLoading(false);
            return;
          }
        }

        console.log('Onboarding data found:', {
          id: onboardingData.id,
          email: onboardingData.email,
          payment_confirmed: onboardingData.payment_confirmed
        });

        if (onboardingData.payment_confirmed) {
          console.log('Payment confirmed by webhook, checking if user exists in users table');
          
          // Double-check if user was actually created
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', onboardingData.email)
            .single();

          if (userData) {
            console.log('User found in users table:', userData);
            setUserCreated(true);
            
            toast({
              title: "Conta criada com sucesso!",
              description: `Seu trial de 7 dias começou!`,
            });

            // Store user email for login
            localStorage.setItem('newUserEmail', onboardingData.email);
            localStorage.removeItem('registrationData');
          } else {
            console.log('Payment confirmed but user not found in users table, needs manual processing');
            setLoading(false);
          }
        } else if (pollingCount < 15) {
          // Keep polling for webhook to process payment
          console.log(`Polling for payment confirmation... attempt ${pollingCount + 1}`);
          setTimeout(() => {
            setPollingCount(prev => prev + 1);
            checkUserCreation();
          }, 3000);
          return;
        } else {
          console.log('Polling timeout, payment not confirmed by webhook');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking user creation:', error);
        setLoading(false);
      }
    };

    checkUserCreation();
  }, [sessionId, navigate, toast, pollingCount]);

  const handleTryAgain = async () => {
    if (!sessionId) return;

    setProcessingManually(true);
    try {
      console.log('Triggering manual payment processing for session:', sessionId);
      
      const { data, error } = await supabase.functions.invoke('process-payment-manually', {
        body: { sessionId }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar pagamento manualmente');
      }

      if (data.success) {
        console.log('Manual processing successful:', data);
        toast({
          title: "Conta criada com sucesso!",
          description: "Seu trial de 7 dias começou!",
        });
        
        localStorage.setItem('newUserEmail', data.email);
        localStorage.removeItem('registrationData');
        setUserCreated(true);
      } else {
        throw new Error(data.error || 'Erro desconhecido no processamento manual');
      }
    } catch (error) {
      console.error('Error in manual processing:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessingManually(false);
    }
  };

  const handleGoToLogin = () => {
    const email = localStorage.getItem('newUserEmail');
    navigate('/login', { state: { email } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <Card className="w-full max-w-md border-none shadow-lg bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#61710C] mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-[#121212] mb-2">
                  Processando seu pagamento...
                </h3>
                <p className="text-[#64748B] text-sm mb-4">
                  Aguarde enquanto confirmamos seu pagamento e criamos sua conta.
                </p>
                <div className="text-xs text-[#64748B] mb-4">
                  Tentativa {pollingCount + 1} de 15
                </div>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-[#61710C] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#61710C] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-[#61710C] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!userCreated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-lg border-[#DEDEDE] bg-white shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-12 h-12 text-yellow-600" />
              </div>
            </div>
            
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
                alt="Bolsofy Logo" 
                className="h-12 w-auto" 
              />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-[#121212]">
                Processando sua conta...
              </h1>
              
              <p className="text-lg text-[#64748B]">
                Seu pagamento foi confirmado! Estamos finalizando a criação da sua conta.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⏳ Se sua conta não for criada automaticamente em alguns segundos, clique no botão abaixo para tentar novamente.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <Button
                onClick={handleTryAgain}
                disabled={processingManually}
                className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white text-lg py-3"
                size="lg"
              >
                {processingManually ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Tentar Novamente'
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open('https://wa.me/5551995915520', '_blank')}
                className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
                size="lg"
              >
                Precisa de ajuda? Fale conosco
              </Button>
            </div>

            <div className="pt-4 border-t border-[#DEDEDE]">
              <p className="text-xs text-[#64748B]">
                Caso continue com problemas, nossa equipe está pronta para te ajudar via WhatsApp.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      <ConfettiRain />
      
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <Card className="w-full max-w-lg border-[#DEDEDE] bg-white shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
                alt="Bolsofy Logo" 
                className="h-12 w-auto" 
              />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-[#121212]">
                🎉 Bem-vindo ao Bolsofy!
              </h1>
              
              <p className="text-lg text-[#64748B]">
                Sua assinatura foi confirmada com sucesso! Sua conta foi criada e agora você pode começar a controlar suas finanças de forma inteligente.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Trial Gratuito Iniciado!</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Você tem <strong>7 dias</strong> de acesso completo gratuito
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Aproveite todos os recursos premium!
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✅ Pagamento processado<br/>
                  ✅ Conta criada<br/>
                  ✅ Trial de 7 dias iniciado<br/>
                  ✅ Acesso liberado
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <Button
                onClick={handleGoToLogin}
                className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white text-lg py-3"
                size="lg"
              >
                Fazer Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open('https://wa.me/5551995915520', '_blank')}
                className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
                size="lg"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Falar com nosso agente
              </Button>
            </div>

            <div className="pt-4 border-t border-[#DEDEDE]">
              <p className="text-xs text-[#64748B]">
                Dúvidas? Nossa equipe está pronta para te ajudar via WhatsApp.
                <br/>Aproveite seus 7 dias de trial gratuito!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
