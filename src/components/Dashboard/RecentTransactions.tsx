
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string;
  category: string;
  tx_date: string;
  is_recurring: boolean;
  is_installment: boolean;
  installment_number?: number;
  total_installments?: number;
  credit_card_id?: number;
  is_credit_card_expense: boolean;
  is_agent: boolean;
  registered_at: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  formatCurrency: (value: number) => string;
}

export function RecentTransactions({ transactions, formatCurrency }: RecentTransactionsProps) {
  return (
    <Card className="bg-white border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-gray-800 text-lg font-semibold">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'receita' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'receita' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">
                        {transaction.description || 'Sem descrição'}
                      </p>
                      {transaction.is_agent && (
                        <Badge 
                          variant="outline" 
                          className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5"
                        >
                          Bolsofy AI
                        </Badge>
                      )}
                      {transaction.is_recurring && (
                        <Badge variant="outline" className="text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          Recorrente
                        </Badge>
                      )}
                      {transaction.is_installment && transaction.installment_number && transaction.total_installments && (
                        <Badge variant="outline" className="text-xs">
                          {transaction.installment_number}/{transaction.total_installments}x
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{transaction.category}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(transaction.tx_date), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${
                    transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'receita' ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhuma transação encontrada</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
