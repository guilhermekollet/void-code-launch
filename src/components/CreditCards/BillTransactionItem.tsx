
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Calendar, Tag } from "lucide-react";
import { useState } from "react";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteTransactionDialog } from "@/components/DeleteTransactionDialog";
import { useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactionMutations";
import { useQueryClient } from "@tanstack/react-query";

interface Transaction {
  id: number;
  amount: number;
  description: string;
  category: string;
  tx_date: string;
  type?: string;
  installments?: number;
  installment_value?: number;
}

interface BillTransactionItemProps {
  transaction: Transaction;
  onUpdate: () => void;
}

export function BillTransactionItem({ transaction, onUpdate }: BillTransactionItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const deleteTransaction = useDeleteTransaction();
  const updateTransaction = useUpdateTransaction();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isInstallment = transaction.installments && transaction.installments > 1;

  const handleDelete = async (id: number) => {
    try {
      await deleteTransaction.mutateAsync(id);
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: ['credit-card-bill-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      onUpdate();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleSave = async (id: number, updates: Partial<Transaction>) => {
    try {
      await updateTransaction.mutateAsync({ 
        id, 
        description: updates.description,
        value: updates.amount,
        category: updates.category,
        tx_date: updates.tx_date,
        type: updates.type
      });
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: ['credit-card-bill-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills-new'] });
      onUpdate();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow border border-[#E2E8F0]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-12 h-12 bg-[#F8F9FA] rounded-full flex items-center justify-center">
                <Tag className="h-5 w-5 text-[#64748B]" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[#121212] truncate">
                    {transaction.description}
                  </h3>
                  {isInstallment && (
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
                <p className="font-bold text-lg text-[#121212]">
                  {formatCurrency(transaction.amount)}
                </p>
                {isInstallment && (
                  <p className="text-sm text-[#64748B]">
                    {formatCurrency(transaction.installment_value || 0)} / parcela
                  </p>
                )}
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditModalOpen(true)}
                  className="h-8 w-8 hover:bg-[#F8F9FA]"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditTransactionModal
        transaction={{
          ...transaction,
          value: transaction.amount,
          type: transaction.type || 'despesa'
        }}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <DeleteTransactionDialog
        transactionId={transaction.id}
        transactionDescription={transaction.description}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDelete}
      />
    </>
  );
}
