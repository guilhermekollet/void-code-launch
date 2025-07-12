
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { usePayBill } from "@/hooks/useCreditCardBillsNew";
import type { CreditCardBill } from "@/hooks/useCreditCardBillsNew";

interface PayBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: CreditCardBill;
}

export function PayBillModal({ open, onOpenChange, bill }: PayBillModalProps) {
  const [amount, setAmount] = useState(bill.remaining_amount.toString());
  const payBill = usePayBill();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await payBill.mutateAsync({
        billId: bill.id,
        amount: parseFloat(amount)
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error paying bill:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Pagar Fatura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cartão</Label>
            <div className="text-sm text-[#64748B]">
              {bill.credit_cards.card_name || bill.credit_cards.bank_name}
            </div>
          </div>

          <div>
            <Label>Valor Total da Fatura</Label>
            <div className="text-lg font-semibold">
              {formatCurrency(bill.bill_amount)}
            </div>
          </div>

          <div>
            <Label>Valor Restante</Label>
            <div className="text-lg font-semibold text-red-600">
              {formatCurrency(bill.remaining_amount)}
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Valor do Pagamento</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={payBill.isPending}
              className="flex-1"
            >
              {payBill.isPending ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
