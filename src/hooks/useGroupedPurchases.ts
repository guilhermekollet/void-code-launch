
import { useMemo } from 'react';

interface Transaction {
  id: number;
  description: string;
  value: number;
  tx_date: string;
  category: string;
  credit_card_id?: number;
  is_credit_card_expense?: boolean;
  is_installment?: boolean;
  installment_number?: number;
  total_installments?: number;
}

interface GroupedPurchase {
  id: string;
  description: string;
  totalValue: number;
  installmentValue: number;
  totalInstallments: number;
  firstPaymentDate: string;
  category: string;
  credit_card_id?: number;
  transactions: Transaction[];
}

export function useGroupedPurchases(transactions: Transaction[]) {
  return useMemo(() => {
    const creditCardTransactions = transactions.filter(t => t.is_credit_card_expense);
    
    // Grupo de compras únicas (não parceladas)
    const singlePurchases = creditCardTransactions.filter(t => !t.is_installment || t.total_installments === 1);
    
    // Grupo de compras parceladas
    const installmentTransactions = creditCardTransactions.filter(t => t.is_installment && t.total_installments && t.total_installments > 1);
    
    // Agrupar compras parceladas por descrição base e número total de parcelas
    const groupedInstallments = installmentTransactions.reduce((acc, transaction) => {
      // Remove informações de parcela da descrição para agrupar
      const baseDescription = transaction.description?.split(' (')[0] || transaction.description || '';
      const groupKey = `${baseDescription}_${transaction.total_installments}_${transaction.credit_card_id}`;
      
      if (!acc[groupKey]) {
        acc[groupKey] = {
          id: groupKey,
          description: baseDescription,
          totalValue: 0,
          installmentValue: transaction.value,
          totalInstallments: transaction.total_installments || 1,
          firstPaymentDate: transaction.tx_date,
          category: transaction.category,
          credit_card_id: transaction.credit_card_id,
          transactions: []
        };
      }
      
      acc[groupKey].transactions.push(transaction);
      acc[groupKey].totalValue += transaction.value;
      
      // Manter a data da primeira parcela
      if (new Date(transaction.tx_date) < new Date(acc[groupKey].firstPaymentDate)) {
        acc[groupKey].firstPaymentDate = transaction.tx_date;
      }
      
      return acc;
    }, {} as Record<string, GroupedPurchase>);
    
    // Converter compras únicas para o formato GroupedPurchase
    const singlePurchasesFormatted: GroupedPurchase[] = singlePurchases.map(transaction => ({
      id: `single_${transaction.id}`,
      description: transaction.description || '',
      totalValue: transaction.value,
      installmentValue: transaction.value,
      totalInstallments: 1,
      firstPaymentDate: transaction.tx_date,
      category: transaction.category,
      credit_card_id: transaction.credit_card_id,
      transactions: [transaction]
    }));
    
    // Combinar e ordenar por data
    const allPurchases = [
      ...singlePurchasesFormatted,
      ...Object.values(groupedInstallments)
    ].sort((a, b) => new Date(b.firstPaymentDate).getTime() - new Date(a.firstPaymentDate).getTime());
    
    return allPurchases;
  }, [transactions]);
}
