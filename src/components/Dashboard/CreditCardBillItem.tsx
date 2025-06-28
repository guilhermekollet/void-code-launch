
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { PayBillModal } from "./PayBillModal";
import type { CreditCardBill } from "@/hooks/useCreditCardBills";

interface CreditCardBillItemProps {
  bill: CreditCardBill;
}

export function CreditCardBillItem({ bill }: CreditCardBillItemProps) {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = () => {
    const today = new Date();
    const dueDate = new Date(bill.due_date);
    return dueDate < today && bill.status !== 'paid';
  };

  const isDueSoon = () => {
    const today = new Date();
    const dueDate = new Date(bill.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0 && bill.status !== 'paid';
  };

  const cardName = bill.credit_cards.card_name || bill.credit_cards.bank_name;
  const statusColor = isOverdue() ? 'border-red-500 bg-red-50' : 
                     isDueSoon() ? 'border-yellow-500 bg-yellow-50' : 
                     bill.status === 'paid' ? 'border-green-500 bg-green-50' :
                     'border-[#E2E8F0] bg-white';

  return (
    <>
      <Card className={`${statusColor} transition-colors`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: bill.credit_cards.color }}
            >
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#121212] text-sm">{cardName}</h3>
              <p className="text-xs text-[#64748B]">Vence em {formatDate(bill.due_date)}</p>
            </div>
            {isOverdue() && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#64748B]">Total:</span>
              <span className="font-semibold text-[#121212]">
                {formatCurrency(bill.bill_amount)}
              </span>
            </div>
            
            {bill.paid_amount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B]">Pago:</span>
                <span className="text-sm text-green-600">
                  {formatCurrency(bill.paid_amount)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#64748B]">Restante:</span>
              <span className="font-semibold text-[#121212]">
                {formatCurrency(bill.remaining_amount)}
              </span>
            </div>
          </div>

          {bill.status !== 'paid' && (
            <Button
              onClick={() => setIsPayModalOpen(true)}
              size="sm"
              className="w-full"
              style={{
                backgroundColor: isOverdue() ? '#dc2626' : '#61710C',
                color: isOverdue() ? 'white' : '#CFF500',
              }}
            >
              {isOverdue() ? 'Pagar (Vencida)' : 'Pagar Fatura'}
            </Button>
          )}

          {bill.status === 'paid' && (
            <div className="text-center py-2">
              <span className="text-sm font-medium text-green-600">✓ Fatura Paga</span>
            </div>
          )}
        </CardContent>
      </Card>

      <PayBillModal
        open={isPayModalOpen}
        onOpenChange={setIsPayModalOpen}
        bill={bill}
      />
    </>
  );
}
