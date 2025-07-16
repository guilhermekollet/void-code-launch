
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface PlanCardProps {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  onSubscribe: () => void;
  onManage: () => void;
  isCurrentPlan: boolean;
  isLoading: boolean;
  discount?: number;
  buttonText?: string;
}

export function PlanCard({
  plan,
  billingCycle,
  onSubscribe,
  onManage,
  isCurrentPlan,
  isLoading,
  discount,
  buttonText
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

  // Remove "Free" from plan name if it's the free plan
  const displayName = plan.id === 'free' ? 'Gratuito' : plan.name;

  const getButtonAction = () => {
    if (isCurrentPlan) {
      return onManage;
    }
    return onSubscribe;
  };

  const getButtonText = () => {
    if (buttonText) {
      return buttonText;
    }
    
    if (isCurrentPlan) {
      return 'Gerenciar Assinatura';
    }
    
    if (plan.id === 'free') {
      return 'Plano Gratuito';
    }
    
    return 'Assinar Agora';
  };

  const shouldDisableButton = () => {
    if (isLoading) return true;
    if (plan.id === 'free' && !isCurrentPlan) return true;
    return false;
  };

  return (
    <div className="relative p-6 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white hover:bg-gray-900 px-4 py-1 text-sm font-medium shadow-sm border-0">
          Mais Popular
        </Badge>
      )}
      
      {isCurrentPlan && (
        <Badge variant="outline" className="absolute -top-3 right-4 bg-green-500 text-white border-green-500 px-3 py-1 font-medium shadow-sm">
          Plano Atual
        </Badge>
      )}

      <div className="text-center mb-6 flex-shrink-0">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {displayName}
        </h3>
        
        {displayPrice > 0 ? (
          <div className="mb-4">
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-2xl font-bold text-gray-900 leading-none">
                {formatPrice(displayPrice)}
              </span>
              <span className="text-base font-medium text-gray-500">
                /{billingCycle === 'monthly' ? 'mês' : 'ano'}
              </span>
            </div>
            
            {billingCycle === 'yearly' && yearlyPrice > 0 && (
              <p className="text-sm text-gray-500">
                Cobrado anualmente por {formatPrice(yearlyPrice)}
              </p>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-baseline justify-center gap-1 mb-2">
              {/* Espaço vazio para planos gratuitos */}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-8 flex-grow">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="leading-tight">{feature}</span>
          </div>
        ))}
      </div>

      <Button 
        onClick={getButtonAction()}
        disabled={shouldDisableButton()}
        className="w-full py-3 text-base font-medium" 
        variant={isCurrentPlan ? 'outline' : 'default'}
      >
        {getButtonText()}
      </Button>
    </div>
  );
}
