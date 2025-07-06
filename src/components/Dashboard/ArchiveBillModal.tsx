
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useArchiveBill } from "@/hooks/useCreditCardBillsNew";
import type { CreditCardBill } from "@/hooks/useCreditCardBillsNew";
import { Archive } from "lucide-react";

interface ArchiveBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: CreditCardBill;
}

export function ArchiveBillModal({ open, onOpenChange, bill }: ArchiveBillModalProps) {
  const archiveBill = useArchiveBill();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleArchive = () => {
    archiveBill.mutate(bill.id, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const cardName = bill.credit_cards.card_name || bill.credit_cards.bank_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#121212] flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Arquivar Fatura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-[#121212] mb-2">{cardName}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Valor da fatura:</span>
                <span className="font-medium">{formatCurrency(bill.bill_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Vencimento:</span>
                <span className="font-medium">{formatDate(bill.due_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Status:</span>
                <span className="font-medium text-green-600">Paga</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Atenção:</strong> Ao arquivar esta fatura, ela será removida da visualização principal 
              e não será possível desfazer pagamentos. Esta ação pode ser revertida através das configurações.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={archiveBill.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleArchive}
              disabled={archiveBill.isPending}
              className="flex-1"
              style={{
                backgroundColor: '#61710C',
                color: '#CFF500',
              }}
            >
              {archiveBill.isPending ? 'Arquivando...' : 'Arquivar Fatura'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
