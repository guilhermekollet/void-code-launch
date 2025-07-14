
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, RefreshCw, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ConfettiRain } from '@/components/ConfettiRain';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [accountCreated, setAccountCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isManualProcessing, setIsManualProcessing] = useState(false);

  const sessionId = searchParams.get('session_id');

  const checkAccountCreation = async (sessionId: string) => {
    try {
      console.log('[PaymentSuccess] Checking account creation for session:', sessionId);

      // First check if onboarding record exists and is confirmed
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();

      if (onboardingError) {
        console.error('[PaymentSuccess] Onboarding error:', onboardingError);
        throw new Error('Registro de onboarding não encontrado');
      }

      console.log('[PaymentSuccess] Onboarding data:', onboardingData);

      if (!onboardingData.payment_confirmed) {
        console.log('[PaymentSuccess] Payment not yet confirmed, continuing to poll...');
        return false;
      }

      // Check if user account was created
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', onboardingData.email)
        .single();

      if (userError || !userData) {
        console.log('[PaymentSuccess] User account not found, continuing to poll...');
        return false;
      }

      console.log('[PaymentSuccess] Account found successfully:', userData);
      return true;
    } catch (error) {
      console.error('[PaymentSuccess] Error checking account:', error);
      throw error;
    }
  };

  const processPaymentManually = async () => {
    if (!sessionId) return;

    setIsManualProcessing(true);
    try {
      console.log('[PaymentSuccess] Processing payment manually for session:', sessionId);
      
      const { data, error } = await supabase.functions.invoke('process-payment-manually', {
        body: { sessionId }
      });

      if (error) throw error;

      if (data.success) {
        setAccountCreated(true);
        setError(null);
        toast({
          title: "Conta criada com sucesso!",
          description: "Sua conta foi processada manualmente.",
        });
      } else {
        throw new Error(data.error || 'Falha no processamento manual');
      }
    } catch (error: any) {
      console.error('[PaymentSuccess] Manual processing error:', error);
      setError(`Erro no processamento manual: ${error.message}`);
    } finally {
      setIsManualProcessing(false);
    }
  };

  useEffect(() => {
    if (!sessionId) {
      setError('ID da sessão não encontrado na URL');
      setIsLoading(false);
      return;
    }

    const pollAccountCreation = async () => {
      try {
        const accountExists = await checkAccountCreation(sessionId);
        
        if (accountExists) {
          setAccountCreated(true);
          setIsLoading(false);
          return;
        }

        // Continue polling if account not created yet
        if (retryCount < 20) { // Poll for up to 2 minutes (20 * 6 seconds)
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 6000);
        } else {
          setIsLoading(false);
          setError('Tempo limite excedido. A conta pode ainda estar sendo processada.');
        }
      } catch (error: any) {
        console.error('[PaymentSuccess] Polling error:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    pollAccountCreation();
  }, [sessionId, retryCount]);

  const handleContinue = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              ID da sessão de pagamento não encontrado.
            </p>
            <Button onClick={() => navigate('/register')} className="w-full">
              Voltar ao Cadastro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#61710C]">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Processando Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Aguarde enquanto processamos seu pagamento e criamos sua conta...
            </p>
            <div className="text-sm text-gray-500">
              Tentativa {retryCount + 1} de 20
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !accountCreated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro no Processamento
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {error}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={processPaymentManually}
                disabled={isManualProcessing}
                className="w-full"
              >
                {isManualProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/register')}
                className="w-full"
              >
                Voltar ao Cadastro
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-4">
              Se o problema persistir, entre em contato conosco pelo WhatsApp.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <ConfettiRain />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#61710C]">
            <CheckCircle className="h-5 w-5" />
            Pagamento Confirmado!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">
              Seu pagamento foi processado com sucesso e sua conta foi criada!
            </p>
            <p className="text-sm text-gray-500">
              Você pode agora acessar todas as funcionalidades do Bolsofy.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700 font-medium">
              ✅ Conta criada com sucesso
            </p>
            <p className="text-sm text-green-700">
              ✅ Pagamento confirmado
            </p>
            <p className="text-sm text-green-700">
              ✅ Período de teste ativado (7 dias)
            </p>
          </div>

          <Button onClick={handleContinue} className="w-full bg-[#61710C] hover:bg-[#4a5709]">
            {user ? 'Ir para Dashboard' : 'Fazer Login'}
          </Button>

          <div className="text-xs text-gray-500">
            ID da Sessão: {sessionId}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
