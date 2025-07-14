
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, MessageCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { ConfettiRain } from '@/components/ConfettiRain';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userCreated, setUserCreated] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const attemptsRef = useRef(0);
  const maxAttemptsRef = useRef(30); // 30 tentativas = 90 segundos
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasProcessedRef = useRef(false);
  
  const sessionId = searchParams.get('session_id');

  const clearPolling = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    const checkUserCreation = async () => {
      if (hasProcessedRef.current) {
        console.log('[PAYMENT-SUCCESS] Already processing, skipping...');
        return;
      }

      if (!sessionId) {
        console.error('[PAYMENT-SUCCESS] No session ID found in URL');
        toast({
          title: "Erro",
          description: "ID da sessão não encontrado.",
          variant: "destructive"
        });
        navigate('/register');
        return;
      }

      attemptsRef.current += 1;
      console.log(`[PAYMENT-SUCCESS] Attempt ${attemptsRef.current}/${maxAttemptsRef.current} for session:`, sessionId);

      if (attemptsRef.current > maxAttemptsRef.current) {
        console.log('[PAYMENT-SUCCESS] Max attempts reached, showing timeout state');
        setLoading(false);
        setTimeoutReached(true);
        return;
      }

      try {
        hasProcessedRef.current = true;
        console.log('[PAYMENT-SUCCESS] Starting user creation check for session:', sessionId);
        
        // Verificar se onboarding existe e se payment foi confirmado
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (onboardingError) {
          console.error('[PAYMENT-SUCCESS] Error fetching onboarding data:', onboardingError);
          hasProcessedRef.current = false;
          timeoutRef.current = setTimeout(checkUserCreation, 3000);
          return;
        }

        if (!onboardingData) {
          console.log('[PAYMENT-SUCCESS] No onboarding record found, might need to wait for webhook');
          hasProcessedRef.current = false;
          timeoutRef.current = setTimeout(checkUserCreation, 3000);
          return;
        }

        console.log('[PAYMENT-SUCCESS] Onboarding data found:', {
          id: onboardingData.id,
          email: onboardingData.email,
          payment_confirmed: onboardingData.payment_confirmed,
          stripe_session_id: onboardingData.stripe_session_id
        });

        if (onboardingData.payment_confirmed) {
          console.log('[PAYMENT-SUCCESS] Payment confirmed by webhook, checking if user exists in users table');
          
          // Verificar se usuário foi criado - usando maybeSingle() para evitar erro 406
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, user_id')
            .eq('email', onboardingData.email)
            .maybeSingle();

          if (userError) {
            console.error('[PAYMENT-SUCCESS] Error checking user:', userError);
            hasProcessedRef.current = false;
            timeoutRef.current = setTimeout(checkUserCreation, 3000);
            return;
          }

          if (userData) {
            console.log('[PAYMENT-SUCCESS] User found in users table:', userData);
            setUserCreated(true);
            
            toast({
              title: "Conta criada com sucesso!",
              description: `Seu trial de 7 dias começou!`,
            });

            localStorage.setItem('newUserEmail', onboardingData.email);
            localStorage.removeItem('registrationData');
            setLoading(false);
            clearPolling();
          } else {
            console.log('[PAYMENT-SUCCESS] Payment confirmed but user not found, continuing to wait...');
            hasProcessedRef.current = false;
            timeoutRef.current = setTimeout(checkUserCreation, 3000);
          }
        } else {
          console.log('[PAYMENT-SUCCESS] Payment not confirmed yet, retrying in 3 seconds...');
          hasProcessedRef.current = false;
          timeoutRef.current = setTimeout(checkUserCreation, 3000);
        }
      } catch (error) {
        console.error('[PAYMENT-SUCCESS] Error checking user creation:', error);
        hasProcessedRef.current = false;
        setLoading(false);
        setTimeoutReached(true);
        clearPolling();
      }
    };

    if (!hasProcessedRef.current) {
      checkUserCreation();
    }

    return () => {
      clearPolling();
    };
  }, [sessionId, navigate, toast]);

  const handleGoToLogin = () => {
    const email = localStorage.getItem('newUserEmail');
    navigate('/login', { state: { email } });
  };

  // Estado de carregamento/processamento
  if (loading || (!userCreated && !timeoutReached)) {
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

  // Estado de timeout - conta em processamento (SEM botão de tentar novamente)
  if (timeoutReached && !userCreated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-lg border-[#DEDEDE] bg-white shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-yellow-100">
                <AlertTriangle className="w-12 h-12 text-yellow-600" />
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
                Conta em Processamento
              </h1>
              
              <p className="text-lg text-[#64748B]">
                Seu pagamento foi confirmado! Estamos processando sua conta nos bastidores.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⏳ Sua conta será ativada automaticamente em alguns minutos. Você receberá um email de confirmação quando estiver pronta.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <Button
                variant="outline"
                onClick={() => window.open('https://wa.me/5551995915520', '_blank')}
                className="w-full border-[#61710C] text-[#61710C] hover:bg-[#61710C] hover:text-white"
                size="lg"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
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

  // Estado de sucesso
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
                  <CheckCircle className="w-5 h-5 text-blue-600" />
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
