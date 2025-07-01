
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { usePayBill } from "@/hooks/useCreditCardBillsNew";
import type { CreditCardBill } from "@/hooks/useCreditCardBillsNew";

interface PayBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: CreditCardBill;
}

export function PayBillModal({ open, onOpenChange, bill }: PayBillModalProps) {
  const [paymentAmount, setPaymentAmount] = useState(bill.remaining_amount.toString());
  const payBill = usePayBill();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > bill.remaining_amount) return;

    payBill.mutate(
      { billId: bill.id, paymentAmount: amount },
      {
        onSuccess: () => {
          onOpenChange(false);
          setPaymentAmount(bill.remaining_amount.toString());
        }
      }
    );
  };

  const cardName = bill.credit_cards.card_name || bill.credit_cards.bank_name;
  const paymentValue = parseFloat(paymentAmount) || 0;
  const remainingAfterPayment = bill.remaining_amount - paymentValue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#121212]">
            Pagar Fatura - {cardName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-[#64748B]">Total da fatura:</span>
              <span className="font-semibold">{formatCurrency(bill.bill_amount)}</span>
            </div>
            
            {bill.paid_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Já pago:</span>
                <span className="text-green-600">{formatCurrency(bill.paid_amount)}</span>
              </div>
            )}
            
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm text-[#64748B]">Valor restante:</span>
              <span className="font-semibold">{formatCurrency(bill.remaining_amount)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount" className="text-sm font-medium">
              Valor a pagar
            </Label>
            <CurrencyInput
              id="payment-amount"
              value={paymentAmount}
              onChange={setPaymentAmount}
              className="w-full"
            />
            <p className="text-xs text-[#64748B]">
              Você pode pagar o valor total ou parcial
            </p>
          </div>

          {paymentValue > 0 && paymentValue !== bill.remaining_amount && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Após este pagamento, restará: {formatCurrency(remainingAfterPayment)}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePayment}
              disabled={paymentValue <= 0 || paymentValue > bill.remaining_amount || payBill.isPending}
              className="flex-1"
              style={{
                backgroundColor: '#61710C',
                color: '#CFF500',
              }}
            >
              {payBill.isPending ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
