
import { useMemo } from 'react';
import { useChartData, useDailyData } from "@/hooks/useFinancialData";
import { useFutureData } from './useFutureData';
import { useTransactions } from "@/hooks/useFinancialData";

export function useFullscreenChartData(period: string, showFuture: boolean) {
  const { monthlyData: originalData } = useChartData();
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
        
        // Get transactions for this specific month and year
        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.tx_date);
          return transactionDate.getMonth() === date.getMonth() && 
                 transactionDate.getFullYear() === date.getFullYear();
        });

        const receitas = monthTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const despesas = monthTransactions
          .filter(t => t.type === 'despesa')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const gastosRecorrentes = monthTransactions
          .filter(t => t.type === 'despesa' && t.is_recurring)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        // For 2-year period, include year in label to avoid confusion
        const monthLabel = months === 24 
          ? date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace(' de ', ' ')
          : date.toLocaleDateString('pt-BR', { month: 'short' });
        
        return {
          mes: monthLabel,
          receitas,
          despesas,
          gastosRecorrentes,
          fluxoLiquido: receitas - despesas,
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
