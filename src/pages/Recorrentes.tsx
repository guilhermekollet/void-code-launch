
import React, { useState } from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { EditRecurringTransactionModal } from "@/components/EditRecurringTransactionModal";
import { DeleteRecurringTransactionDialog } from "@/components/DeleteRecurringTransactionDialog";
import { LoadingState } from "@/components/RecurringTransactions/LoadingState";
import { EmptyState } from "@/components/RecurringTransactions/EmptyState";
import { RecurringTransactionsList } from "@/components/RecurringTransactions/RecurringTransactionsList";

interface Transaction {
  id: number;
  description: string;
  category: string;
  amount: number;
  recurring_date: number;
  is_recurring: boolean;
}

export default function Recorrentes() {
  const { data: recurringTransactions = [], isLoading } = useRecurringTransactions();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <TooltipProvider>
      {recurringTransactions.length === 0 ? (
        <EmptyState />
      ) : (
        <RecurringTransactionsList
          transactions={recurringTransactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
    </TooltipProvider>
  );
}
