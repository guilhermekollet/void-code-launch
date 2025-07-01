
import { Skeleton } from "@/components/ui/skeleton";
import { QuickStats } from "@/components/Dashboard/QuickStats";
import { TransactionChart } from "@/components/Dashboard/TransactionChart";
import { CategoryChart } from "@/components/Dashboard/CategoryChart";
import { RecentTransactions } from "@/components/Dashboard/RecentTransactions";
import { CreditCardBillsSection } from "@/components/Dashboard/CreditCardBillsSection";
import { useFinancialMetrics, useTransactions } from "@/hooks/useFinancialData";
import { useCreditCards } from "@/hooks/useCreditCards";

export default function Dashboard() {
  const { totalBalance, monthlyIncome, monthlyExpenses, monthlyRecurringExpenses, monthlyBillExpenses, isLoading } = useFinancialMetrics();
  const { data: transactions = [] } = useTransactions();
  const { data: creditCards = [] } = useCreditCards();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const recentTransactions = transactions.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-[#E2E8F0] p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <QuickStats
        totalBalance={totalBalance}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        monthlyRecurringExpenses={monthlyRecurringExpenses}
        formatCurrency={formatCurrency}
      />

      {/* Credit Card Bills Section - only show if user has credit cards */}
      {creditCards.length > 0 && <CreditCardBillsSection />}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransactionChart />
        <CategoryChart />
      </div>

      {/* Recent Transactions - agora ocupa toda a largura */}
      <div className="grid grid-cols-1 gap-6">
        <RecentTransactions
          transactions={recentTransactions}
          formatCurrency={formatCurrency}
        />
      </div>
    </div>
  );
}
