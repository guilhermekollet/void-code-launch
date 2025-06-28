
import { useQuery } from "@tanstack/react-query";
import { useTransactions } from "./useFinancialData";
import { useCreditCards } from "./useCreditCards";

export function useTransactionsByMonth(month: string, enabled: boolean = false) {
  const { data: allTransactions = [] } = useTransactions();
  const { data: creditCards = [] } = useCreditCards();

  return useQuery({
    queryKey: ['transactions-by-month', month, allTransactions.length, creditCards.length],
    queryFn: () => {
      if (!month || !enabled) return [];

      // Parse the month (format: "jan", "fev", etc.)
      const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                         'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const monthIndex = monthNames.indexOf(month.toLowerCase());
      
      if (monthIndex === -1) return [];

      const currentYear = new Date().getFullYear();
      
      // Filter regular transactions for the specific month (excluding credit card expenses)
      const monthTransactions = allTransactions.filter(t => {
        if (t.is_credit_card_expense) return false; // These will be handled separately
        
        const txDate = new Date(t.tx_date);
        return txDate.getMonth() === monthIndex && txDate.getFullYear() === currentYear;
      });

      // Add installment transactions for this month (non-credit card)
      const installmentTransactions = allTransactions.filter(t => {
        if (!t.is_installment || !t.installment_start_date || !t.total_installments || t.is_credit_card_expense) return false;
        
        const startDate = new Date(t.installment_start_date);
        const targetDate = new Date(currentYear, monthIndex, 1);
        
        const monthsDiff = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (targetDate.getMonth() - startDate.getMonth());
        
        return monthsDiff >= 0 && monthsDiff < t.total_installments;
      });

      // Add credit card transactions that will be billed this month
      const creditCardTransactions: any[] = [];
      
      allTransactions.filter(t => t.is_credit_card_expense && t.credit_card_id).forEach(transaction => {
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
          const closeDate = Math.max(1, creditCard.due_date - 7);
          let billMonth = installmentDate.getMonth();
          let billYear = installmentDate.getFullYear();
          
          if (installmentDate.getDate() > closeDate) {
            billMonth += 1;
            if (billMonth > 11) {
              billMonth = 0;
              billYear += 1;
            }
          }

          // Check if this installment bill falls in the target month
          if (billYear === currentYear && billMonth === monthIndex) {
            creditCardTransactions.push({
              ...transaction,
              id: `${transaction.id}-installment-${installmentIndex}`,
              amount: installmentValue,
              description: installments > 1 
                ? `${transaction.description} (${installmentIndex + 1}/${installments} - Cartão)`
                : `${transaction.description} (Cartão)`,
              tx_date: new Date(billYear, billMonth, creditCard.due_date).toISOString(),
              installment_number: installmentIndex + 1,
              total_installments: installments,
            });
          }
        }
      });

      // Combine all transactions
      const allMonthTransactions = [...monthTransactions, ...installmentTransactions, ...creditCardTransactions];

      // Sort by type: receitas first, then despesas
      const sortedTransactions = allMonthTransactions.sort((a, b) => {
        if (a.type === 'receita' && b.type === 'despesa') return -1;
        if (a.type === 'despesa' && b.type === 'receita') return 1;
        return new Date(b.tx_date).getTime() - new Date(a.tx_date).getTime();
      });

      return sortedTransactions;
    },
    enabled: enabled && !!month,
  });
}
