
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { useCreditCardBillTransactions } from "@/hooks/useCreditCardBillTransactions";
import { BillTransactionItem } from "./BillTransactionItem";
import type { CreditCardBill } from "@/hooks/useCreditCardBillsNew";

interface CreditCardBillTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: CreditCardBill;
}

export function CreditCardBillTransactionsModal({ 
  open, 
  onOpenChange, 
  bill 
}: CreditCardBillTransactionsModalProps) {
  const { data: transactions = [], isLoading } = useCreditCardBillTransactions(
    bill.credit_card_id,
    bill.close_date,
    bill.due_date
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const cardName = bill.credit_cards.card_name || bill.credit_cards.bank_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-2xl font-bold text-[#121212]">
              Transações da Fatura
            </DialogTitle>
            <p className="text-[#64748B] mt-1">
              {cardName} • Vencimento: {formatDate(bill.due_date)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bill Summary */}
          <div className="bg-[#F8F9FA] p-4 rounded-lg border border-[#E2E8F0]">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-[#64748B]">Total da Fatura</p>
                <p className="text-lg font-bold text-[#121212]">
                  {formatCurrency(bill.bill_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Valor Pago</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(bill.paid_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Valor Restante</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(bill.remaining_amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border border-[#E2E8F0] rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-[#64748B] text-lg font-medium">Nenhuma transação encontrada</p>
                <p className="text-sm text-[#64748B] mt-1">
                  Esta fatura não possui transações no período
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <BillTransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onUpdate={() => {
                      // Refresh transactions when updated
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
