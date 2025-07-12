
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from 'canvas-confetti';

const plans = [
  {
    id: 'basic',
    name: 'Básico',
    price: 'R$ 19,90',
    period: '/mês',
    icon: Star,
    features: [
      'Controle de gastos básico',
      'Relatórios mensais',
      'Até 3 cartões de crédito',
      'Suporte por email'
    ],
    color: 'border-blue-200 bg-blue-50'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 29,90',
    period: '/mês',
    icon: Crown,
    features: [
      'Controle completo de gastos',
      'Relatórios detalhados',
      'Cartões ilimitados',
      'Suporte prioritário',
      'Análises avançadas',
      'Integração com bancos'
    ],
    color: 'border-green-200 bg-green-50',
    popular: true
  }
];

export function PlansSection() {
  const { data: subscription, refetch } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    try {
      setLoading(planId);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType: planId }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Trigger celebration confetti
        const colors = ['#61710C', '#92CB0B', '#CFF500', '#FFEB3B'];
        const duration = 1200; // 1.2 seconds
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };

        frame();

        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading('manage');
      
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir portal do cliente. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const refreshSubscription = async () => {
    try {
      await refetch();
      toast({
        title: "Status atualizado",
        description: "Status da assinatura atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da assinatura.",
        variant: "destructive"
      });
    }
  };

  const isCurrentPlan = (planId: string) => {
    return subscription?.plan_type === planId && subscription?.status === 'active';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#121212]">Planos e Assinatura</h3>
          <p className="text-sm text-[#64748B]">Gerencie sua assinatura e recursos</p>
        </div>
        <Button
          variant="outline"
          onClick={refreshSubscription}
          size="sm"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Atualizar Status
        </Button>
      </div>

      {subscription && (
        <Card className="border-[#DEDEDE]">
          <CardHeader>
            <CardTitle className="text-[#121212]">Status Atual</CardTitle>
            <CardDescription>
              Plano: <span className="font-medium capitalize">{subscription.plan_type}</span>
              {subscription.current_period_end && (
                <span className="block text-sm text-[#64748B] mt-1">
                  Válido até: {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleManageSubscription}
              disabled={loading === 'manage'}
              variant="outline"
            >
              {loading === 'manage' ? 'Carregando...' : 'Gerenciar Assinatura'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = isCurrentPlan(plan.id);
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.color} ${isCurrent ? 'ring-2 ring-[#61710C]' : 'border-[#DEDEDE]'}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-[#61710C] hover:bg-[#4a5709]">
                  Mais Popular
                </Badge>
              )}
              {isCurrent && (
                <Badge className="absolute -top-2 right-4 bg-green-600 hover:bg-green-700">
                  Seu Plano
                </Badge>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="w-6 h-6 text-[#61710C]" />
                  <CardTitle className="text-[#121212]">{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#121212]">{plan.price}</span>
                  <span className="text-[#64748B]">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-[#64748B]">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading === plan.id || isCurrent}
                  className={`w-full ${isCurrent ? 'bg-green-600 hover:bg-green-700' : 'bg-[#61710C] hover:bg-[#4a5709]'}`}
                >
                  {loading === plan.id ? 'Processando...' : isCurrent ? 'Plano Atual' : 'Assinar'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
