
import React, { useState, useMemo } from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { EditRecurringTransactionModal } from "@/components/EditRecurringTransactionModal";
import { DeleteRecurringTransactionDialog } from "@/components/DeleteRecurringTransactionDialog";
import { LoadingState } from "@/components/RecurringTransactions/LoadingState";
import { EmptyState } from "@/components/RecurringTransactions/EmptyState";
import { RecurringTransactionsList } from "@/components/RecurringTransactions/RecurringTransactionsList";
import { RecurringFilters } from "@/components/RecurringTransactions/RecurringFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Transaction {
  id: number;
  description: string;
  category: string;
  amount: number;
  recurring_date: number;
  is_recurring: boolean;
}

export default function Recorrentes() {
  const { data: allRecurringTransactions = [], isLoading } = useRecurringTransactions();

  // Filter and sort states
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
  });

  const [sortBy, setSortBy] = useState('recurring_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Calculate statistics
  const totalRecurringExpenses = useMemo(() => {
    return allRecurringTransactions.reduce((sum, transaction) => sum + Number(transaction.value), 0);
  }, [allRecurringTransactions]);

  // Filter and sort transactions - Map value to amount for compatibility
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = allRecurringTransactions
      .map(transaction => ({
        ...transaction,
        amount: transaction.value // Map value to amount for compatibility
      }))
      .filter((transaction) => {
        // Filter by category
        if (filters.category !== 'all' && transaction.category !== filters.category) {
          return false;
        }

        // Filter by search
        if (filters.search && !transaction.description.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }

        return true;
      });

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'recurring_date':
          comparison = a.recurring_date - b.recurring_date;
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allRecurringTransactions, filters, sortBy, sortOrder]);

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedTransaction(null);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      category: 'all',
      search: '',
    });
  };

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  if (isLoading) {
    return (
      <TooltipProvider>
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gastos Recorrentes</h1>
            <p className="text-gray-600">
              {filteredAndSortedTransactions.length} despesa{filteredAndSortedTransactions.length !== 1 ? 's' : ''} recorrente{filteredAndSortedTransactions.length !== 1 ? 's' : ''} encontrada{filteredAndSortedTransactions.length !== 1 ? 's' : ''}
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Mensal</h3>
            <p className="text-2xl font-bold text-red-600">
              R$ {totalRecurringExpenses.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Despesas Ativas</h3>
            <p className="text-2xl font-bold text-gray-900">
              {allRecurringTransactions.length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Próximo Vencimento</h3>
            <p className="text-2xl font-bold text-[#61710C]">
              {allRecurringTransactions.length > 0 
                ? `Dia ${Math.min(...allRecurringTransactions.map(t => t.recurring_date))}`
                : '-'
              }
            </p>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <RecurringFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        )}

        {/* Main Content */}
        {filteredAndSortedTransactions.length === 0 ? (
          <EmptyState />
        ) : (
          <RecurringTransactionsList
            transactions={filteredAndSortedTransactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        )}

        <EditRecurringTransactionModal
          transaction={selectedTransaction}
          isOpen={editModalOpen}
          onClose={closeEditModal}
        />

        <DeleteRecurringTransactionDialog
          transactionId={selectedTransaction?.id || null}
          transactionDescription={selectedTransaction?.description || ''}
          isOpen={deleteDialogOpen}
          onClose={closeDeleteDialog}
        />
      </div>
    </TooltipProvider>
  );
}
