
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
}

export function PlanCard({
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
    let baseClass = "relative p-4 sm:p-6 lg:p-8 rounded-3xl border-2 transition-all duration-300 h-full flex flex-col";
    
    if (plan.premium) {
      return `${baseClass} bg-black text-white border-black shadow-lg hover:shadow-xl ${isCurrentPlan ? 'ring-4 ring-black/20' : ''}`;
    }
    
    if (plan.popular) {
      return `${baseClass} bg-[#61710C] text-white border-[#61710C] shadow-lg hover:shadow-xl ${isCurrentPlan ? 'ring-4 ring-[#61710C]/20' : ''}`;
    }
    
    return `${baseClass} bg-white border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg ${isCurrentPlan ? 'ring-4 ring-green-300 border-green-200' : ''}`;
  };

  const getIconBgClass = () => {
    if (plan.premium) return 'bg-white text-black';
    if (plan.popular) return 'bg-white text-[#61710C]';
    return 'bg-gray-100';
  };

  const getButtonClass = () => {
    if (plan.premium) {
      return 'bg-white hover:bg-gray-100 text-black shadow-lg hover:shadow-xl';
    }
    if (plan.popular) {
      return 'bg-white hover:bg-gray-100 text-[#61710C] shadow-lg hover:shadow-xl';
    }
    return 'bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg';
  };

  return (
    <div className={getCardClassName()}>
      {plan.popular && !plan.premium && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white text-[#61710C] hover:bg-white px-4 py-1 text-sm font-semibold shadow-lg border-0">
          Mais Popular
        </Badge>
      )}
      
      {plan.premium && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white text-black hover:bg-white px-4 py-1 text-sm font-semibold shadow-lg border-0">
          ⭐ Premium
        </Badge>
      )}
      
      {/* Badge de economia sempre visível quando anual */}
      {billingCycle === 'yearly' && discount && discount > 0 && yearlyPrice > 0 && (
        <Badge className="absolute -top-3 right-4 bg-green-500 hover:bg-green-500 text-white px-3 py-1 text-xs font-medium shadow-md border-0">
          Economize {discount}%
        </Badge>
      )}
      
      {isCurrentPlan && (
        <Badge 
          variant="outline" 
          className="absolute -top-3 right-4 bg-green-500 text-white border-green-500 px-3 py-1 font-semibold shadow-md"
          style={{ right: billingCycle === 'yearly' && discount && discount > 0 && yearlyPrice > 0 ? '140px' : '16px' }}
        >
          Plano Atual
        </Badge>
      )}

      <div className="text-center mb-6 flex-shrink-0">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`p-3 rounded-2xl ${getIconBgClass()}`}>
            {plan.icon}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">
            {plan.name}
          </h3>
        </div>
        
        {displayPrice > 0 && (
          <div className="mb-4">
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-none">
                {formatPrice(displayPrice)}
              </span>
              <span className={`text-base sm:text-lg font-medium ${plan.premium || plan.popular ? 'text-white/80' : 'text-gray-500'}`}>
                /{billingCycle === 'monthly' ? 'mês' : 'ano'}
              </span>
            </div>
            
            {billingCycle === 'yearly' && yearlyPrice > 0 && (
              <p className={`text-sm ${plan.premium || plan.popular ? 'text-white/70' : 'text-gray-500'}`}>
                Cobrado anualmente por {formatPrice(yearlyPrice)}
              </p>
            )}
          </div>
        )}
        
        {displayPrice === 0 && (
          <div className="mb-4">
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-none">
                Gratuito
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6 flex-grow">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2 text-sm sm:text-base">
            <span className="leading-tight">{feature}</span>
          </div>
        ))}
      </div>

      <Button 
        onClick={isCurrentPlan ? onManage : onSubscribe} 
        disabled={isLoading || (plan.id === 'free' && !isCurrentPlan)} 
        className={`w-full py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 ${getButtonClass()}`}
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
