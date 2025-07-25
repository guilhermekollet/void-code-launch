
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Receipt, CreditCard, Repeat } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteTransactionDialog } from "@/components/DeleteTransactionDialog";
import { InstallmentDetailsModal } from "@/components/CreditCards/InstallmentDetailsModal";
import { useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactionMutations";
import { useInstallmentTransactions } from "@/hooks/useInstallmentTransactions";
import { useCreditCards } from "@/hooks/useCreditCards";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const isMobile = useIsMobile();
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<{ id: number; description: string } | null>(null);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Transaction | null>(null);
  
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
    });
    setEditTransaction(null);
  };

  const handleConfirmDelete = (id: number) => {
    deleteTransactionMutation.mutate(id);
    setDeleteTransaction(null);
  };

  const getCreditCardInfo = (creditCardId?: number) => {
    if (!creditCardId) return null;
    return creditCards.find(card => card.id === creditCardId);
  };

  const getContrastColor = (backgroundColor: string) => {
    if (!backgroundColor || backgroundColor === '#ffffff' || backgroundColor === 'white') {
      return '#000000';
    }
    return '#ffffff';
  };

  const getTypeColor = (type: string | null) => {
    switch (type) {
      case 'receita':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'despesa':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAmountColor = (type: string | null) => {
    return type === 'receita' ? 'text-green-600' : 'text-red-600';
  };

  if (transactions.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-[#121212]">
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-gray-500">
            Sem dados disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-[#121212]">
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {transactions.map((transaction) => {
            const creditCardInfo = getCreditCardInfo(transaction.credit_card_id);
            const isInstallment = transaction.total_installments && transaction.total_installments > 1;
            
            return (
              <div key={transaction.id} className="bg-white border border-[#E2E8F0] rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                      {transaction.is_agent && (
                        <Badge className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border-green-200">
                          Bolsofy AI
                        </Badge>
                      )}
                      {transaction.is_recurring && (
                        <Badge variant="outline" className="text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          Recorrente
                        </Badge>
                      )}
                      {isInstallment && (
                        <Badge 
                          variant="outline" 
                          className="text-xs cursor-pointer hover:bg-gray-50"
                          onClick={() => handleInstallmentDetails(transaction)}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          {transaction.installment_number}/{transaction.total_installments}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                      <span>{transaction.category}</span>
                      <span>•</span>
                      <span>{format(new Date(transaction.tx_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(transaction.type)}>
                        {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                      </Badge>
                      
                      {creditCardInfo && (
                        <Badge
                          className="text-xs px-2 py-0.5"
                          style={{
                            backgroundColor: creditCardInfo.color,
                            color: getContrastColor(creditCardInfo.color),
                            border: `1px solid ${creditCardInfo.color}`
                          }}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          {creditCardInfo.card_name || creditCardInfo.bank_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-semibold ${getAmountColor(transaction.type)}`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(transaction)}
                        className="h-8 w-8 p-0"
                        disabled={updateTransactionMutation.isPending}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(transaction.id, transaction.description)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deleteTransactionMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
