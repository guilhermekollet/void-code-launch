
import React from 'react';

interface SubscriptionData {
  status: string;
  plan_type: string;
}

interface SubscriptionStatusProps {
  subscription: SubscriptionData | null | undefined;
}

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  if (!subscription || subscription.status !== 'active') {
    return null;
  }

  return (
    <div className="mt-8 p-6 bg-green-50 rounded-2xl border border-green-200">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <p className="text-green-800 font-semibold">
          Sua assinatura está ativa
        </p>
      </div>
      <p className="text-green-700 text-sm mt-2 ml-6">
        Plano atual: {subscription.plan_type === 'basic' ? 'Básico' : 'PRO'}
      </p>
    </div>
  );
}
