
import { useMemo } from 'react';
import { useTransactions } from "@/hooks/useFinancialData";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";

export function useFutureData(showFuture: boolean) {
  const { data: transactions = [] } = useTransactions();
  const { data: recurringTransactions = [] } = useRecurringTransactions();

  return useMemo(() => {
    if (!showFuture) return [];

    console.log('Generating future data...');
    console.log('Recurring transactions:', recurringTransactions);
    console.log('All transactions:', transactions);

    const currentDate = new Date();
    const futureMonths: any[] = [];
    
    // Get installment transactions that have future payments
    const installmentTransactions = transactions.filter(t => 
      t.is_installment && 
      t.installment_number && 
      t.total_installments &&
      t.installment_number < t.total_installments
    );

    // Get unique future transactions (like salaries scheduled for future months)
    const futureUniqueTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.tx_date);
      return transactionDate > currentDate && !t.is_installment && !t.is_recurring;
    });

    console.log('Future unique transactions found:', futureUniqueTransactions);

    // Calculate up to 24 months in the future
    for (let i = 1; i <= 24; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      
      let futureReceitas = 0;
      let futureDespesas = 0;
      let futureGastosRecorrentes = 0;

      // Process unique future transactions for this month
      futureUniqueTransactions.forEach(transaction => {
        const transactionDate = new Date(transaction.tx_date);
        
        // Check if this transaction is scheduled for this specific future month
        if (transactionDate.getFullYear() === futureDate.getFullYear() && 
            transactionDate.getMonth() === futureDate.getMonth()) {
          
          const amount = Number(transaction.amount);
          console.log(`Future unique transaction: ${transaction.description}, amount: ${amount}, type: ${transaction.type}, date: ${transactionDate.toLocaleDateString()}`);
          
          if (transaction.type === 'receita') {
            futureReceitas += amount;
          } else if (transaction.type === 'despesa') {
            futureDespesas += amount;
          }
        }
      });

      // Calculate future installments for this month
      installmentTransactions.forEach(transaction => {
        const startDate = new Date(transaction.installment_start_date || transaction.tx_date);
        
        // Calculate months difference more precisely
        const monthsDiff = (futureDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (futureDate.getMonth() - startDate.getMonth());
        
        // Check if this installment should be paid in this future month
        const currentInstallment = (transaction.installment_number || 1) + monthsDiff;
        
        if (monthsDiff >= 0 && currentInstallment <= (transaction.total_installments || 0)) {
          const amount = Number(transaction.amount);
          console.log(`Future installment: ${transaction.description}, amount: ${amount}, month: ${futureDate.toLocaleDateString('pt-BR', { month: 'short' })}`);
          
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

      // Add recurring transactions to ALL future months
      recurringTransactions.forEach(transaction => {
        const amount = Number(transaction.amount);
        console.log(`Recurring transaction: ${transaction.description}, amount: ${amount}, type: ${transaction.type}`);
        
        if (transaction.type === 'receita') {
          futureReceitas += amount;
        } else if (transaction.type === 'despesa') {
          futureDespesas += amount;
          futureGastosRecorrentes += amount; // All recurring transactions are gastos recorrentes
        }
      });

      // Always add the month data
      futureMonths.push({
        mes: futureDate.toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: futureReceitas,
        despesas: futureDespesas,
        gastosRecorrentes: futureGastosRecorrentes,
        fluxoLiquido: futureReceitas - futureDespesas,
        isFuture: true
      });

      console.log(`Future month ${futureDate.toLocaleDateString('pt-BR', { month: 'short' })}: receitas=${futureReceitas}, despesas=${futureDespesas}`);
    }

    // Stop when we have 6 consecutive months with no data
    let consecutiveEmptyMonths = 0;
    const filteredMonths = futureMonths.filter((month, index) => {
      if (month.receitas > 0 || month.despesas > 0) {
        consecutiveEmptyMonths = 0;
        return true;
      } else {
        consecutiveEmptyMonths++;
        return consecutiveEmptyMonths < 6 || index < 6;
      }
    });

    console.log('Filtered future months:', filteredMonths);
    return filteredMonths;
  }, [showFuture, transactions, recurringTransactions]);
}
