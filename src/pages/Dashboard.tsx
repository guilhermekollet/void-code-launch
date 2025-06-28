
import { Skeleton } from "@/components/ui/skeleton";
import { QuickStats } from "@/components/Dashboard/QuickStats";
import { TransactionChart } from "@/components/Dashboard/TransactionChart";
import { CategoryChart } from "@/components/Dashboard/CategoryChart";
import { RecentTransactions } from "@/components/Dashboard/RecentTransactions";
import { useFinancialMetrics, useTransactions } from "@/hooks/useFinancialData";

export default function Dashboard() {
  const { totalBalance, monthlyIncome, monthlyExpenses, monthlyRecurringExpenses, isLoading } = useFinancialMetrics();
  const { data: transactions = [] } = useTransactions();

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
