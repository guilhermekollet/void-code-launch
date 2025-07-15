
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Receipt, Edit, Trash2, MoreVertical } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteTransactionDialog } from "@/components/DeleteTransactionDialog";
import { useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactionMutations";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string | null;
  category: string;
  tx_date: string;
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
  
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const handleEdit = (transaction: Transaction) => {
    setEditTransaction(transaction);
  };

  const handleDelete = (transactionId: number, description: string) => {
    setDeleteTransaction({ id: transactionId, description });
  };

  const handleSaveEdit = (id: number, data: Partial<Transaction>) => {
    updateTransactionMutation.mutate({ id, data });
    setEditTransaction(null);
  };

  const handleConfirmDelete = (id: number) => {
    deleteTransactionMutation.mutate(id);
    setDeleteTransaction(null);
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
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {transacao.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transacao.category} • {new Date(transacao.tx_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${
                          isReceita ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {formatCurrency(Number(transacao.amount))}
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
                      <p className="font-medium text-gray-900 truncate">
                        {transacao.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transacao.category} • {new Date(transacao.tx_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <p className={`font-semibold ${
                      isReceita ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {formatCurrency(Number(transacao.amount))}
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
    </>
  );
}
