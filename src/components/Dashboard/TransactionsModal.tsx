
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, TrendingUp, TrendingDown, CreditCard, Edit, Trash2 } from "lucide-react";
import { useTransactionsByMonth } from "@/hooks/useTransactionsByMonth";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteTransactionDialog } from "@/components/DeleteTransactionDialog";
import { useTransactionMutations } from "@/hooks/useTransactionMutations";
import { useQueryClient } from "@tanstack/react-query";

interface TransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
}

export function TransactionsModal({ isOpen, onClose, selectedMonth }: TransactionsModalProps) {
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { updateTransaction, deleteTransaction } = useTransactionMutations();

  const { data: transactions = [], isLoading } = useTransactionsByMonth(selectedMonth, isOpen);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
  };

  const handleDelete = (transactionId: number) => {
    setDeletingTransactionId(transactionId);
  };

  const handleSaveEdit = async (id: number, updates: any) => {
    try {
      await updateTransaction.mutateAsync({ id, updates });
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

  // Ordenar transações por data e tipo
  const sortedTransactions = [...transactions].sort((a, b) => {
    // Primeiro por data (mais recente primeiro)
    const dateA = new Date(a.tx_date).getTime();
    const dateB = new Date(b.tx_date).getTime();
    if (dateA !== dateB) return dateB - dateA;
    
    // Depois por tipo (receitas primeiro)
    if (a.type !== b.type) {
      return a.type === 'receita' ? -1 : 1;
    }
    
    // Por último por valor (maior primeiro)
    return Number(b.amount) - Number(a.amount);
  });

  const receitas = sortedTransactions.filter(t => t.type === 'receita');
  const despesas = sortedTransactions.filter(t => t.type === 'despesa');

  const totalReceitas = receitas.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalDespesas = despesas.reduce((sum, t) => sum + Number(t.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-white">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <DialogTitle className="text-xl font-bold text-[#121212]">
                Transações - {selectedMonth}
              </DialogTitle>
              <div className="flex gap-6 mt-2 text-sm">
                <span className="text-green-600 font-medium">
                  Receitas: {formatCurrency(totalReceitas)}
                </span>
                <span className="text-red-600 font-medium">
                  Despesas: {formatCurrency(totalDespesas)}
                </span>
                <span className={`font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  Saldo: {formatCurrency(saldo)}
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

          <div className="overflow-y-auto flex-1 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-[#64748B]">Carregando transações...</div>
              </div>
            ) : sortedTransactions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-[#64748B]">Nenhuma transação encontrada para este período</div>
              </div>
            ) : (
              <>
                {/* Receitas */}
                {receitas.length > 0 && (
                  <Card className="border-[#E2E8F0]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium text-[#61710C] flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Receitas ({receitas.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {receitas.map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-[#121212] truncate">
                                {transaction.description}
                              </p>
                              <div className="flex gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(transaction)}
                                  className="h-6 w-6 hover:bg-green-200"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(transaction.id)}
                                  className="h-6 w-6 hover:bg-red-200 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-[#64748B]">
                                {transaction.category} • {formatDate(transaction.tx_date)}
                              </p>
                              <div className="text-sm font-semibold text-[#61710C]">
                                +{formatCurrency(Number(transaction.amount))}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {transaction.is_recurring && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                  Recorrente
                                </span>
                              )}
                              {transaction.is_installment && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                  {transaction.installment_number}/{transaction.total_installments}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Despesas */}
                {despesas.length > 0 && (
                  <Card className="border-[#E2E8F0]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium text-[#EF4444] flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" />
                        Despesas ({despesas.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {despesas.map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-[#121212] truncate">
                                {transaction.description}
                              </p>
                              <div className="flex gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(transaction)}
                                  className="h-6 w-6 hover:bg-red-200"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(transaction.id)}
                                  className="h-6 w-6 hover:bg-red-200 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-[#64748B]">
                                {transaction.category} • {formatDate(transaction.tx_date)}
                              </p>
                              <div className="text-sm font-semibold text-[#EF4444]">
                                -{formatCurrency(Number(transaction.amount))}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {transaction.is_recurring && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                  Recorrente
                                </span>
                              )}
                              {transaction.is_installment && !transaction.is_credit_card_expense && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                  {transaction.installment_number}/{transaction.total_installments}
                                </span>
                              )}
                              {transaction.is_credit_card_expense && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  {transaction.total_installments > 1 ? `${transaction.installment_number}/${transaction.total_installments}` : 'Cartão'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
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
          transactionDescription={transactions.find(t => t.id === deletingTransactionId)?.description || ''}
          isOpen={!!deletingTransactionId}
          onClose={() => setDeletingTransactionId(null)}
          onDelete={handleConfirmDelete}
        />
      )}
    </>
  );
}
