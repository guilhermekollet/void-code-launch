
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle, Eye, Archive, History } from "lucide-react";
import { useState } from "react";
import { PayBillModal } from "./PayBillModal";
import { ArchiveBillModal } from "./ArchiveBillModal";
import { BillPaymentHistory } from "./BillPaymentHistory";
import { CreditCardBillTransactionsModal } from "@/components/CreditCards/CreditCardBillTransactionsModal";
import type { CreditCardBill } from "@/hooks/useCreditCardBillsNew";

interface CreditCardBillItemProps {
  bill: CreditCardBill;
}

export function CreditCardBillItem({ bill }: CreditCardBillItemProps) {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);

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
    return bill.status === 'overdue';
  };

  const isDueSoon = () => {
    if (bill.status === 'paid' || bill.status === 'overdue') return false;
    const today = new Date();
    const dueDate = new Date(bill.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const cardName = bill.credit_cards.card_name || bill.credit_cards.bank_name;
  const statusColor = isOverdue() ? 'border-red-500 bg-red-50' : 
                     isDueSoon() ? 'border-yellow-500 bg-yellow-50' : 
                     bill.status === 'paid' ? 'border-green-500 bg-green-50' :
                     bill.status === 'open' ? 'border-blue-500 bg-blue-50' :
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
              <p className="text-xs text-[#64748B]">
                {bill.status === 'open' ? 'Fatura em aberto' : `Vence em ${formatDate(bill.due_date)}`}
              </p>
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

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setIsTransactionsModalOpen(true)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Transações
              </Button>

              <Button
                onClick={() => setIsHistoryModalOpen(true)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <History className="h-3 w-3 mr-1" />
                Pagamentos
              </Button>
            </div>

            {bill.status === 'paid' ? (
              <div className="space-y-2">
                <div className="text-center py-2">
                  <span className="text-sm font-medium text-green-600">✓ Fatura Paga</span>
                </div>
                <Button
                  onClick={() => setIsArchiveModalOpen(true)}
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Arquivar
                </Button>
              </div>
            ) : (
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
          </div>
        </CardContent>
      </Card>

      <PayBillModal
        open={isPayModalOpen}
        onOpenChange={setIsPayModalOpen}
        bill={bill}
      />

      <ArchiveBillModal
        open={isArchiveModalOpen}
        onOpenChange={setIsArchiveModalOpen}
        bill={bill}
      />

      <BillPaymentHistory
        open={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
        bill={bill}
      />

      <CreditCardBillTransactionsModal
        open={isTransactionsModalOpen}
        onOpenChange={setIsTransactionsModalOpen}
        bill={bill}
      />
    </>
  );
}
