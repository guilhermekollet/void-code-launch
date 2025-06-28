
import React from 'react';
import { CreditCardItem } from './CreditCardItem';
import { CreditCard } from "@/hooks/useCreditCards";

interface CreditCardsListProps {
  cards: CreditCard[];
  onEdit: (card: CreditCard) => void;
  onDelete: (id: number, cardName: string) => void;
  formatCurrency: (value: number) => string;
}

export function CreditCardsList({ cards, onEdit, onDelete, formatCurrency }: CreditCardsListProps) {
  if (cards.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 text-center">
        <p className="text-gray-500">Nenhum cartão de crédito encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <CreditCardItem
          key={card.id}
          card={card}
          onEdit={onEdit}
          onDelete={onDelete}
          formatCurrency={formatCurrency}
        />
      ))}
    </div>
  );
}
