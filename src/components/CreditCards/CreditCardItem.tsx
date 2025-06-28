
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, CreditCard } from "lucide-react";
import { CreditCard as CreditCardType } from "@/hooks/useCreditCards";
import { useCreditCardExpenses } from "@/hooks/useCreditCards";

interface CreditCardItemProps {
  card: CreditCardType;
  onEdit: (card: CreditCardType) => void;
  onDelete: (id: number, cardName: string) => void;
  formatCurrency: (value: number) => string;
}

export function CreditCardItem({ card, onEdit, onDelete, formatCurrency }: CreditCardItemProps) {
  const { data: monthlyExpense = 0 } = useCreditCardExpenses(card.id);

  const getCardIcon = () => {
    switch (card.card_type) {
      case 'VISA':
        return <span className="text-white font-bold text-sm">VISA</span>;
      case 'Mastercard':
        return <span className="text-white font-bold text-sm">Mastercard</span>;
      default:
        return <CreditCard className="w-4 h-4 text-white" />;
    }
  };

  const formatDate = (day: number) => {
    return `Dia ${day}`;
  };

  return (
    <Card className="bg-white border border-[#E2E8F0] hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-0">
        {/* Banner colorido */}
        <div 
          className="h-16 rounded-t-lg flex items-center justify-between px-4"
          style={{ background: card.color }}
        >
          <div className="flex items-center gap-2">
            {getCardIcon()}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(card)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(card.id, card.card_name || card.bank_name)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Conteúdo do cartão */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {card.card_name || card.bank_name}
          </h3>
          
          <div className="space-y-1 text-sm text-gray-600 mb-3">
            {card.close_date && (
              <p>Fecha: {formatDate(card.close_date)}</p>
            )}
            <p>Vence: {formatDate(card.due_date)}</p>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm text-gray-500 mb-1">Gasto este mês</p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(monthlyExpense)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
