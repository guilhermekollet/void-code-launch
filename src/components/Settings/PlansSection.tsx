
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
    name: "Básico",
    price: "R$ 5,00",
    description: "Ideal para quem está começando",
    features: [
      "Controle básico de gastos",
      "Até 3 cartões de crédito",
      "Relatórios simples",
      "Suporte por email"
    ],
    icon: Star,
    planType: "basic" as const,
    priceId: "price_1QxXpXD9OWTJbzJYrIiNnkwF"
  },
  {
    name: "Premium",
    price: "R$ 15,00",
    description: "Controle total das suas finanças",
    features: [
      "Todos os recursos do Básico",
      "Cartões de crédito ilimitados",
      "Agente de IA personalizado",
      "Relatórios avançados",
      "Suporte prioritário"
    ],
    icon: Crown,
    planType: "premium" as const,
    priceId: "price_1QxXpXD9OWTJbzJYrIiNnkwF",
    popular: true
  }
];

export function PlansSection() {
  const { data: subscription } = useSubscription();
  const createCheckout = useCreateCheckout();
  const { toast } = useToast();

  const handleSubscribe = async (priceId: string, planType: string) => {
    try {
      createCheckout.mutate({
        priceId,
        planType,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/configuracoes`
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
          <SubscriptionStatus />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {plans.map((plan) => {
              const planTier = getPlanTier(plan.planType);
              const isCurrentPlan = subscription?.plan_type === plan.planType;
              const isDowngrade = currentTier > planTier;
              const isUpgrade = currentTier < planTier;

              return (
                <PlanCard
                  key={plan.planType}
                  name={plan.name}
                  price={plan.price}
                  description={plan.description}
                  features={plan.features}
                  icon={plan.icon}
                  planType={plan.planType}
                  popular={plan.popular}
                  action={
                    isCurrentPlan ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Plano Atual
                        </div>
                        <Button
                          onClick={handleManageSubscription}
                          variant="outline"
                          size="sm"
                          className="w-full bg-white hover:bg-gray-50 text-black border border-black"
                        >
                          Gerenciar Assinatura
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleSubscribe(plan.priceId, plan.planType)}
                        disabled={createCheckout.isPending}
                        className="w-full bg-[#61710C] hover:bg-[#4a5a0a] text-white"
                      >
                        {createCheckout.isPending ? 'Processando...' : 
                         isDowngrade ? 'Downgrade' : 'Assinar Agora'}
                      </Button>
                    )
                  }
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
