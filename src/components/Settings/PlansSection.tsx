
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useCreateCheckout } from "@/hooks/useSubscriptionMutations";
import { useCustomerPortal } from "@/hooks/useSubscriptionMutations";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionStatus } from "./SubscriptionStatus";
import { PlanCard } from "./PlanCard";
import { BillingToggle } from "./BillingToggle";
import { useState } from "react";

const plans = [
  {
    id: "basic-monthly",
    name: "Básico Mensal",
    monthlyPrice: 19.90,
    yearlyPrice: 19.90,
    features: [
      "Controle básico de gastos",
      "Até 3 cartões de crédito",
      "Relatórios simples",
      "Suporte por email"
    ],
    icon: <Star className="h-5 w-5" />,
    planType: "basic" as const,
    billingCycle: "monthly" as const
  },
  {
    id: "basic-yearly",
    name: "Básico Anual",
    monthlyPrice: 16.66,
    yearlyPrice: 199.90,
    features: [
      "Controle básico de gastos",
      "Até 3 cartões de crédito",
      "Relatórios simples",
      "Suporte por email",
      "💰 Economia de 20%"
    ],
    icon: <Star className="h-5 w-5" />,
    planType: "basic" as const,
    billingCycle: "yearly" as const
  },
  {
    id: "premium-monthly",
    name: "Premium Mensal",
    monthlyPrice: 29.90,
    yearlyPrice: 29.90,
    features: [
      "Todos os recursos do Básico",
      "Cartões de crédito ilimitados",
      "Agente de IA personalizado",
      "Relatórios avançados",
      "Suporte prioritário"
    ],
    icon: <Crown className="h-5 w-5" />,
    planType: "premium" as const,
    billingCycle: "monthly" as const,
    popular: true
  },
  {
    id: "premium-yearly",
    name: "Premium Anual",
    monthlyPrice: 24.15,
    yearlyPrice: 289.90,
    features: [
      "Todos os recursos do Básico",
      "Cartões de crédito ilimitados",
      "Agente de IA personalizado",
      "Relatórios avançados",
      "Suporte prioritário",
      "💰 Economia de 20%"
    ],
    icon: <Crown className="h-5 w-5" />,
    planType: "premium" as const,
    billingCycle: "yearly" as const,
    popular: true
  }
];

export function PlansSection() {
  const { data: subscription } = useSubscription();
  const createCheckout = useCreateCheckout();
  const customerPortal = useCustomerPortal();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = async (planType: string, targetBillingCycle: 'monthly' | 'yearly') => {
    try {
      createCheckout.mutate({
        planType,
        billingCycle: targetBillingCycle
      });
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a assinatura. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      customerPortal.mutate();
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal de gerenciamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleBillingCycleChange = (checked: boolean) => {
    setBillingCycle(checked ? 'yearly' : 'monthly');
  };

  // CORRECTED: Verificar plan_type E billing_cycle para determinar plano atual
  const isCurrentPlan = (planType: string, planBillingCycle: 'monthly' | 'yearly') => {
    const hasSubscription = subscription && subscription.plan_type && subscription.billing_cycle;
    if (!hasSubscription) return false;
    
    const planMatch = subscription.plan_type === planType;
    const cycleMatch = subscription.billing_cycle === planBillingCycle;
    
    console.log('Checking isCurrentPlan:', {
      planType,
      planBillingCycle,
      subscriptionPlanType: subscription.plan_type,
      subscriptionBillingCycle: subscription.billing_cycle,
      planMatch,
      cycleMatch,
      result: planMatch && cycleMatch
    });
    
    return planMatch && cycleMatch;
  };

  const getFilteredPlans = () => {
    return plans.filter(plan => plan.billingCycle === billingCycle);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planos e Assinatura</CardTitle>
        <CardDescription>
          Gerencie sua assinatura e veja os planos disponíveis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SubscriptionStatus subscription={subscription} />
        
        <div className="mt-6">
          <BillingToggle 
            billingCycle={billingCycle} 
            onBillingCycleChange={handleBillingCycleChange}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {getFilteredPlans().map((plan) => {
            const isUserCurrentPlan = isCurrentPlan(plan.planType, plan.billingCycle);

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingCycle={plan.billingCycle}
                onSubscribe={() => handleSubscribe(plan.planType, plan.billingCycle)}
                onManage={handleManageSubscription}
                isCurrentPlan={isUserCurrentPlan}
                isLoading={createCheckout.isPending}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
