
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
      default:
        planName = 'Básico';
        break;
    }

    // Adicionar período de faturamento se disponível
    if (billingCycle) {
      const cycleText = billingCycle === 'yearly' ? 'Anual' : 'Mensal';
      return `${planName} ${cycleText}`;
    }

    return planName;
  };

  const isPremium = subscription.plan_type === 'premium';

  return (
    <div className={`mt-8 p-6 rounded-2xl border ${
      isPremium 
        ? 'bg-green-50 border-green-200' 
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${
          isPremium 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-blue-500 animate-pulse'
        }`}></div>
        <p className={`font-semibold ${
          isPremium 
            ? 'text-green-800' 
            : 'text-blue-800'
        }`}>
          Sua assinatura está ativa
        </p>
      </div>
      <p className={`text-sm mt-2 ml-6 ${
        isPremium 
          ? 'text-green-700' 
          : 'text-blue-700'
      }`}>
        Plano atual: {getPlanDisplayName(subscription.plan_type, subscription.billing_cycle)}
      </p>
    </div>
  );
}
