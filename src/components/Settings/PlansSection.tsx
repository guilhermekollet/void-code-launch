
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star } from "lucide-react";
import { useState } from "react";
import { BillingToggle } from "./BillingToggle";
import { SubscriptionStatus } from "./SubscriptionStatus";
import { useCreateCheckout, useCustomerPortal } from "@/hooks/useSubscriptionMutations";
import { useSubscription } from "@/hooks/useSubscription";

const plans = [
  {
    id: 'basic',
    name: 'Básico',
    description: 'Ideal para uso pessoal',
    monthlyPrice: 19.90,
    yearlyPrice: 199.90,
    icon: Star,
    features: [
      'Controle de gastos pessoais',
      'Categorização automática',
      'Relatórios básicos',
      'Suporte por email'
    ],
    hierarchy: 1
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Para quem quer controle total',
    monthlyPrice: 29.90,
    yearlyPrice: 289.90,
    icon: Crown,
    features: [
      'Todos os recursos do Básico',
      'Relatórios avançados',
      'Integração com bancos',
      'Análise preditiva',
      'Suporte prioritário',
      'Exportação de dados'
    ],
    popular: true,
    hierarchy: 2
  }
];

export function PlansSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const createCheckout = useCreateCheckout();
  const customerPortal = useCustomerPortal();
  const { data: subscription } = useSubscription();

  const handleBillingCycleChange = (checked: boolean) => {
    setBillingCycle(checked ? 'yearly' : 'monthly');
  };

  const handleSubscribe = (planId: string) => {
    createCheckout.mutate({
      planType: planId,
      billingCycle: billingCycle
    });
  };

  const handleManageSubscription = () => {
    customerPortal.mutate();
  };

  const isActivePlan = (planId: string) => {
    return subscription?.status === 'active' && subscription?.plan_type === planId;
  };

  const getCurrentPlanHierarchy = () => {
    const currentPlan = plans.find(p => p.id === subscription?.plan_type);
    return currentPlan?.hierarchy || 0;
  };

  const getButtonText = (plan: any) => {
    if (isActivePlan(plan.id)) return 'Gerenciar Assinatura';
    
    const currentHierarchy = getCurrentPlanHierarchy();
    if (plan.hierarchy < currentHierarchy) return 'Downgrade';
    
    return 'Assinar Agora';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Planos e Assinatura</h2>
        <p className="text-gray-600 mt-2">Escolha o plano ideal para suas necessidades</p>
      </div>

      <SubscriptionStatus subscription={subscription} />

      <div className="space-y-4">
        <div className="flex justify-center">
          <BillingToggle 
            billingCycle={billingCycle} 
            onBillingCycleChange={handleBillingCycleChange} 
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const savings = billingCycle === 'yearly' ? Math.round(((plan.monthlyPrice * 12) - plan.yearlyPrice) / (plan.monthlyPrice * 12) * 100) : 0;
            const isPlanActive = isActivePlan(plan.id);
            const isPremium = plan.id === 'premium';

            return (
              <Card 
                key={plan.id} 
                className={`relative ${
                  plan.popular ? 'border-2 border-gray-300' : 'border-gray-200'
                } ${
                  isPlanActive ? 'ring-2 ring-green-500 ring-opacity-50' : ''
                } ${
                  isPremium ? 'bg-[#61710C] text-white' : 'bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Mais Popular
                  </div>
                )}

                {isPlanActive && (
                  <div className="absolute -top-3 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Plano Atual
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">
                    <div className={`p-3 rounded-full ${
                      isPremium ? 'bg-white text-[#61710C]' : 'bg-[#CFF500] text-black'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className={`text-xl ${isPremium ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </CardTitle>
                  <CardDescription className={isPremium ? 'text-gray-200' : 'text-gray-600'}>
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className={`text-3xl font-bold ${isPremium ? 'text-white' : 'text-gray-900'}`}>
                        R$ {price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className={`ml-1 ${isPremium ? 'text-gray-200' : 'text-gray-500'}`}>
                        /{billingCycle === 'yearly' ? 'ano' : 'mês'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && savings > 0 && (
                      <div className={`text-sm font-medium mt-1 ${
                        isPremium ? 'text-green-200' : 'text-green-600'
                      }`}>
                        Economize {savings}%
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className={`h-4 w-4 mr-2 flex-shrink-0 ${
                          isPremium ? 'text-green-200' : 'text-green-500'
                        }`} />
                        <span className={isPremium ? 'text-white' : 'text-gray-700'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${
                      isPlanActive 
                        ? 'bg-white text-black border border-black hover:bg-gray-50' 
                        : isPremium 
                          ? 'bg-white text-[#61710C] hover:bg-gray-50' 
                          : 'bg-[#CFF500] text-black hover:bg-[#CFF500]/90'
                    }`}
                    variant={isPlanActive ? 'outline' : 'default'}
                    onClick={isPlanActive ? handleManageSubscription : () => handleSubscribe(plan.id)}
                    disabled={createCheckout.isPending || customerPortal.isPending}
                  >
                    {createCheckout.isPending || customerPortal.isPending 
                      ? 'Processando...' 
                      : getButtonText(plan)
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
