
import React, { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { QuickStats } from "@/components/Dashboard/QuickStats";
import { TransactionChart } from "@/components/Dashboard/TransactionChart";
import { CategoryChart } from "@/components/Dashboard/CategoryChart";
import { RecentTransactions } from "@/components/Dashboard/RecentTransactions";
import { CreditCardBillsSection } from "@/components/Dashboard/CreditCardBillsSection";
import { WelcomeModal } from "@/components/WelcomeModal";
import { useFinancialMetrics, useTransactions } from "@/hooks/useFinancialData";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useUserProfile, useUpdateUserProfile } from '@/hooks/useUserProfile';

export default function Dashboard() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { totalBalance, monthlyIncome, monthlyExpenses, monthlyRecurringExpenses, monthlyBillExpenses, isLoading } = useFinancialMetrics();
  const { data: transactions = [] } = useTransactions();
  const { data: creditCards = [] } = useCreditCards();
  const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile();
  const updateUserProfile = useUpdateUserProfile();

  // Check if it's the first time the user is accessing the dashboard
  useEffect(() => {
    if (isLoadingProfile || !userProfile) return;

    const hasSeenWelcomeLocal = localStorage.getItem('bolsofy-welcome-seen') === 'true';
    const hasCompletedOnboarding = userProfile.completed_onboarding;

    // Mostrar modal se:
    // 1. Não viu localmente E não completou onboarding no banco
    // OU
    // 2. Viu localmente mas não está marcado no banco (sincronizar)
    if (!hasSeenWelcomeLocal && !hasCompletedOnboarding) {
      setShowWelcomeModal(true);
    } else if (hasSeenWelcomeLocal && !hasCompletedOnboarding) {
      // Sincronizar: localStorage diz que viu, mas banco não tem registro
      updateUserProfile.mutate({ completed_onboarding: true });
    }
  }, [userProfile, isLoadingProfile, updateUserProfile]);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    
    // Atualizar localStorage
    localStorage.setItem('bolsofy-welcome-seen', 'true');
    
    // Atualizar banco de dados
    updateUserProfile.mutate({ completed_onboarding: true });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const recentTransactions = transactions.slice(0, 5);

  if (isLoading || isLoadingProfile) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-[#E2E8F0] p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <>
      <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseWelcome} />
      
      <div className="space-y-8">
        {/* Quick Stats Cards - improved spacing */}
        <QuickStats
          totalBalance={totalBalance}
          monthlyIncome={monthlyIncome}
          monthlyExpenses={monthlyExpenses}
          monthlyRecurringExpenses={monthlyRecurringExpenses}
          formatCurrency={formatCurrency}
        />

        {/* Credit Card Bills Section - more compact layout */}
        {creditCards.length > 0 && <CreditCardBillsSection />}

        {/* Charts Section - improved spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TransactionChart />
          <CategoryChart />
        </div>

        {/* Recent Transactions - full width with better spacing */}
        <div className="w-full">
          <RecentTransactions
            transactions={recentTransactions}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </>
  );
}
