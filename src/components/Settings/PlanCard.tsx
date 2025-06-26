
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Star } from 'lucide-react';

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
    let baseClass = "relative p-8 rounded-3xl border-2 transition-all duration-300 bg-white";
    
    if (plan.premium) {
      return `${baseClass} border-amber-200 bg-gradient-to-br from-white to-amber-50 shadow-xl hover:shadow-2xl ${isCurrentPlan ? 'ring-4 ring-amber-300' : ''}`;
    }
    
    if (plan.popular) {
      return `${baseClass} border-blue-200 bg-gradient-to-br from-white to-blue-50 shadow-lg hover:shadow-xl ${isCurrentPlan ? 'ring-4 ring-blue-300' : ''}`;
    }
    
    return `${baseClass} border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg ${isCurrentPlan ? 'ring-4 ring-green-300 border-green-200' : ''}`;
  };

  return (
    <div className={getCardClassName()}>
      {plan.popular && !plan.premium && (
        <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 text-sm font-semibold shadow-lg">
          Mais Popular
        </Badge>
      )}
      
      {plan.premium && (
        <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 text-sm font-semibold shadow-lg">
          ⭐ Premium
        </Badge>
      )}
      
      {isCurrentPlan && (
        <Badge 
          variant="outline" 
          className="absolute -top-4 right-8 bg-green-500 text-white border-green-500 px-4 py-2 font-semibold shadow-md"
        >
          Plano Atual
        </Badge>
      )}

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`p-3 rounded-2xl ${
            plan.premium ? 'bg-amber-100' : plan.popular ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            {plan.icon}
          </div>
          <h3 className={`text-2xl font-bold ${
            plan.premium ? 'text-amber-700' : plan.popular ? 'text-blue-700' : 'text-gray-900'
          }`}>
            {plan.name}
          </h3>
        </div>
        
        <div className="mb-4">
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className={`text-5xl font-bold leading-none ${
              plan.premium 
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent' 
                : plan.popular 
                  ? 'text-blue-600' 
                  : 'text-gray-900'
            }`}>
              {formatPrice(displayPrice)}
            </span>
            {displayPrice > 0 && (
              <span className="text-gray-500 text-lg font-medium">
                /{billingCycle === 'monthly' ? 'mês' : 'ano'}
              </span>
            )}
          </div>
          
          {billingCycle === 'yearly' && yearlyPrice > 0 && (
            <p className="text-gray-500 text-sm">
              Cobrado anualmente por {formatPrice(yearlyPrice)}
            </p>
          )}
          
          {billingCycle === 'yearly' && discount && discount > 0 && (
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <span className="text-green-500">💰</span>
              Economize {discount}% no plano anual
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">{feature}</span>
          </div>
        ))}
      </div>

      <Button 
        onClick={isCurrentPlan ? onManage : onSubscribe} 
        disabled={isLoading || (plan.id === 'free' && !isCurrentPlan)} 
        className={`w-full py-4 text-lg font-semibold transition-all duration-300 ${
          plan.premium 
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1' 
            : plan.popular 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
              : 'bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg'
        }`} 
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
