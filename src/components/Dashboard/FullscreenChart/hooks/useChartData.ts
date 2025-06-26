
import { useMemo } from 'react';
import { useChartData } from "@/hooks/useFinancialData";
import { useFutureData } from './useFutureData';

export function useFullscreenChartData(period: string, showFuture: boolean) {
  const { monthlyData: originalData } = useChartData();
  const futureData = useFutureData(showFuture);

  return useMemo(() => {
    const isDailyPeriod = period.endsWith('d');
    const currentDate = new Date();
    
    if (isDailyPeriod) {
      // Handle daily periods (7d, 30d)
      const days = parseInt(period.replace('d', ''));
      const dailyData = Array.from({ length: days }, (_, i) => {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - (days - 1 - i));
        
        // Group transactions by day from original data
        // For now, we'll create empty daily data structure
        // In a real implementation, you'd need to modify useFinancialData to support daily grouping
        return {
          mes: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          receitas: 0,
          despesas: 0,
          gastosRecorrentes: 0,
          fluxoLiquido: 0,
          isFuture: false
        };
      });

      return dailyData;
    } else {
      // Handle monthly periods (3, 6, 12, 24)
      const months = parseInt(period);
      const expandedData = Array.from({ length: months }, (_, i) => {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        
        const existingData = originalData.find(d => d.mes === date.toLocaleDateString('pt-BR', { month: 'short' }));
        
        // For 2-year period, include year in label to avoid confusion
        const monthLabel = months === 24 
          ? date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace(' de ', ' ')
          : date.toLocaleDateString('pt-BR', { month: 'short' });
        
        return existingData ? {
          ...existingData,
          mes: monthLabel
        } : {
          mes: monthLabel,
          receitas: 0,
          despesas: 0,
          gastosRecorrentes: 0,
          isFuture: false
        };
      }).reverse();

      // Add flow liquid calculation
      const dataWithFlow = expandedData.map(item => ({
        ...item,
        fluxoLiquido: item.receitas - item.despesas
      }));

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
                const yearLabel = futureDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace(' de ', ' ');
                return { ...item, mes: yearLabel };
              }
              return item;
            })
          : futureData;
        
        return [...dataWithFlow, ...adjustedFutureData];
      }

      return dataWithFlow;
    }
  }, [period, originalData, showFuture, futureData]);
}
