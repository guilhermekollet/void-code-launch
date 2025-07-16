
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Repeat, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string | null;
  category: string;
  tx_date: string;
  is_recurring?: boolean;
  is_installment?: boolean;
  installment_number?: number;
  total_installments?: number;
  is_agent?: boolean;
}

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number, description: string) => void;
  formatCurrency: (value: number) => string;
}

export function TransactionItem({ transaction, onEdit, onDelete, formatCurrency }: TransactionItemProps) {
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

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 hover:shadow-md transition-shadow">
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
            {transaction.is_installment && (
              <Badge variant="outline" className="text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                {transaction.installment_number}/{transaction.total_installments}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{transaction.category}</span>
            <span>•</span>
            <span>{format(new Date(transaction.tx_date), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getTypeColor(transaction.type)}>
              {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
            </Badge>
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
              onClick={() => onEdit(transaction)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(transaction.id, transaction.description)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
