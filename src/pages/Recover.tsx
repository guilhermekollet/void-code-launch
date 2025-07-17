
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { BillingToggle } from '@/components/Settings/BillingToggle';
import { PlanCard } from '@/components/Settings/PlanCard';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateCheckout } from '@/hooks/useSubscriptionMutations';
import { useAccountRecovery } from '@/hooks/useAccountRecovery';
import { supabase } from '@/integrations/supabase/client';

const Recover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const createCheckout = useCreateCheckout();
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

        // Verificar dados do usuário atual
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('completed_onboarding, plan_type, trial_start')
          .eq('email', user.email)
          .maybeSingle();

        if (userError) {
          console.error('Error checking user data:', userError);
        }

        // Verificar dados do onboarding
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding')
          .select('payment_confirmed, selected_plan, billing_cycle')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (onboardingError && onboardingError.code !== 'PGRST116') {
          console.error('Error checking onboarding data:', onboardingError);
        }

        // Usuário precisa de recuperação se:
        // 1. Não completou onboarding OU não tem plan_type
        // 2. E existe registro no onboarding mas payment_confirmed é false
        const userNeedsRecovery = (!userData?.completed_onboarding || !userData?.plan_type) && 
                                 onboardingData && !onboardingData.payment_confirmed;

        if (userNeedsRecovery) {
          setNeedsRecovery(true);
          // Definir billing cycle baseado no onboarding se disponível
          if (onboardingData?.billing_cycle) {
            setBillingCycle(onboardingData.billing_cycle as 'monthly' | 'yearly');
          }
        } else if (userData?.completed_onboarding && userData?.plan_type) {
          // Usuário já tem conta completa, redirecionar para dashboard
          navigate('/', { replace: true });
          return;
        } else {
          // Caso edge: usuário logado mas sem dados de onboarding, permitir seleção de plano
          setNeedsRecovery(true);
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
      await createCheckout.mutateAsync({ planType, billingCycle });
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
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
            Finalize sua Assinatura
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Escolha seu plano e continue aproveitando o Bolsofy com <strong>3 dias grátis</strong>
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
            <BillingToggle value={billingCycle} onChange={setBillingCycle} />
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
                isLoading={createCheckout.isPending}
                buttonText="Continuar com Este Plano"
              />
            ))}
          </div>

          <div className="text-center mt-12 text-sm text-gray-500">
            <p>Ao continuar, você terá <strong>3 dias grátis</strong> para testar todos os recursos</p>
            <p>Depois será cobrado conforme o plano escolhido</p>
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
