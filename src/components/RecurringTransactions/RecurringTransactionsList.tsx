import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Transaction {
  id: number;
  description: string;
  category: string;
  amount: number;
  recurring_date: number;
  is_recurring: boolean;
}

interface RecurringTransactionsListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function RecurringTransactionsList({ transactions, onEdit, onDelete }: RecurringTransactionsListProps) {
  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr className="border-b border-gray-100">
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Descrição</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Categoria</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Valor</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Dia da Cobrança</th>
              <th className="text-center py-4 px-4 font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr 
                key={transaction.id} 
                className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150 ${
                  index === transactions.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">
                    {transaction.description}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-50 text-blue-700 border-blue-200 font-medium"
                  >
                    {transaction.category}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <span className="text-red-600 font-semibold text-lg">
                    -R$ {Number(transaction.amount).toFixed(2)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#61710C] rounded-full"></div>
                    <span className="font-medium text-gray-700">Dia {transaction.recurring_date}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onEdit(transaction)}
                          className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Editar despesa
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onDelete(transaction)}
                          className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Excluir despesa
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {transactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex flex-col space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {transaction.description}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-50 text-blue-700 border-blue-200 font-medium"
                  >
                    {transaction.category}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-red-600 font-bold text-xl">
                    -R$ {Number(transaction.amount).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-[#61710C] rounded-full"></div>
                    <span>Dia {transaction.recurring_date}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEdit(transaction)}
                    className="h-10 w-10 p-0 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDelete(transaction)}
                    className="h-10 w-10 p-0 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
