
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star } from "lucide-react";
import { useState } from "react";
import { BillingToggle } from "./BillingToggle";
import { SubscriptionStatus } from "./SubscriptionStatus";
import { UserDataModal } from "../UserDataModal";
import { useCreateCheckout, useCustomerPortal } from "@/hooks/useSubscriptionMutations";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    color: 'bg-[#CFF500] text-black',
    borderColor: 'border-[#CFF500]'
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
    color: 'bg-[#61710C] text-white',
    borderColor: 'border-[#61710C]',
    popular: true
  }
];

export function PlansSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showUserDataModal, setShowUserDataModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ planId: string; billingCycle: 'monthly' | 'yearly' } | null>(null);
  
  const { user } = useAuth();
  const createCheckout = useCreateCheckout();
  const customerPortal = useCustomerPortal();
  const { data: subscription } = useSubscription();

  // Get user profile data to check if we have all required info
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('name, email, phone_number')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user,
  });

  const handleBillingCycleChange = (checked: boolean) => {
    setBillingCycle(checked ? 'yearly' : 'monthly');
  };

  const handleSubscribe = (planId: string) => {
    // Check if user has all required data
    if (!userProfile || !userProfile.name || !userProfile.email || !userProfile.phone_number) {
      // Show modal to collect missing data
      setSelectedPlan({ planId, billingCycle });
      setShowUserDataModal(true);
    } else {
      // User has all data, proceed with checkout
      createCheckout.mutate({
        planType: planId,
        billingCycle: billingCycle
      });
    }
  };

  const handleUserDataSubmit = (userData: { name: string; email: string; phone: string }) => {
    setShowUserDataModal(false);
    
    if (selectedPlan) {
      createCheckout.mutate({
        planType: selectedPlan.planId,
        billingCycle: selectedPlan.billingCycle
      });
    }
  };

  const handleManageSubscription = () => {
    customerPortal.mutate();
  };

  const isActivePlan = (planId: string) => {
    return subscription?.status === 'active' && subscription?.plan_type === planId;
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

            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? `${plan.borderColor} border-2` : 'border-gray-200'} ${isPlanActive ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}
              >
                {plan.popular && (
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${plan.color} px-3 py-1 rounded-full text-xs font-medium`}>
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
                    <div className={`p-3 rounded-full ${plan.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold text-gray-900">
                        R$ {price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-gray-500 ml-1">
                        /{billingCycle === 'yearly' ? 'ano' : 'mês'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && savings > 0 && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Economize {savings}%
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${isPlanActive ? 'bg-gray-600 hover:bg-gray-700' : plan.color + ' hover:opacity-90'}`}
                    onClick={isPlanActive ? handleManageSubscription : () => handleSubscribe(plan.id)}
                    disabled={createCheckout.isPending || customerPortal.isPending}
                  >
                    {createCheckout.isPending || customerPortal.isPending 
                      ? 'Processando...' 
                      : isPlanActive 
                        ? 'Gerenciar Assinatura' 
                        : 'Assinar Agora'
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedPlan && (
        <UserDataModal
          isOpen={showUserDataModal}
          onClose={() => setShowUserDataModal(false)}
          onSubmit={handleUserDataSubmit}
          planType={selectedPlan.planId}
          billingCycle={selectedPlan.billingCycle}
        />
      )}
    </div>
  );
}
