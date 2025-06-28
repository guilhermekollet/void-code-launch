
import { useQuery } from "@tanstack/react-query";
import { useTransactions } from "./useFinancialData";
import { useCreditCards } from "./useCreditCards";

export function useReportsFutureData(enabled: boolean = false) {
  const { data: transactions = [] } = useTransactions();
  const { data: creditCards = [] } = useCreditCards();

  return useQuery({
    queryKey: ['reports-future-data', transactions.length, creditCards.length, enabled],
    queryFn: () => {
      if (!enabled) return [];

      const currentDate = new Date();
      const futureMonths = 24; // Show next 24 months

      const futureData = Array.from({ length: futureMonths }, (_, i) => {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() + i + 1);
        
        // Calculate installment transactions (non-credit card) that will be due in this specific month
        const installmentTransactions = transactions.filter(t => {
          if (!t.is_installment || !t.installment_start_date || !t.total_installments || t.is_credit_card_expense) return false;
          
          const startDate = new Date(t.installment_start_date);
          const futurePeriodDate = new Date(date.getFullYear(), date.getMonth(), 1);
          
          // Calculate which installment would fall in this period
          const monthsDiff = (futurePeriodDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (futurePeriodDate.getMonth() - startDate.getMonth());
          
          return monthsDiff >= 0 && monthsDiff < t.total_installments;
        });

        // Calculate recurring transactions that will be due in this month
        const recurringTransactions = transactions.filter(t => t.is_recurring && !t.is_credit_card_expense);

        // Calculate credit card expenses for this month
        let creditCardExpenses = 0;
        
        transactions.filter(t => t.is_credit_card_expense && t.credit_card_id).forEach(transaction => {
          const creditCard = creditCards.find(card => card.id === transaction.credit_card_id);
          if (!creditCard) return;

          const transactionDate = new Date(transaction.tx_date);
          const installments = transaction.installments || 1;
          const installmentValue = transaction.installment_value || transaction.amount;

          // Calculate billing dates for each installment
          for (let installmentIndex = 0; installmentIndex < installments; installmentIndex++) {
            const installmentDate = new Date(transactionDate);
            installmentDate.setMonth(installmentDate.getMonth() + installmentIndex);

            // Calculate when this installment will be billed
            const closeDate = Math.max(1, creditCard.due_date - 7); // Assumindo que fechamento é 7 dias antes do vencimento
            let billMonth = installmentDate.getMonth();
            let billYear = installmentDate.getFullYear();
            
            if (installmentDate.getDate() > closeDate) {
              billMonth += 1;
              if (billMonth > 11) {
                billMonth = 0;
                billYear += 1;
              }
            }

            // Check if this installment bill falls in the current future month
            if (billYear === date.getFullYear() && billMonth === date.getMonth()) {
              creditCardExpenses += installmentValue;
            }
          }
        });

        // For installment transactions, use the direct amount (each transaction already represents one installment)
        const installmentReceitas = installmentTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const installmentDespesas = installmentTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // For recurring transactions, only count what will be due in this specific month
        const recurringReceitas = recurringTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const recurringDespesas = recurringTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalReceitas = installmentReceitas + recurringReceitas;
        const totalDespesas = installmentDespesas + recurringDespesas + creditCardExpenses;

        return {
          mes: date.toLocaleDateString('pt-BR', { month: 'short' }),
          receitas: totalReceitas,
          despesas: totalDespesas,
          gastosRecorrentes: recurringDespesas,
          fluxo: totalReceitas - totalDespesas,
          isFuture: true
        };
      });

      console.log('Future data generated with credit cards:', futureData);
      return futureData;
    },
    enabled: enabled,
  });
}
