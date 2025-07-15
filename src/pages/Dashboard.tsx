
import { useAuth } from "@/contexts/AuthContext";
import { useFinancialData, useTransactions } from "@/hooks/useFinancialData";
import { useCreditCardBills } from "@/hooks/useCreditCardBillsNew";
import { useCreditCards } from "@/hooks/useCreditCards";
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
  const { data: bills = [] } = useCreditCardBills();
  const { data: creditCards = [] } = useCreditCards();

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

  // Transform transactions to match expected interface
  const recentTransactions = transactions.slice(0, 10).map(transaction => ({
    id: transaction.id,
    description: transaction.description || 'Sem descrição',
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    tx_date: transaction.tx_date,
    is_recurring: transaction.is_recurring,
    is_installment: transaction.is_installment,
    installment_number: transaction.installment_number,
    total_installments: transaction.total_installments,
    credit_card_id: transaction.credit_card_id,
    is_credit_card_expense: transaction.is_credit_card_expense,
    is_agent: transaction.is_agent,
    registered_at: transaction.registered_at
  }));

  // Check if there are credit card bills to show
  const hasCreditCardBills = creditCards.length > 0 && bills.length > 0;

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

      <div className={`grid grid-cols-1 ${hasCreditCardBills ? 'lg:grid-cols-2' : ''} gap-6`}>
        <RecentTransactions 
          transactions={recentTransactions}
          formatCurrency={formatCurrency}
        />
        {hasCreditCardBills && <CreditCardBillsSection />}
      </div>

      <AddTransactionFAB />
      <WelcomeModal />
    </div>
  );
}
