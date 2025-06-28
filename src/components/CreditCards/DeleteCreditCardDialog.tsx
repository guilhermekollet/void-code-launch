
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: {
    id: number;
    bank_name: string;
    card_name: string | null;
  };
}

export function DeleteCreditCardDialog({ open, onOpenChange, card }: DeleteCreditCardDialogProps) {
  const deleteCreditCard = useDeleteCreditCard();

  const handleDelete = () => {
    deleteCreditCard.mutate(card.id, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const cardName = card.card_name || card.bank_name;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#121212]">Excluir Cartão de Crédito</AlertDialogTitle>
          <AlertDialogDescription className="text-[#64748B]">
            Tem certeza que deseja excluir o cartão <strong>{cardName}</strong>? 
            Esta ação não pode ser desfeita e todas as transações associadas a este cartão 
            permanecerão no sistema, mas sem a referência do cartão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-[#E2E8F0] text-[#64748B] hover:bg-[#F8F9FA]">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteCreditCard.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteCreditCard.isPending ? 'Excluindo...' : 'Excluir Cartão'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
