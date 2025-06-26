import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription } from '@/hooks/useSubscription';
import { useCreateCheckout, useCustomerPortal } from '@/hooks/useSubscriptionMutations';
import { Check, Crown, Zap, Star } from 'lucide-react';
interface Plan {
  id: string;
  name: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  current?: boolean;
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
  icon: <Crown className="h-5 w-5" />,
  monthlyPrice: 29.90,
  yearlyPrice: 289.90,
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
  const handleSubscribe = (planId: string) => {
    if (planId === 'free') return;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    createCheckout.mutate({
      planType: planId,
      price: price * 100,
      // Convert to cents
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
  return <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Planos e Assinatura</CardTitle>
        <p className="text-gray-600">Escolha o plano ideal para suas necessidades</p>
      </CardHeader>
      <CardContent>
        <Tabs value={billingCycle} onValueChange={value => setBillingCycle(value as 'monthly' | 'yearly')} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="yearly" className="relative">
              Anual
              <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                20% OFF
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => <PlanCard key={plan.id} plan={plan} price={plan.monthlyPrice} period="mês" billingCycle="monthly" onSubscribe={() => handleSubscribe(plan.id)} onManage={handleManageSubscription} isCurrentPlan={isCurrentPlan(plan.id)} isLoading={createCheckout.isPending || customerPortal.isPending} />)}
            </div>
          </TabsContent>

          <TabsContent value="yearly" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => <PlanCard key={plan.id} plan={plan} price={plan.yearlyPrice} period="ano" billingCycle="yearly" onSubscribe={() => handleSubscribe(plan.id)} onManage={handleManageSubscription} isCurrentPlan={isCurrentPlan(plan.id)} isLoading={createCheckout.isPending || customerPortal.isPending} discount={getDiscountPercentage(plan.monthlyPrice, plan.yearlyPrice)} />)}
            </div>
          </TabsContent>
        </Tabs>

        {subscription && subscription.status === 'active' && <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 font-medium">
              ✅ Sua assinatura está ativa
            </p>
            <p className="text-green-700 text-sm mt-1">
              Plano atual: {subscription.plan_type === 'basic' ? 'Básico' : 'PRO'}
            </p>
          </div>}
      </CardContent>
    </Card>;
}
interface PlanCardProps {
  plan: Plan;
  price: number;
  period: string;
  billingCycle: 'monthly' | 'yearly';
  onSubscribe: () => void;
  onManage: () => void;
  isCurrentPlan: boolean;
  isLoading: boolean;
  discount?: number;
}
function PlanCard({
  plan,
  price,
  period,
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
  return <div className={`relative p-6 rounded-lg border-2 ${plan.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
      {plan.popular && <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
          Mais Popular
        </Badge>}
      {isCurrentPlan && <Badge variant="outline" className="absolute -top-3 right-4 bg-green-500 text-white border-green-500">
          Plano Atual
        </Badge>}

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          {plan.icon}
          <h3 className="text-xl font-bold">{plan.name}</h3>
        </div>
        
        <div className="mb-2">
          <span className="text-3xl font-bold">{formatPrice(price)}</span>
          {price > 0 && <span className="text-gray-600">/{period}</span>}
        </div>
        
        {discount && discount > 0 && <p className="text-green-600 text-sm font-medium">
            Economize {discount}% no plano anual
          </p>}
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => <li key={index} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>)}
      </ul>

      <Button onClick={isCurrentPlan ? onManage : onSubscribe} disabled={isLoading || plan.id === 'free' && !isCurrentPlan} className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`} variant={isCurrentPlan ? 'outline' : 'default'}>
        {isCurrentPlan ? 'Gerenciar Assinatura' : plan.id === 'free' ? 'Plano Gratuito' : 'Assinar Agora'}
      </Button>
    </div>;
}