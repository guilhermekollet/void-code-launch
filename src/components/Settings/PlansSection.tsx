
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
    id: "basic",
    name: "Básico",
    monthlyPrice: 19.90,
    yearlyPrice: 199.90,
    features: [
      "Controle básico de gastos",
      "Até 3 cartões de crédito",
      "Relatórios simples",
      "Suporte por email"
    ],
    icon: <Star className="h-5 w-5" />,
    planType: "basic" as const
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 29.90,
    yearlyPrice: 289.90,
    features: [
      "Todos os recursos do Básico",
      "Cartões de crédito ilimitados",
      "Agente de IA personalizado",
      "Relatórios avançados",
      "Suporte prioritário"
    ],
    icon: <Crown className="h-5 w-5" />,
    planType: "premium" as const,
    popular: true
  }
];

export function PlansSection() {
  const { data: subscription } = useSubscription();
  const createCheckout = useCreateCheckout();
  const customerPortal = useCustomerPortal();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = async (planType: string) => {
    try {
      createCheckout.mutate({
        planType,
        billingCycle
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
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan_type === plan.planType;
            const isDowngrade = subscription?.plan_type === 'premium' && plan.planType === 'basic';

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingCycle={billingCycle}
                onSubscribe={() => handleSubscribe(plan.planType)}
                onManage={handleManageSubscription}
                isCurrentPlan={isCurrentPlan}
                isLoading={createCheckout.isPending}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
