
import { useMemo } from 'react';
import { useChartData } from "@/hooks/useFinancialData";
import { useFutureData } from './useFutureData';

export function useFullscreenChartData(period: string, showFuture: boolean) {
  const { monthlyData: originalData } = useChartData();
  const futureData = useFutureData(showFuture);

  return useMemo(() => {
    const months = parseInt(period);
    const expandedData = Array.from({ length: months }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const existingData = originalData.find(d => d.mes === date.toLocaleDateString('pt-BR', { month: 'short' }));
      
      return existingData || {
        mes: date.toLocaleDateString('pt-BR', { month: 'short' }),
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
      return [...dataWithFlow, ...futureData];
    }

    return dataWithFlow;
  }, [period, originalData, showFuture, futureData]);
}
