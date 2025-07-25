import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ConfettiRain } from '@/components/ConfettiRain';

const RepaymentSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const sessionId = searchParams.get('session_id');

  const verifyReactivation = async (attempt: number = 1) => {
    if (!sessionId) {
      console.error('Session ID not found in URL parameters');
      setError('Session ID não encontrado na URL');
      setIsVerifying(false);
      return;
    }

    console.log(`[RepaymentSuccess] Attempt ${attempt} - Verifying reactivation for session:`, sessionId);
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('verify-reactivation', {
        body: { sessionId }
      });

      const duration = Date.now() - startTime;
      console.log(`[RepaymentSuccess] Verification took ${duration}ms`, { data, error });

      if (error) {
        console.error(`[RepaymentSuccess] Edge function error on attempt ${attempt}:`, error);
        
        // Auto-retry for certain errors (max 3 attempts)
        if (attempt < 3 && (error.message?.includes('timeout') || error.message?.includes('network'))) {
          console.log(`[RepaymentSuccess] Retrying in 2 seconds... (attempt ${attempt + 1})`);
          setRetryCount(attempt);
          setIsRetrying(true);
          
          setTimeout(() => {
            setIsRetrying(false);
            verifyReactivation(attempt + 1);
          }, 2000);
          return;
        }
        
        setError(error.message || 'Erro ao verificar reativação');
      } else if (data?.success) {
        console.log('[RepaymentSuccess] Reactivation verified successfully:', data);
        setVerificationResult(data);
        setShowConfetti(true);
        
        // Stop confetti after 5 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
      } else {
        console.error('[RepaymentSuccess] Reactivation verification failed:', data);
        setError(data?.error || 'Falha na verificação da reativação');
      }
    } catch (err) {
      console.error(`[RepaymentSuccess] Exception on attempt ${attempt}:`, err);
      
      // Auto-retry for network errors
      if (attempt < 3) {
        console.log(`[RepaymentSuccess] Retrying due to exception... (attempt ${attempt + 1})`);
        setRetryCount(attempt);
        setIsRetrying(true);
        
        setTimeout(() => {
          setIsRetrying(false);
          verifyReactivation(attempt + 1);
        }, 2000);
        return;
      }
      
      setError('Erro inesperado ao verificar reativação');
    } finally {
      if (attempt >= 3 || !isRetrying) {
        setIsVerifying(false);
        setIsRetrying(false);
      }
    }
  };

  useEffect(() => {
    verifyReactivation();
  }, [sessionId]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img 
                src="https://vkmyobxdztspftuamiyp.supabase.co/storage/v1/object/public/bsf//bsf-logo.png" 
                alt="Bolsofy Logo" 
                className="h-12 w-auto mx-auto" 
              />
            </div>
            <div className="mx-auto mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <CardTitle>Verificando Reativação</CardTitle>
            <CardDescription>
              {isRetrying ? `Tentativa ${retryCount + 1} de 3...` : 'Confirmando a reativação da sua assinatura...'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img 
                src="https://vkmyobxdztspftuamiyp.supabase.co/storage/v1/object/public/bsf//bsf-logo.png" 
                alt="Bolsofy Logo" 
                className="h-12 w-auto mx-auto" 
              />
            </div>
            <div className="mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-red-600">Erro na Reativação</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              <p>Erro: {error}</p>
              {retryCount > 0 && (
                <p className="mt-2">Tentativas realizadas: {retryCount}</p>
              )}
            </div>
            
            <Button 
              onClick={() => {
                setError(null);
                setIsVerifying(true);
                setRetryCount(0);
                verifyReactivation();
              }} 
              className="w-full"
              variant="outline"
            >
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => navigate('/recover')} 
              className="w-full"
              variant="outline"
            >
              Voltar para Recuperação
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
            >
              Ir para Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationResult?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 relative">
        {showConfetti && <ConfettiRain />}
        
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img 
                src="https://vkmyobxdztspftuamiyp.supabase.co/storage/v1/object/public/bsf//bsf-logo.png" 
                alt="Bolsofy Logo" 
                className="h-12 w-auto mx-auto" 
              />
            </div>
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-green-600">Reativação Confirmada!</CardTitle>
            <CardDescription>
              Sua assinatura foi reativada com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Detalhes da Reativação:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Plano: {verificationResult.planType === 'basic' ? 'Básico' : 'Premium'}</li>
                <li>• Ciclo: {verificationResult.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</li>
                <li>• Status: Ativo</li>
              </ul>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              <p>Bem-vindo de volta ao Bolsofy!</p>
              <p>Você já pode usar todos os recursos da plataforma.</p>
            </div>
            
            <Button 
              onClick={() => navigate('/')} 
              className="w-full bg-[#61710C] hover:bg-[#4a5709] text-white"
            >
              Ir para Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default RepaymentSuccess;