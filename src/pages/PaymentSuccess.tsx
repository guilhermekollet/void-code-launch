import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, MessageCircle, ArrowRight, Clock } from 'lucide-react';
import { ConfettiRain } from '@/components/ConfettiRain';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userCreated, setUserCreated] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
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
          if (pollingCount < 10) { // Poll for up to 30 seconds (10 * 3s)
            setTimeout(() => {
              setPollingCount(prev => prev + 1);
              checkUserCreation();
            }, 3000);
            return;
          } else {
            throw new Error('Onboarding data not found after polling');
          }
        }

        if (onboardingData.payment_confirmed) {
          console.log('Payment confirmed by webhook, user should be created');
          setUserCreated(true);
          
          toast({
            title: "Conta criada com sucesso!",
            description: `Seu trial de 7 dias começou!`,
          });

          // Store user email for login
          localStorage.setItem('newUserEmail', onboardingData.email);
          localStorage.removeItem('registrationData');
        } else if (pollingCount < 10) {
          // Keep polling for webhook to process payment
          console.log(`Polling for payment confirmation... attempt ${pollingCount + 1}`);
          setTimeout(() => {
            setPollingCount(prev => prev + 1);
            checkUserCreation();
          }, 3000);
          return;
        } else {
          throw new Error('Payment not confirmed by webhook after polling');
        }
      } catch (error) {
        console.error('Error checking user creation:', error);
        toast({
          title: "Erro",
          description: "Erro ao verificar criação da conta.",
          variant: "destructive"
        });
        navigate('/register');
      } finally {
        setLoading(false);
      }
    };

    checkUserCreation();
  }, [sessionId, navigate, toast, pollingCount]);

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
                <p className="text-[#64748B] text-sm">
                  Aguarde enquanto confirmamos seu pagamento e criamos sua conta.
                </p>
                <div className="mt-4">
                  <div className="flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-[#61710C] rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-[#61710C] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-[#61710C] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!userCreated) {
    return null; // Will redirect to register page
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
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open('https://wa.me/5551995915520', '_blank')}
                className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
                size="lg"
              >
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
