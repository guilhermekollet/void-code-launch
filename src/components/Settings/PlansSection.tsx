
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IOSSwitch } from "@/components/ui/ios-switch";
import { useSubscription } from '@/hooks/useSubscription';
import { useCreateCheckout, useCustomerPortal } from '@/hooks/useSubscriptionMutations';
import { Crown, Zap, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

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
  icon: <Star className="h-5 w-5" />,
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: ['🤖 Agente de IA Financeiro limitado', '📝 Até 50 lançamentos via Texto', '📊 Relatório Básicos', '🗂️ Até 3 Categorias', '💻 Dashboard Profissional']
}, {
  id: 'basic',
  name: 'Básico',
  icon: <Zap className="h-5 w-5" />,
  monthlyPrice: 19.90,
  yearlyPrice: 199.90,
  popular: true,
  features: ['🤖 Agente de IA Financeiro', '📝 Lançamentos Ilimitado via Texto, Áudio, Foto e PDF*', '📊 Relatório Avançados', '🔁 Agrupamento de Gastos Recorrentes', '🗂️ Categorias Ilimitadas']
}, {
  id: 'pro',
  name: 'PRO',
  icon: <Crown className="h-5 w-5 text-amber-600" />,
  monthlyPrice: 29.90,
  yearlyPrice: 289.90,
  premium: true,
  features: ['Além do básico:', '🎯 Criação de Metas', '🔔 Alertas Personalizados', '📂 Exportação de Relatórios CSV e PDF', '🧠 Educação Financeira', '🎛️ Comando "Modo Economia"']
}];

export function PlansSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const {
    data: subscription
  } = useSubscription();
  const createCheckout = useCreateCheckout();
  const customerPortal = useCustomerPortal();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getDiscountPercentage = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    return Math.round((monthly * 12 - yearly) / (monthly * 12) * 100);
  };

  const triggerConfetti = () => {
    const colors = ['#22c55e', '#16a34a', '#eab308', '#facc15'];
    
    const confettiSettings = {
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors
    };

    confetti(confettiSettings);
    
    const interval = setInterval(() => {
      confetti({
        ...confettiSettings,
        particleCount: 50,
        spread: 60
      });
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
    }, 3500);
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
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Planos e Assinatura</CardTitle>
            <p className="text-gray-600 mt-1">Escolha o plano ideal para suas necessidades</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Mensal
            </span>
            <div className="relative">
              <IOSSwitch
                checked={billingCycle === 'yearly'}
                onCheckedChange={handleBillingCycleChange}
              />
              {billingCycle === 'yearly' && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-8 -right-2 text-xs bg-green-100 text-green-700 border-green-200"
                >
                  Economize 20%
                </Badge>
              )}
            </div>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Anual
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

        {subscription && subscription.status === 'active' && (
          <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-800 font-medium">
                Sua assinatura está ativa
              </p>
            </div>
            <p className="text-green-700 text-sm mt-1 ml-4">
              Plano atual: {subscription.plan_type === 'basic' ? 'Básico' : 'PRO'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PlanCardProps {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  onSubscribe: () => void;
  onManage: () => void;
  isCurrentPlan: boolean;
  isLoading: boolean;
  discount?: number;
}

function PlanCard({
  plan,
  billingCycle,
  onSubscribe,
  onManage,
  isCurrentPlan,
  isLoading,
  discount
}: PlanCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const monthlyPrice = plan.monthlyPrice;
  const yearlyPrice = plan.yearlyPrice;
  const displayPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;

  const getCardClassName = () => {
    let baseClass = "relative p-8 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg bg-white";
    
    if (plan.premium) {
      return `${baseClass} border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg hover:shadow-xl ${isCurrentPlan ? 'ring-2 ring-amber-400' : ''}`;
    }
    
    if (plan.popular) {
      return `${baseClass} border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md hover:shadow-lg ${isCurrentPlan ? 'ring-2 ring-blue-400' : ''}`;
    }
    
    return `${baseClass} border-gray-200 hover:border-gray-300 ${isCurrentPlan ? 'ring-2 ring-green-400 border-green-200' : ''}`;
  };

  return (
    <div className={getCardClassName()}>
      {plan.popular && !plan.premium && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1">
          Mais Popular
        </Badge>
      )}
      
      {plan.premium && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 shadow-lg">
          ⭐ Premium
        </Badge>
      )}
      
      {isCurrentPlan && (
        <Badge 
          variant="outline" 
          className="absolute -top-3 right-6 bg-green-500 text-white border-green-500 px-3 py-1"
        >
          Plano Atual
        </Badge>
      )}

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          {plan.icon}
          <h3 className={`text-2xl font-bold ${plan.premium ? 'text-amber-700' : plan.popular ? 'text-blue-700' : 'text-gray-900'}`}>
            {plan.name}
          </h3>
        </div>
        
        <div className="mb-3">
          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-4xl font-bold ${plan.premium ? 'bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent' : 'text-gray-900'}`}>
              {formatPrice(displayPrice)}
            </span>
            {displayPrice > 0 && (
              <span className="text-gray-600 text-lg">
                /{billingCycle === 'monthly' ? 'mês' : 'ano'}
              </span>
            )}
          </div>
          
          {billingCycle === 'yearly' && yearlyPrice > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Cobrado anualmente por {formatPrice(yearlyPrice)}
            </p>
          )}
          
          {billingCycle === 'yearly' && discount && discount > 0 && (
            <p className="text-green-600 text-sm font-medium mt-2">
              Economize {discount}% no plano anual
            </p>
          )}
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
            <span className="text-base leading-none mt-0.5">{feature}</span>
          </li>
        ))}
      </ul>

      <Button 
        onClick={isCurrentPlan ? onManage : onSubscribe} 
        disabled={isLoading || (plan.id === 'free' && !isCurrentPlan)} 
        className={`w-full py-3 font-semibold transition-all duration-200 ${
          plan.premium 
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
            : plan.popular 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
              : 'bg-gray-900 hover:bg-gray-800 text-white'
        }`} 
        variant={isCurrentPlan ? 'outline' : 'default'}
      >
        {isCurrentPlan 
          ? 'Gerenciar Assinatura' 
          : plan.id === 'free' 
            ? 'Plano Gratuito' 
            : 'Assinar Agora'
        }
      </Button>
    </div>
  );
}
