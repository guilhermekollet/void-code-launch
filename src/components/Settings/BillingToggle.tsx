
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { IOSSwitch } from "@/components/ui/ios-switch";

interface BillingToggleProps {
  billingCycle: 'monthly' | 'yearly';
  onBillingCycleChange: (checked: boolean) => void;
}

export function BillingToggle({ billingCycle, onBillingCycleChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 bg-gray-50 rounded-2xl p-2 relative max-w-sm mx-auto">
      <span className={`text-sm font-medium px-3 sm:px-4 py-2 rounded-xl transition-colors ${
        billingCycle === 'monthly' 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-500'
      }`}>
        Mensal
      </span>
      
      <div className="relative flex items-center">
        <IOSSwitch
          checked={billingCycle === 'yearly'}
          onCheckedChange={onBillingCycleChange}
        />
        <Badge 
          variant="secondary" 
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs bg-green-100 text-green-700 border-green-200 whitespace-nowrap px-2 py-1 font-medium"
        >
          Economize 20%
        </Badge>
      </div>
      
      <span className={`text-sm font-medium px-3 sm:px-4 py-2 rounded-xl transition-colors ${
        billingCycle === 'yearly' 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-500'
      }`}>
        Anual
      </span>
    </div>
  );
}
