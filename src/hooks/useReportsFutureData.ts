
import { useQuery } from "@tanstack/react-query";
import { useTransactions } from "./useFinancialData";

export function useReportsFutureData(enabled: boolean = false) {
  const { data: transactions = [] } = useTransactions();

  return useQuery({
    queryKey: ['reports-future-data', transactions.length, enabled],
    queryFn: () => {
      if (!enabled) return [];

      const currentDate = new Date();
      const futureMonths = 6; // Show next 6 months

      const futureData = Array.from({ length: futureMonths }, (_, i) => {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() + i + 1);
        
        // Calculate installment transactions for this future period
        const installmentTransactions = transactions.filter(t => {
          if (!t.is_installment || !t.installment_start_date || !t.total_installments) return false;
          
          const startDate = new Date(t.installment_start_date);
          const futurePeriodDate = new Date(date.getFullYear(), date.getMonth(), 1);
          
          // Calculate which installment would fall in this period
          const monthsDiff = (futurePeriodDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (futurePeriodDate.getMonth() - startDate.getMonth());
          
          return monthsDiff >= 0 && monthsDiff < t.total_installments;
        });

        // Calculate recurring transactions for this future period
        const recurringTransactions = transactions.filter(t => t.is_recurring);

        const installmentReceitas = installmentTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const installmentDespesas = installmentTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const recurringReceitas = recurringTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const recurringDespesas = recurringTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalReceitas = installmentReceitas + recurringReceitas;
        const totalDespesas = installmentDespesas + recurringDespesas;

        return {
          mes: date.toLocaleDateString('pt-BR', { month: 'short' }),
          receitas: totalReceitas,
          despesas: totalDespesas,
          gastosRecorrentes: recurringDespesas,
          fluxo: totalReceitas - totalDespesas,
          isFuture: true
        };
      });

      console.log('Future data generated:', futureData);
      return futureData;
    },
    enabled: enabled,
  });
}
