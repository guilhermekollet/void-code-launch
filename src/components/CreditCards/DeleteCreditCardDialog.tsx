
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
import { useDeleteCreditCard } from "@/hooks/useCreditCardMutations";

interface DeleteCreditCardDialogProps {
  cardId: number | null;
  cardName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteCreditCardDialog({ 
  cardId, 
  cardName, 
  isOpen, 
  onClose 
}: DeleteCreditCardDialogProps) {
  const deleteCreditCardMutation = useDeleteCreditCard();

  const handleDelete = () => {
    if (cardId) {
      deleteCreditCardMutation.mutate(cardId, {
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
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza de que deseja excluir o cartão "{cardName}"? 
            Esta ação não pode ser desfeita e todas as transações relacionadas 
            a este cartão permanecerão, mas sem a referência ao cartão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteCreditCardMutation.isPending}
          >
            {deleteCreditCardMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
