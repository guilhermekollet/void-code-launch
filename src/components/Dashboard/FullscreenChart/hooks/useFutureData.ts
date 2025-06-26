
import { useMemo } from 'react';
import { useTransactions } from "@/hooks/useFinancialData";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";

export function useFutureData(showFuture: boolean) {
  const { data: transactions = [] } = useTransactions();
  const { data: recurringTransactions = [] } = useRecurringTransactions();

  return useMemo(() => {
    if (!showFuture) return [];

    const currentDate = new Date();
    const futureMonths: any[] = [];
    
    // Get installment transactions that have future payments
    const installmentTransactions = transactions.filter(t => 
      t.is_installment && 
      t.installment_number && 
      t.total_installments &&
      t.installment_number < t.total_installments
    );

    // Calculate up to 24 months in the future
    for (let i = 1; i <= 24; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      
      let futureReceitas = 0;
      let futureDespesas = 0;
      let futureGastosRecorrentes = 0;

      // Calculate future installments for this month
      installmentTransactions.forEach(transaction => {
        const startDate = new Date(transaction.installment_start_date || transaction.tx_date);
        const monthsFromStart = Math.floor((futureDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        if (monthsFromStart >= 0 && monthsFromStart < (transaction.total_installments || 0)) {
          const amount = Number(transaction.amount);
          if (transaction.type === 'receita') {
            futureReceitas += amount;
          } else if (transaction.type === 'despesa') {
            futureDespesas += amount;
            if (transaction.is_recurring) {
              futureGastosRecorrentes += amount;
            }
          }
        }
      });

      // Add recurring transactions to future months
      recurringTransactions.forEach(transaction => {
        const amount = Number(transaction.amount);
        if (transaction.type === 'receita') {
          futureReceitas += amount;
        } else if (transaction.type === 'despesa') {
          futureDespesas += amount;
          futureGastosRecorrentes += amount; // All recurring transactions are gastos recorrentes
        }
      });

      if (futureReceitas > 0 || futureDespesas > 0) {
        futureMonths.push({
          mes: futureDate.toLocaleDateString('pt-BR', { month: 'short' }),
          receitas: futureReceitas,
          despesas: futureDespesas,
          gastosRecorrentes: futureGastosRecorrentes,
          fluxoLiquido: futureReceitas - futureDespesas,
          isFuture: true
        });
      }
    }

    // Stop when we have 6 consecutive months with no data
    let emptyMonths = 0;
    return futureMonths.filter((month, index) => {
      if (month.receitas === 0 && month.despesas === 0) {
        emptyMonths++;
      } else {
        emptyMonths = 0;
      }
      return emptyMonths < 6;
    });
  }, [showFuture, transactions, recurringTransactions]);
}
