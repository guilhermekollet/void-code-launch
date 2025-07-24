import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { BillingToggle } from '@/components/Settings/BillingToggle';
import { PlanCard } from '@/components/Settings/PlanCard';
import { useAuth } from '@/contexts/AuthContext';
import { useReactivateSubscription } from '@/hooks/useReactivateSubscription';
import { useAccountRecovery } from '@/hooks/useAccountRecovery';
import { supabase } from '@/integrations/supabase/client';

const Recover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const reactivateSubscription = useReactivateSubscription();
  const { verifyAndRecoverPlan, isRecovering } = useAccountRecovery();

  // Verificar se usuário precisa de recuperação
  useEffect(() => {
    const checkRecoveryStatus = async () => {
      try {
        if (!user?.email) {
          // Se não tem usuário logado, verificar por email na URL ou redirecionar
          navigate('/login');
          return;
        }

        setUserEmail(user.email);

        // Verificar status da assinatura usando a edge function
        const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('check-subscription');
        
        if (subscriptionError) {
          console.error('Error checking subscription:', subscriptionError);
          setNeedsRecovery(true);
        } else {
          console.log('Subscription data:', subscriptionData);
          
          // Se o plano está cancelado, expirado ou não tem assinatura ativa, precisa de recovery
          const now = new Date();
          const trialEnd = subscriptionData?.trial_end ? new Date(subscriptionData.trial_end) : null;
          const trialExpired = trialEnd && now > trialEnd;
          
          if (subscriptionData?.plan_status === 'canceled' || 
              trialExpired || 
              !subscriptionData?.subscribed) {
            console.log('User needs recovery:', { 
              planStatus: subscriptionData?.plan_status, 
              trialExpired, 
              subscribed: subscriptionData?.subscribed 
            });
            setNeedsRecovery(true);
          } else {
            // Usuário tem assinatura ativa, redirecionar para dashboard
            navigate('/', { replace: true });
            return;
          }
        }

      } catch (error) {
        console.error('Error checking recovery status:', error);
        setNeedsRecovery(true); // Em caso de erro, permitir seleção de plano
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkRecoveryStatus();
  }, [user, navigate]);

  // Tentar recuperação automática primeiro
  useEffect(() => {
    if (needsRecovery && userEmail && !isCheckingStatus) {
      const attemptAutoRecovery = async () => {
        console.log('Attempting automatic recovery for:', userEmail);
        const result = await verifyAndRecoverPlan(undefined, userEmail);
        
        if (result.success && result.recovered) {
          // Recuperação bem-sucedida, redirecionar para dashboard
          navigate('/', { replace: true });
        }
        // Se não conseguiu recuperar automaticamente, usuário pode escolher plano manualmente
      };

      attemptAutoRecovery();
    }
  }, [needsRecovery, userEmail, isCheckingStatus, verifyAndRecoverPlan, navigate]);

  const handleSubscribe = async (planType: string) => {
    if (!user?.email) {
      navigate('/login');
      return;
    }

    try {
      await reactivateSubscription.mutateAsync({ planType, billingCycle });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
    }
  };

  const handleBillingCycleChange = (checked: boolean) => {
    setBillingCycle(checked ? 'yearly' : 'monthly');
  };

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      icon: '📊',
      monthlyPrice: 19.90,
      yearlyPrice: 199.90,
      features: [
        'Dashboard completo',
        'Controle de gastos',
        'Categorização automática',
        'Relatórios mensais',
        'Suporte por email'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: '🚀',
      monthlyPrice: 29.90,
      yearlyPrice: 289.90,
      popular: true,
      features: [
        'Tudo do plano Básico',
        'Previsões e tendências',
        'Metas financeiras',
        'Alertas personalizados',
        'Exportação de relatórios',
        'Suporte prioritário'
      ]
    }
  ];

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
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
            <CardTitle>Verificando Status</CardTitle>
            <CardDescription>
              Verificando o status da sua conta...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!needsRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img 
                src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
                alt="Bolsofy Logo" 
                className="h-12 w-auto mx-auto" 
              />
            </div>
            <CardTitle>Conta Ativa</CardTitle>
            <CardDescription>
              Sua conta já está ativa e configurada.
            </CardDescription>
          </CardHeader>
          <CardContent>
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="mx-auto mb-6">
            <img 
              src="/lovable-uploads/cbc5c4e1-192c-4793-88bf-85942b0381ab.png" 
              alt="Bolsofy Logo" 
              className="h-16 w-auto mx-auto" 
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Reative sua Assinatura
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Escolha seu plano e continue aproveitando o Bolsofy
          </p>
          
          {isRecovering && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-blue-800 text-sm">Verificando dados da conta...</span>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <BillingToggle 
              billingCycle={billingCycle} 
              onBillingCycleChange={handleBillingCycleChange} 
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingCycle={billingCycle}
                onSubscribe={() => handleSubscribe(plan.id)}
                onManage={() => {}} // Não usado neste contexto
                isCurrentPlan={false}
                isLoading={reactivateSubscription.isPending}
                buttonText="Reativar com Este Plano"
              />
            ))}
          </div>

          <div className="text-center mt-12 text-sm text-gray-500">
            <p>A cobrança será feita imediatamente após a confirmação</p>
            <p>Você terá acesso completo a todos os recursos do plano escolhido</p>
          </div>

          <div className="text-center mt-8">
            <Button 
              onClick={() => navigate('/login')} 
              variant="outline"
              className="text-gray-600"
            >
              Voltar ao Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recover;
