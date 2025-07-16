
import React from 'react';
import { TransactionItem } from './TransactionItem';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string | null;
  category: string;
  tx_date: string;
  is_recurring?: boolean;
  is_installment?: boolean;
  installment_number?: number;
  total_installments?: number;
}

interface TransactionsListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number, description: string) => void;
  formatCurrency: (value: number) => string;
}

export function TransactionsList({ transactions, onEdit, onDelete, formatCurrency }: TransactionsListProps) {
  // Group transactions by month/year
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.tx_date);
    const monthYear = format(date, "MMMM 'de' yyyy", { locale: ptBR });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(transaction);
    
    return groups;
  }, {} as Record<string, Transaction[]>);

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 text-center">
        <p className="text-gray-500">Nenhuma transação encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedTransactions).map(([monthYear, monthTransactions]) => (
        <div key={monthYear} className="space-y-3">
          <div className="bg-gray-50 rounded-lg px-4 py-2 border border-[#E2E8F0]">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">{monthYear}</h2>
            <p className="text-sm text-gray-600">
              {monthTransactions.length} {monthTransactions.length === 1 ? 'transação' : 'transações'}
            </p>
          </div>
          
          <div className="space-y-3">
            {monthTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onEdit={onEdit}
                onDelete={onDelete}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
