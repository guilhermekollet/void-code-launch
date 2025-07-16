
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CreditCard, Receipt } from 'lucide-react';

interface Transaction {
  id: number;
  description: string;
  value: number;
  category: string;
  tx_date: string;
  installment_number?: number;
  total_installments?: number;
}

interface Bill {
  id: number;
  bill_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  status: string;
}

interface CreditCardBillTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: Bill;
  transactions: Transaction[];
  cardName: string;
}

export function CreditCardBillTransactionsModal({
  open,
  onOpenChange,
  bill,
  transactions,
  cardName,
}: CreditCardBillTransactionsModalProps) {
  const hasTransactions = transactions && transactions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transações - {cardName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {bill && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Vencimento:</span>
                  <span className="font-medium">
                    {format(new Date(bill.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={bill.status === 'paid' ? 'default' : 'secondary'}>
                    {bill.status === 'paid' ? 'Paga' : 'Pendente'}
                  </Badge>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Total da Fatura</span>
                  <span className="font-semibold">{formatCurrency(bill.bill_amount)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Valor Pago</span>
                  <span className="font-semibold text-green-600">{formatCurrency(bill.paid_amount)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Saldo Restante</span>
                  <span className="font-semibold text-red-600">{formatCurrency(bill.remaining_amount)}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-3">
              Transações {hasTransactions && `(${transactions.length})`}
            </h3>
            
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {hasTransactions ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{transaction.description}</span>
                        {transaction.installment_number && transaction.total_installments && (
                          <Badge variant="outline" className="text-xs">
                            {transaction.installment_number}/{transaction.total_installments}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{transaction.category}</span>
                        <span>•</span>
                        <span>{format(new Date(transaction.tx_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-red-600">
                        {formatCurrency(transaction.value)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma transação encontrada</p>
                  <p className="text-sm mt-1">
                    {bill ? 'Esta fatura não possui transações registradas.' : 'Não há fatura atual para este cartão.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
