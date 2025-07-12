import React, { useState, useMemo } from 'react';
import { useTransactions } from "@/hooks/useFinancialData";
import { useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactionMutations";
import { TransactionFilters } from "@/components/Transactions/TransactionFilters";
import { TransactionSorting } from "@/components/Transactions/TransactionSorting";
import { TransactionsList } from "@/components/Transactions/TransactionsList";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteTransactionDialog } from "@/components/DeleteTransactionDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  credit_card_id?: number;
  is_credit_card_expense?: boolean;
  installment_start_date?: string | null;
  installment_value?: number | null;
}

export default function Transacoes() {
  const { data: allTransactions = [], isLoading } = useTransactions();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  // States for filters, sorting, and pagination
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    creditCard: 'all',
    search: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  const [sortBy, setSortBy] = useState('tx_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(20);

  // Modal states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<{
    id: number;
    description: string;
  } | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = allTransactions.filter((transaction) => {
      // Filter by type
      if (filters.type !== 'all') {
        if (filters.type === 'recorrente' && !transaction.is_recurring) return false;
        if (filters.type === 'parcelado' && !transaction.is_installment) return false;
        if (filters.type === 'receita' && transaction.type !== 'receita') return false;
        if (filters.type === 'despesa' && transaction.type !== 'despesa') return false;
      }

      // Filter by category
      if (filters.category !== 'all' && transaction.category !== filters.category) {
        return false;
      }

      // Filter by credit card
      if (filters.creditCard !== 'all') {
        if (filters.creditCard === 'none') {
          // Show only transactions without credit card
          if (transaction.credit_card_id || transaction.is_credit_card_expense) return false;
        } else {
          // Show only transactions with specific credit card
          const creditCardId = parseInt(filters.creditCard);
          if (transaction.credit_card_id !== creditCardId) return false;
        }
      }

      // Filter by search
      if (filters.search && !transaction.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Filter by date range
      const transactionDate = new Date(transaction.tx_date);
      if (filters.startDate && transactionDate < filters.startDate) return false;
      if (filters.endDate && transactionDate > filters.endDate) return false;

      return true;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'tx_date':
          comparison = new Date(a.tx_date).getTime() - new Date(b.tx_date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allTransactions, filters, sortBy, sortOrder]);

  const displayedTransactions = filteredAndSortedTransactions.slice(0, displayLimit);
  const hasMoreTransactions = filteredAndSortedTransactions.length > displayLimit;

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setDisplayLimit(20); // Reset pagination when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      creditCard: 'all',
      search: '',
      startDate: undefined,
      endDate: undefined,
    });
    setDisplayLimit(20);
  };

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleSaveTransaction = (id: number, data: Partial<Transaction>) => {
    updateTransactionMutation.mutate({ id, data });
  };

  const handleDeleteTransaction = (id: number, description: string) => {
    setDeletingTransaction({ id, description: description || 'Transação sem descrição' });
  };

  const handleConfirmDelete = (id: number) => {
    deleteTransactionMutation.mutate(id);
  };

  const loadMoreTransactions = () => {
    setDisplayLimit(prev => prev + 20);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600">
            {filteredAndSortedTransactions.length} {filteredAndSortedTransactions.length > 1 ? 'transações encontradas' : 'transação encontrada'}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          Filtros
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <TransactionFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Sorting */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
        <TransactionSorting
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Transactions List */}
      <TransactionsList
        transactions={displayedTransactions}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        formatCurrency={formatCurrency}
      />

      {/* Load More Button */}
      {hasMoreTransactions && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMoreTransactions}
            className="w-full max-w-xs"
          >
            Carregar mais transações
          </Button>
        </div>
      )}

      {/* Modals */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleSaveTransaction}
      />

      <DeleteTransactionDialog
        transactionId={deletingTransaction?.id || null}
        transactionDescription={deletingTransaction?.description || ''}
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onDelete={handleConfirmDelete}
      />
    </div>
  );
}
