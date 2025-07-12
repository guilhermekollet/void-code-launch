
import { useAuth } from "@/contexts/AuthContext";
import { useFinancialData, useTransactions } from "@/hooks/useFinancialData";
import { ModernQuickStats } from "@/components/Dashboard/ModernQuickStats";
import { TransactionChart } from "@/components/Dashboard/TransactionChart";
import { CategoryChart } from "@/components/Dashboard/CategoryChart";
import { RecentTransactions } from "@/components/Dashboard/RecentTransactions";
import { CreditCardBillsSection } from "@/components/Dashboard/CreditCardBillsSection";
import { AddTransactionFAB } from "@/components/AddTransaction/AddTransactionFAB";
import { WelcomeModal } from "@/components/WelcomeModal";

export default function Dashboard() {
  const { user } = useAuth();
  const financialDataQuery = useFinancialData();
  const transactionsQuery = useTransactions();

  // Access data through query result with fallbacks
  const {
    totalBalance = 0,
    monthlyIncome = 0,
    monthlyExpenses = 0,
    monthlyRecurringExpenses = 0
  } = financialDataQuery.data || {};

  const transactions = transactionsQuery.data || [];

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
        <RecentTransactions 
          transactions={transactions.slice(0, 10)} 
          formatCurrency={formatCurrency}
        />
        <CreditCardBillsSection />
      </div>

      <AddTransactionFAB />
      <WelcomeModal />
    </div>
  );
}
