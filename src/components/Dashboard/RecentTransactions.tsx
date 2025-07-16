
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { TransactionItem } from "@/components/Transactions/TransactionItem";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteTransactionDialog } from "@/components/DeleteTransactionDialog";
import { InstallmentDetailsModal } from "@/components/CreditCards/InstallmentDetailsModal";
import { useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactionMutations";
import { useInstallmentTransactions } from "@/hooks/useInstallmentTransactions";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useQueryClient } from "@tanstack/react-query";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string | null;
  category: string;
  tx_date: string;
  credit_card_id?: number;
  is_credit_card_expense?: boolean;
  installment_number?: number;
  total_installments?: number;
  is_agent?: boolean;
  is_recurring?: boolean;
  is_installment?: boolean;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  formatCurrency: (value: number) => string;
}

export function RecentTransactions({
  transactions,
  formatCurrency
}: RecentTransactionsProps) {
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<{ id: number; description: string } | null>(null);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Transaction | null>(null);
  
  const queryClient = useQueryClient();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();
  const { data: creditCards = [] } = useCreditCards();
  const { data: installmentTransactions = [] } = useInstallmentTransactions(
    selectedInstallment?.description || '',
    selectedInstallment?.total_installments || 0
  );

  const handleEdit = (transaction: Transaction) => {
    setEditTransaction(transaction);
  };

  const handleDelete = (transactionId: number, description: string) => {
    setDeleteTransaction({ id: transactionId, description });
  };

  const handleInstallmentDetails = (transaction: Transaction) => {
    setSelectedInstallment(transaction);
    setInstallmentModalOpen(true);
  };

  const handleSaveEdit = (id: number, data: Partial<Transaction>) => {
    updateTransactionMutation.mutate({ 
      id, 
      description: data.description,
      value: data.amount,
      category: data.category,
      tx_date: data.tx_date,
      type: data.type
    }, {
      onSuccess: () => {
        // Invalidate dashboard queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['financial-data'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        setEditTransaction(null);
      }
    });
  };

  const handleConfirmDelete = (id: number) => {
    deleteTransactionMutation.mutate(id, {
      onSuccess: () => {
        // Invalidate dashboard queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['financial-data'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        setDeleteTransaction(null);
      }
    });
  };

  const getCreditCardInfo = (creditCardId?: number) => {
    if (!creditCardId) return null;
    return creditCards.find(card => card.id === creditCardId);
  };

  if (transactions.length === 0) {
    return (
      <Card className="bg-white border-gray-200 animate-fade-in">
        <CardHeader>
          <CardTitle className="text-gray-900 text-xl font-medium">
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Receipt className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma transação encontrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border-gray-200 animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-900 text-xl font-medium">
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-3 p-6">
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onEdit={handleEdit}
                onDelete={handleDelete}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <EditTransactionModal
        transaction={editTransaction}
        isOpen={!!editTransaction}
        onClose={() => setEditTransaction(null)}
        onSave={handleSaveEdit}
      />

      <DeleteTransactionDialog
        transactionId={deleteTransaction?.id || null}
        transactionDescription={deleteTransaction?.description || ''}
        isOpen={!!deleteTransaction}
        onClose={() => setDeleteTransaction(null)}
        onDelete={handleConfirmDelete}
      />

      {selectedInstallment && (
        <InstallmentDetailsModal
          open={installmentModalOpen}
          onOpenChange={setInstallmentModalOpen}
          transactions={installmentTransactions}
          creditCardName={getCreditCardInfo(selectedInstallment.credit_card_id)?.card_name || getCreditCardInfo(selectedInstallment.credit_card_id)?.bank_name || 'Cartão'}
          creditCardColor={getCreditCardInfo(selectedInstallment.credit_card_id)?.color || '#e5e7eb'}
        />
      )}
    </>
  );
}
