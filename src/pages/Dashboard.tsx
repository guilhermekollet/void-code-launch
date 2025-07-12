
import { useAuth } from "@/contexts/AuthContext";
import { useFinancialData } from "@/hooks/useFinancialData";
import { ModernQuickStats } from "@/components/Dashboard/ModernQuickStats";
import { TransactionChart } from "@/components/Dashboard/TransactionChart";
import { CategoryChart } from "@/components/Dashboard/CategoryChart";
import { RecentTransactions } from "@/components/Dashboard/RecentTransactions";
import { CreditCardBillsSection } from "@/components/Dashboard/CreditCardBillsSection";
import { AddTransactionFAB } from "@/components/AddTransaction/AddTransactionFAB";
import { WelcomeModal } from "@/components/WelcomeModal";

export default function Dashboard() {
  const { user } = useAuth();
  const {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyRecurringExpenses
  } = useFinancialData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#121212]">Dashboard</h1>
          <p className="text-[#64748B] mt-1">Visão geral das suas finanças</p>
        </div>
      </div>

      <ModernQuickStats
        totalBalance={totalBalance}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        monthlyRecurringExpenses={monthlyRecurringExpenses}
        formatCurrency={formatCurrency}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransactionChart />
        <CategoryChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions />
        <CreditCardBillsSection />
      </div>

      <AddTransactionFAB />
      <WelcomeModal />
    </div>
  );
}
