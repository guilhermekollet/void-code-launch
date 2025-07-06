
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBillPayments, useUndoPayment } from "@/hooks/useBillPayments";
import type { CreditCardBill } from "@/hooks/useCreditCardBillsNew";
import { History, Undo2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface BillPaymentHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: CreditCardBill;
}

export function BillPaymentHistory({ open, onOpenChange, bill }: BillPaymentHistoryProps) {
  const { data: payments = [], isLoading } = useBillPayments(bill.id);
  const undoPayment = useUndoPayment();
  const [confirmingUndo, setConfirmingUndo] = useState<number | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUndoPayment = (paymentId: number) => {
    undoPayment.mutate(paymentId, {
      onSuccess: () => {
        setConfirmingUndo(null);
      }
    });
  };

  const cardName = bill.credit_cards.card_name || bill.credit_cards.bank_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#121212] flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Pagamentos - {cardName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-[#64748B] font-medium">Nenhum pagamento registrado</p>
              <p className="text-sm text-[#64748B] mt-1">
                Os pagamentos desta fatura aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-[#121212]">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-[#64748B]">
                          {formatDate(payment.payment_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {!bill.archived && (
                    <div className="flex items-center gap-2">
                      {confirmingUndo === payment.id ? (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm text-amber-600 font-medium">Confirmar?</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmingUndo(null)}
                            className="h-7 px-2"
                          >
                            Não
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUndoPayment(payment.id)}
                            disabled={undoPayment.isPending}
                            className="h-7 px-2"
                          >
                            Sim
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmingUndo(payment.id)}
                          className="h-8 px-3 text-xs"
                        >
                          <Undo2 className="h-3 w-3 mr-1" />
                          Desfazer
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {bill.archived && payments.length > 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-[#64748B]">
                <strong>Fatura arquivada:</strong> Não é possível desfazer pagamentos de faturas arquivadas.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
