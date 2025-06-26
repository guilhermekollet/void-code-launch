
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from '@/hooks/useSubscription';
import { useCreateCheckout, useCustomerPortal } from '@/hooks/useSubscriptionMutations';
import { Crown, Zap, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BillingToggle } from './BillingToggle';
import { PlanCard } from './PlanCard';
import { SubscriptionStatus } from './SubscriptionStatus';

interface Plan {
  id: string;
  name: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  current?: boolean;
  premium?: boolean;
}

const plans: Plan[] = [{
  id: 'free',
  name: 'Free',
  icon: <Star className="h-6 w-6 text-gray-600" />,
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: ['🤖 Agente de IA Financeiro limitado', '📝 Até 50 lançamentos via Texto', '📊 Relatório Básicos', '🗂️ Até 3 Categorias', '💻 Dashboard Profissional']
}, {
  id: 'basic',
  name: 'Básico',
  icon: <Zap className="h-6 w-6 text-white" />,
  monthlyPrice: 19.90,
  yearlyPrice: 199.90,
  popular: true,
  features: ['🤖 Agente de IA Financeiro', '📝 Lançamentos Ilimitado via Texto, Áudio, Foto e PDF*', '📊 Relatório Avançados', '🔁 Agrupamento de Gastos Recorrentes', '🗂️ Categorias Ilimitadas']
}, {
  id: 'pro',
  name: 'PRO',
  icon: <Crown className="h-6 w-6 text-white" />,
  monthlyPrice: 29.90,
  yearlyPrice: 289.90,
  premium: true,
  features: ['Além do básico:', '🎯 Criação de Metas', '🔔 Alertas Personalizados', '📂 Exportação de Relatórios CSV e PDF', '🧠 Educação Financeira', '🎛️ Comando "Modo Economia"']
}];

export function PlansSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { data: subscription } = useSubscription();
  const createCheckout = useCreateCheckout();
  const customerPortal = useCustomerPortal();

  const getDiscountPercentage = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    return Math.round((monthly * 12 - yearly) / (monthly * 12) * 100);
  };

  const triggerConfetti = () => {
    const colors = ['#22c55e', '#16a34a', '#eab308', '#facc15'];
    
    const confettiSettings = {
      particleCount: 150,
      spread: 70,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
      gravity: 0.8,
      scalar: 1.2
    };

    // Disparo inicial no centro
    confetti(confettiSettings);
    
    // Disparos nas laterais
    setTimeout(() => {
      confetti({
        ...confettiSettings,
        origin: { x: 0.2, y: 0.6 },
        angle: 60
      });
    }, 100);

    setTimeout(() => {
      confetti({
        ...confettiSettings,
        origin: { x: 0.8, y: 0.6 },
        angle: 120
      });
    }, 200);

    // Disparos adicionais por 2 segundos
    const interval = setInterval(() => {
      confetti({
        ...confettiSettings,
        particleCount: 75,
        spread: 50
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
    }, 2000);
  };

  const handleBillingCycleChange = (checked: boolean) => {
    const newCycle = checked ? 'yearly' : 'monthly';
    setBillingCycle(newCycle);
    if (newCycle === 'yearly') {
      triggerConfetti();
    }
  };

  const handleSubscribe = (planId: string) => {
    if (planId === 'free') return;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    createCheckout.mutate({
      planType: planId,
      price: price * 100,
      billingCycle
    });
  };

  const handleManageSubscription = () => {
    customerPortal.mutate();
  };

  const isCurrentPlan = (planId: string) => {
    if (!subscription) return planId === 'free';
    return subscription.plan_type === planId;
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-6 px-4 sm:px-6">
        <div className="flex flex-col space-y-4">
          <div className="text-center sm:text-left">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Planos e Assinatura
            </CardTitle>
            <p className="text-gray-600 text-base sm:text-lg">
              Escolha o plano ideal para suas necessidades
            </p>
          </div>
          
          <div className="flex justify-center sm:justify-end">
            <BillingToggle 
              billingCycle={billingCycle}
              onBillingCycleChange={handleBillingCycleChange}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {plans.map(plan => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              billingCycle={billingCycle}
              onSubscribe={() => handleSubscribe(plan.id)} 
              onManage={handleManageSubscription} 
              isCurrentPlan={isCurrentPlan(plan.id)} 
              isLoading={createCheckout.isPending || customerPortal.isPending}
              discount={getDiscountPercentage(plan.monthlyPrice, plan.yearlyPrice)}
            />
          ))}
        </div>

        <SubscriptionStatus subscription={subscription} />
      </CardContent>
    </Card>
  );
}
