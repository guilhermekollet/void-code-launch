
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Calendar, Tag, Edit, Trash2 } from "lucide-react";
import { useTransactionsByMonth } from "@/hooks/useTransactionsByMonth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TimeRange } from '../types';
import { useState } from "react";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteTransactionDialog } from "@/components/DeleteTransactionDialog";
import { useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactionMutations";
import { useQueryClient } from "@tanstack/react-query";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: string;
  timeRange: TimeRange;
}

export function TransactionModal({ isOpen, onClose, period, timeRange }: TransactionModalProps) {
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  // Parse period to get month string and convert to the format expected by useTransactionsByMonth
  const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                     'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  
  let monthString: string;
  
  if (period.includes('/')) {
    const parts = period.split('/');
    const monthNumber = parseInt(parts[0], 10);
    monthString = monthNames[monthNumber - 1] || 'jan';
  } else if (period.includes('-')) {
    const parts = period.split('-');
    const monthNumber = parseInt(parts[1], 10);
    monthString = monthNames[monthNumber - 1] || 'jan';
  } else {
    // Fallback - try to find month name in period string
    const foundMonth = monthNames.find(month => period.toLowerCase().includes(month));
    monthString = foundMonth || 'jan';
  }

  const { data: transactions = [], isLoading } = useTransactionsByMonth(monthString);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
  };

  const handleDelete = (transactionId: number) => {
    setDeletingTransactionId(transactionId);
  };

  const handleSaveEdit = async (id: number, data: any) => {
    try {
      await updateTransaction.mutateAsync({ id, data });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleConfirmDelete = async (id: number) => {
    try {
      await deleteTransaction.mutateAsync(id);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
      setDeletingTransactionId(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Ensure transactions is always an array
  const transactionsArray = Array.isArray(transactions) ? transactions : [];
  const receitas = transactionsArray.filter(t => t.type === 'receita');
  const despesas = transactionsArray.filter(t => t.type === 'despesa');

  const totalReceitas = receitas.reduce((sum, t) => sum + (t.amount || t.value || 0), 0);
  const totalDespesas = despesas.reduce((sum, t) => sum + (t.amount || t.value || 0), 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <DialogTitle className="text-2xl font-bold text-[#121212]">
                Transações de {period}
              </DialogTitle>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-green-600">
                  Receitas: {formatCurrency(totalReceitas)}
                </span>
                <span className="text-red-600">
                  Despesas: {formatCurrency(totalDespesas)}
                </span>
                <span className="text-blue-600">
                  Saldo: {formatCurrency(totalReceitas - totalDespesas)}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

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
            ) : transactionsArray.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-[#64748B] text-lg font-medium">Nenhuma transação encontrada</p>
                <p className="text-sm text-[#64748B] mt-1">
                  Não há transações registradas neste período
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactionsArray.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.type === 'receita' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Tag className={`h-5 w-5 ${
                          transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#121212] truncate">
                            {transaction.description}
                          </h3>
                          {transaction.installments && transaction.installments > 1 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {transaction.installments}x
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-[#64748B]">
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span>{transaction.category}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(transaction.tx_date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'receita' ? '+' : '-'}{formatCurrency(transaction.amount || transaction.value)}
                        </p>
                        {transaction.installments && transaction.installments > 1 && (
                          <p className="text-sm text-[#64748B]">
                            {formatCurrency(transaction.installment_value || 0)} / parcela
                          </p>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(transaction)}
                          className="h-8 w-8 hover:bg-[#F8F9FA]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(transaction.id)}
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingTransactionId && (
        <DeleteTransactionDialog
          transactionId={deletingTransactionId}
          transactionDescription={transactionsArray.find(t => t.id === deletingTransactionId)?.description || ''}
          isOpen={!!deletingTransactionId}
          onClose={() => setDeletingTransactionId(null)}
          onDelete={handleConfirmDelete}
        />
      )}
    </>
  );
}
