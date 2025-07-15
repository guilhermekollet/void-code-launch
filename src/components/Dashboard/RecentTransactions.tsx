
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Receipt, Edit, Trash2, MoreVertical, CreditCard } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteTransactionDialog } from "@/components/DeleteTransactionDialog";
import { InstallmentDetailsModal } from "@/components/CreditCards/InstallmentDetailsModal";
import { useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactionMutations";
import { useInstallmentTransactions } from "@/hooks/useInstallmentTransactions";
import { useCreditCards } from "@/hooks/useCreditCards";

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

  if (transactions.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
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
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-900 text-xl font-medium">
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {transactions.map((transacao, index) => {
              const isReceita = transacao.type === 'receita';
              const isLast = index === transactions.length - 1;
              const creditCardInfo = getCreditCardInfo(transacao.credit_card_id);
              const isInstallment = transacao.total_installments && transacao.total_installments > 1;
              
              if (isMobile) {
                return (
                  <div key={transacao.id} className={`p-4 ${!isLast ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isReceita ? 'bg-green-50' : 'bg-gray-50'
                        }`}>
                          {isReceita ? 
                            <ArrowUp className="h-4 w-4 text-green-600" /> : 
                            <ArrowDown className="h-4 w-4 text-gray-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {transacao.description}
                            </p>
                            {transacao.is_agent && (
                              <Badge className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border-green-200">
                                Bolsofy AI
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{transacao.category}</span>
                            <span>•</span>
                            <span>{new Date(transacao.tx_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
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
                            {isInstallment && (
                              <Badge
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-gray-50"
                                onClick={() => handleInstallmentDetails(transacao)}
                              >
                                {transacao.installment_number}/{transacao.total_installments}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${
                          isReceita ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {formatCurrency(Math.abs(Number(transacao.amount)))}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(transacao)}>
                              <Edit className="h-3 w-3 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(transacao.id, transacao.description)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              }

              // Layout desktop
              return (
                <div key={transacao.id} className={`flex items-center justify-between p-4 hover:bg-gray-25 transition-colors ${!isLast ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isReceita ? 'bg-green-50' : 'bg-gray-50'
                    }`}>
                      {isReceita ? 
                        <ArrowUp className="h-4 w-4 text-green-600" /> : 
                        <ArrowDown className="h-4 w-4 text-gray-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {transacao.description}
                        </p>
                        {transacao.is_agent && (
                          <Badge className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border-green-200">
                            Bolsofy AI
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{transacao.category}</span>
                        <span>•</span>
                        <span>{new Date(transacao.tx_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
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
                        {isInstallment && (
                          <Badge
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-gray-50"
                            onClick={() => handleInstallmentDetails(transacao)}
                          >
                            {transacao.installment_number}/{transacao.total_installments}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <p className={`font-semibold ${
                      isReceita ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {formatCurrency(Math.abs(Number(transacao.amount)))}
                    </p>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(transacao)}
                        className="h-7 w-7 p-0 hover:bg-gray-100"
                        disabled={updateTransactionMutation.isPending}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(transacao.id, transacao.description)}
                        className="h-7 w-7 p-0 hover:bg-gray-100 hover:text-red-600"
                        disabled={deleteTransactionMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
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
