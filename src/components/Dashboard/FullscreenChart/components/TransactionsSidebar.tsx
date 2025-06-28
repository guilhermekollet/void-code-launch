
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { useTransactionsByMonth } from "@/hooks/useTransactionsByMonth";

interface TransactionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
}

export function TransactionsSidebar({ isOpen, onClose, selectedMonth }: TransactionsSidebarProps) {
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

  const receitas = transactions.filter(t => t.type === 'receita');
  const despesas = transactions.filter(t => t.type === 'despesa');

  if (!isOpen) return null;

  return (
    <div className={`fixed right-0 top-0 h-full w-96 bg-white border-l border-[#E2E8F0] shadow-lg z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
          <h3 className="text-lg font-semibold text-[#121212]">
            Transações - {selectedMonth}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-[#64748B]">Carregando transações...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-[#64748B]">Nenhuma transação encontrada</div>
            </div>
          ) : (
            <>
              {/* Receitas */}
              {receitas.length > 0 && (
                <Card className="border-[#E2E8F0]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#61710C] flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Receitas ({receitas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {receitas.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-start p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#121212] truncate">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            {transaction.category} • {formatDate(transaction.tx_date)}
                          </p>
                          {transaction.is_recurring && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                              Recorrente
                            </span>
                          )}
                          {transaction.is_installment && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                              {transaction.installment_number}/{transaction.total_installments}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-[#61710C] ml-2">
                          +{formatCurrency(Number(transaction.amount))}
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
                    <CardTitle className="text-sm font-medium text-[#EF4444] flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Despesas ({despesas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {despesas.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-start p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#121212] truncate">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            {transaction.category} • {formatDate(transaction.tx_date)}
                          </p>
                          {transaction.is_recurring && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                              Recorrente
                            </span>
                          )}
                          {transaction.is_installment && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                              {transaction.installment_number}/{transaction.total_installments}
                            </span>
                          )}
                          {transaction.is_credit_card_expense && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                              Cartão
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-[#EF4444] ml-2">
                          -{formatCurrency(Number(transaction.amount))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
