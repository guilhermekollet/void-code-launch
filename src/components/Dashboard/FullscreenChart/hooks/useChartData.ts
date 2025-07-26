
import { useMemo } from 'react';
import { useTransactions } from "@/hooks/useFinancialData";
import { useFutureData } from './useFutureData';
import { useDailyData } from "@/hooks/useFinancialData";

export function useFullscreenChartData(period: string, showFuture: boolean) {
  const { data: transactions = [] } = useTransactions();
  const futureData = useFutureData(showFuture);

  // Use daily data hook for daily periods
  const isDailyPeriod = period.endsWith('d');
  const days = isDailyPeriod ? parseInt(period.replace('d', '')) : 0;
  const { data: dailyData = [] } = useDailyData(days);

  return useMemo(() => {
    if (isDailyPeriod) {
      // Return daily data for 7d and 30d periods
      return dailyData;
    } else {
      // Handle monthly periods (3, 6, 12, 24)
      const months = parseInt(period);
      const currentDate = new Date();
      
      const expandedData = Array.from({ length: months }, (_, i) => {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        
        // Get regular transactions for this specific month and year
        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.tx_date);
          return transactionDate.getMonth() === date.getMonth() && 
                 transactionDate.getFullYear() === date.getFullYear();
        });

        // Calculate installment transactions for this period - FIXED LOGIC
        const installmentTransactions = transactions.filter(t => {
          if (!t.is_installment || !t.installment_start_date || !t.total_installments) return false;
          
          const startDate = new Date(t.installment_start_date);
          const currentPeriodDate = new Date(date.getFullYear(), date.getMonth(), 1);
          
          // Calculate which installment would fall in this period
          const monthsDiff = (currentPeriodDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (currentPeriodDate.getMonth() - startDate.getMonth());
          
          // Only include if this month falls within the installment period
          return monthsDiff >= 0 && monthsDiff < t.total_installments;
        });

        // Regular income
        const regularReceitas = monthTransactions
          .filter(t => t.type === 'receita' && !t.is_installment)
          .reduce((sum, t) => sum + Number(t.value), 0);

        // Installment income - FIXED: Use individual installment value, not total
        const installmentReceitas = installmentTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => {
            // Use installment_value if available, otherwise divide total by installments
            const installmentValue = t.installment_value ? Number(t.installment_value) : Number(t.value) / Number(t.total_installments);
            return sum + installmentValue;
          }, 0);

        const totalReceitas = regularReceitas + installmentReceitas;

        // Regular expenses
        const regularDespesas = monthTransactions
          .filter(t => t.type === 'despesa' && !t.is_installment)
          .reduce((sum, t) => sum + Number(t.value), 0);

        // Installment expenses - FIXED: Use individual installment value, not total
        const installmentDespesas = installmentTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => {
            // Use installment_value if available, otherwise divide total by installments
            const installmentValue = t.installment_value ? Number(t.installment_value) : Number(t.value) / Number(t.total_installments);
            return sum + installmentValue;
          }, 0);

        const totalDespesas = regularDespesas + installmentDespesas;

        const gastosRecorrentes = monthTransactions
          .filter(t => t.type === 'despesa' && t.is_recurring)
          .reduce((sum, t) => sum + Number(t.value), 0);
        
        // For 2-year period, include year in label to avoid confusion
        const monthLabel = months === 24 
          ? date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace(' de ', ' ')
          : date.toLocaleDateString('pt-BR', { month: 'short' });
        
        return {
          mes: monthLabel,
          receitas: totalReceitas,
          despesas: Math.abs(totalDespesas), // Ensure expenses are positive
          gastosRecorrentes: Math.abs(gastosRecorrentes), // Ensure recurring expenses are positive
          fluxoLiquido: totalReceitas - totalDespesas,
          isFuture: false
        };
      }).reverse();

      // Combine with future data if enabled
      if (showFuture && futureData.length > 0) {
        // Apply same year labeling to future data for 2-year period
        const adjustedFutureData = months === 24 
          ? futureData.map(item => {
              const futureDate = new Date();
              const monthIndex = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                                 'jul', 'ago', 'set', 'out', 'nov', 'dez']
                                .indexOf(item.mes.replace('.', ''));
              if (monthIndex !== -1) {
                futureDate.setMonth(monthIndex);
                // Add year to future data to distinguish from past data
                futureDate.setFullYear(futureDate.getFullYear() + Math.floor(futureData.indexOf(item) / 12) + 1);
                const yearLabel = futureDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace(' de ', ' ');
                return { ...item, mes: yearLabel };
              }
              return item;
            })
          : futureData;
        
        return [...expandedData, ...adjustedFutureData];
      }

      return expandedData;
    }
  }, [period, transactions, showFuture, futureData, dailyData, isDailyPeriod]);
}
