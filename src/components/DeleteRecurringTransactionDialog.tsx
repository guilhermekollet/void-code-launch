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
import { useDeleteRecurringTransaction } from "@/hooks/useRecurringTransactionMutations";

interface DeleteRecurringTransactionDialogProps {
  transactionId: number | null;
  transactionDescription: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteRecurringTransactionDialog({
  transactionId,
  transactionDescription,
  isOpen,
  onClose,
}: DeleteRecurringTransactionDialogProps) {
  const deleteMutation = useDeleteRecurringTransaction();

  const handleDelete = () => {
    if (transactionId) {
      deleteMutation.mutate(transactionId, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Despesa Recorrente</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a despesa "{transactionDescription}"?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
