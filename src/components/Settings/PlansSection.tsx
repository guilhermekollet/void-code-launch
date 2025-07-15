
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanCard } from "./PlanCard";
import { Crown, Star, CheckCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useCreateCheckout } from "@/hooks/useSubscriptionMutations";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { SubscriptionStatus } from "./SubscriptionStatus";

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
  const { toast } = useToast();

  const handleSubscribe = async (planType: string) => {
    try {
      createCheckout.mutate({
        planType,
        billingCycle: 'monthly'
      });
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleManageSubscription = () => {
    window.open('https://billing.stripe.com/p/login/test_28o8yEavvbnG4XCcMM', '_blank');
  };

  const getCurrentPlanTier = () => {
    if (!subscription || subscription.plan_type === 'free') return 0;
    if (subscription.plan_type === 'basic') return 1;
    if (subscription.plan_type === 'premium') return 2;
    return 0;
  };

  const getPlanTier = (planType: string) => {
    if (planType === 'basic') return 1;
    if (planType === 'premium') return 2;
    return 0;
  };

  const currentTier = getCurrentPlanTier();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#61710C]" />
            <CardTitle>Planos e Assinaturas</CardTitle>
          </div>
          <CardDescription>
            Escolha o plano ideal para suas necessidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionStatus subscription={subscription} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {plans.map((plan) => {
              const planTier = getPlanTier(plan.planType);
              const isCurrentPlan = subscription?.plan_type === plan.planType;
              const isDowngrade = currentTier > planTier;
              const isUpgrade = currentTier < planTier;

              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle="monthly"
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
    </div>
  );
}
