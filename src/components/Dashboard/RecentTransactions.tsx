import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, ArrowUp, ArrowDown, Receipt, Edit, Trash2, MoreVertical } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteTransactionDialog } from "@/components/DeleteTransactionDialog";

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

  const handleEdit = (transaction: Transaction) => {
    setEditTransaction(transaction);
  };

  const handleDelete = (transactionId: number, description: string) => {
    setDeleteTransaction({ id: transactionId, description });
  };

  const handleSaveEdit = (id: number, updates: Partial<Transaction>) => {
    console.log('Salvando edição da transação:', id, updates);
    // TODO: Implementar lógica de edição
  };

  const handleConfirmDelete = (id: number) => {
    console.log('Removendo transação:', id);
    // TODO: Implementar lógica de remoção
  };

  if (transactions.length === 0) {
    return (
      <Card className="bg-white border-[#E2E8F0]">
        <CardHeader>
          <CardTitle className="text-[#121212] text-2xl font-semibold">
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-[#64748B] mx-auto mb-4" />
            <p className="text-[#64748B]">Nenhuma transação encontrada</p>
            <p className="text-sm text-[#64748B] mt-2">Suas transações aparecerão aqui</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border-[#E2E8F0]">
        <CardHeader>
          <CardTitle className="text-[#121212] text-2xl font-semibold">
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map(transacao => {
              const isReceita = transacao.type === 'receita';
              
              if (isMobile) {
                return (
                  <div key={transacao.id} className="p-4 bg-white rounded-lg border border-[#E2E8F0] space-y-3">
                    {/* Header com valor e ações */}
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-full ${isReceita ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {isReceita ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-lg ${isReceita ? 'text-green-600' : 'text-red-600'}`}>
                          {isReceita ? '+' : '-'} {formatCurrency(Number(transacao.amount))}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
                            <DropdownMenuItem onClick={() => handleEdit(transacao)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(transacao.id, transacao.description)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {/* Descrição */}
                    <div>
                      <p className="font-medium text-[#121212] text-base">{transacao.description}</p>
                    </div>
                    
                    {/* Meta informações */}
                    <div className="flex items-center justify-between text-sm text-[#64748B]">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(transacao.tx_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{transacao.category}</span>
                        <span>•</span>
                        <span>{isReceita ? 'Entrada' : 'Saída'}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Layout desktop
              return (
                <div key={transacao.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#E2E8F0] hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isReceita ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isReceita ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-[#121212]">{transacao.description}</p>
                      <p className="text-sm text-[#64748B] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {transacao.category} • {new Date(transacao.tx_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-bold text-lg ${isReceita ? 'text-green-600' : 'text-red-600'}`}>
                        {isReceita ? '+' : '-'} {formatCurrency(Number(transacao.amount))}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        <DollarSign className="h-3 w-3 text-[#64748B]" />
                        <span className="text-xs text-[#64748B]">
                          {isReceita ? 'Entrada' : 'Saída'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(transacao)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(transacao.id, transacao.description)}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
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
