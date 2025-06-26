
import React from 'react';
import { UserProfileSection } from '@/components/Settings/UserProfileSection';
import { AIAgentSection } from '@/components/Settings/AIAgentSection';
import { PlansSection } from '@/components/Settings/PlansSection';

export default function Configuracoes() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
        <p className="text-gray-600">Gerencie suas preferências e configurações da conta</p>
      </div>

      <div className="space-y-8">
        <UserProfileSection />
        <AIAgentSection />
        <PlansSection />
      </div>
    </div>
  );
}
