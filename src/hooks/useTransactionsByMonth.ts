
import { useQuery } from "@tanstack/react-query";
import { useTransactions } from "./useFinancialData";

export function useTransactionsByMonth(month: string, enabled: boolean = false) {
  const { data: allTransactions = [] } = useTransactions();

  return useQuery({
    queryKey: ['transactions-by-month', month, allTransactions.length],
    queryFn: () => {
      if (!month || !enabled) return [];

      // Parse the month (format: "jan", "fev", etc.)
      const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                         'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const monthIndex = monthNames.indexOf(month.toLowerCase());
      
      if (monthIndex === -1) return [];

      const currentYear = new Date().getFullYear();
      
      // Filter transactions for the specific month
      const monthTransactions = allTransactions.filter(t => {
        const txDate = new Date(t.tx_date);
        return txDate.getMonth() === monthIndex && txDate.getFullYear() === currentYear;
      });

      // Add installment transactions for this month
      const installmentTransactions = allTransactions.filter(t => {
        if (!t.is_installment || !t.installment_start_date || !t.total_installments) return false;
        
        const startDate = new Date(t.installment_start_date);
        const targetDate = new Date(currentYear, monthIndex, 1);
        
        const monthsDiff = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (targetDate.getMonth() - startDate.getMonth());
        
        return monthsDiff >= 0 && monthsDiff < t.total_installments;
      });

      // Combine all transactions
      const allMonthTransactions = [...monthTransactions, ...installmentTransactions];

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
