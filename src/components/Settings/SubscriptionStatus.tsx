
import React from 'react';

interface SubscriptionData {
  status: string;
  plan_type: string;
  billing_cycle?: string;
}

interface SubscriptionStatusProps {
  subscription: SubscriptionData | null | undefined;
}

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  if (!subscription || subscription.status !== 'active') {
    return null;
  }

  const getPlanDisplayName = (planType: string, billingCycle?: string) => {
    let planName = '';
    
    switch (planType) {
      case 'basic':
        planName = 'Básico';
        break;
      case 'premium':
        planName = 'Premium';
        break;
      case 'free':
      default:
        planName = 'Gratuito';
        break;
    }

    // Adicionar período de faturamento se não for plano gratuito
    if (planType !== 'free' && billingCycle) {
      const cycleText = billingCycle === 'yearly' ? 'Anual' : 'Mensal';
      return `${planName} ${cycleText}`;
    }

    return planName;
  };

  const isFreePlan = subscription.plan_type === 'free';

  return (
    <div className={`mt-8 p-6 rounded-2xl border ${
      isFreePlan 
        ? 'bg-gray-50 border-gray-200' 
        : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${
          isFreePlan 
            ? 'bg-gray-500' 
            : 'bg-green-500 animate-pulse'
        }`}></div>
        <p className={`font-semibold ${
          isFreePlan 
            ? 'text-gray-800' 
            : 'text-green-800'
        }`}>
          {isFreePlan 
            ? 'Você está usando o plano gratuito' 
            : 'Sua assinatura está ativa'
          }
        </p>
      </div>
      <p className={`text-sm mt-2 ml-6 ${
        isFreePlan 
          ? 'text-gray-700' 
          : 'text-green-700'
      }`}>
        Plano atual: {getPlanDisplayName(subscription.plan_type, subscription.billing_cycle)}
      </p>
    </div>
  );
}
