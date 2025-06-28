
import React, { useState } from 'react';
import { useCreditCards } from "@/hooks/useCreditCards";
import { CreditCardsList } from "@/components/CreditCards/CreditCardsList";
import { AddCreditCardModal } from "@/components/CreditCards/AddCreditCardModal";
import { EditCreditCardModal } from "@/components/CreditCards/EditCreditCardModal";
import { DeleteCreditCardDialog } from "@/components/CreditCards/DeleteCreditCardDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CreditCard } from "lucide-react";
import { CreditCard as CreditCardType } from "@/hooks/useCreditCards";

export default function Cartoes() {
  const { data: cards = [], isLoading } = useCreditCards();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [deletingCard, setDeletingCard] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleEditCard = (card: CreditCardType) => {
    setEditingCard(card);
  };

  const handleDeleteCard = (id: number, cardName: string) => {
    setDeletingCard({ id, name: cardName });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cartões de Crédito</h1>
          <p className="text-gray-600">
            {cards.length} {cards.length === 1 ? 'cartão cadastrado' : 'cartões cadastrados'}
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add Card Button */}
        <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200">
          <CardContent className="flex items-center justify-center h-48 p-6">
            <Button
              variant="ghost"
              className="h-full w-full flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsAddModalOpen(true)}
            >
              <div className="rounded-full bg-gray-100 p-4">
                <Plus className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium">Adicionar Cartão</span>
            </Button>
          </CardContent>
        </Card>

        {/* Credit Cards List */}
        <CreditCardsList
          cards={cards}
          onEdit={handleEditCard}
          onDelete={handleDeleteCard}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* Empty State */}
      {cards.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum cartão cadastrado
          </h3>
          <p className="text-gray-500 mb-6">
            Adicione seus cartões de crédito para ter um controle completo dos seus gastos.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Cartão
          </Button>
        </div>
      )}

      {/* Modals */}
      <AddCreditCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditCreditCardModal
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        card={editingCard}
      />

      <DeleteCreditCardDialog
        cardId={deletingCard?.id || null}
        cardName={deletingCard?.name || ''}
        isOpen={!!deletingCard}
        onClose={() => setDeletingCard(null)}
      />
    </div>
  );
}
