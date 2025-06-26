import React from 'react';
import { UserProfileSection } from '@/components/Settings/UserProfileSection';
import { AIAgentSection } from '@/components/Settings/AIAgentSection';
import { PlansSection } from '@/components/Settings/PlansSection';
export default function Configuracoes() {
  return <div className="container mx-auto px-4 py-8 max-w-6xl">
      

      <div className="space-y-8">
        <UserProfileSection />
        <AIAgentSection />
        <PlansSection />
      </div>
    </div>;
}