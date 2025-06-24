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
  const handleDelete = () => {
    if (transactionId) {
      onDelete(transactionId);
      onClose();
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
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
