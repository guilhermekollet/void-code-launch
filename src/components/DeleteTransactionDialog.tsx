
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteTransaction } from "@/hooks/useTransactionMutations";

interface DeleteTransactionDialogProps {
  transactionId: number | null;
  transactionDescription: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
}

export function DeleteTransactionDialog({
  transactionId,
  transactionDescription,
  isOpen,
  onClose,
  onDelete,
}: DeleteTransactionDialogProps) {
  const deleteTransactionMutation = useDeleteTransaction();

  const handleDelete = () => {
    if (transactionId) {
      onDelete(transactionId);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a transação "{transactionDescription}"?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={deleteTransactionMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteTransactionMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteTransactionMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
