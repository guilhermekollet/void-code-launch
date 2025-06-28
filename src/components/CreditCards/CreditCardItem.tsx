
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CreditCard } from "lucide-react";
import { useCreditCardTransactions } from "@/hooks/useCreditCards";
import { useState } from "react";
import { EditCreditCardModal } from "./EditCreditCardModal";
import { DeleteCreditCardDialog } from "./DeleteCreditCardDialog";

interface CreditCardItemProps {
  card: {
    id: number;
    bank_name: string;
    card_name: string | null;
    close_date: number | null;
    due_date: number;
    card_type: string;
    color: string;
  };
}

const getContrastColor = (backgroundColor: string) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export function CreditCardItem({ card }: CreditCardItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { data: transactions = [] } = useCreditCardTransactions(card.id);

  const monthlySpent = transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const cardName = card.card_name || card.bank_name;
  const cardColor = card.color || '#e5e7eb';
  const textColor = getContrastColor(cardColor);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-white border-[#E2E8F0]">
        {/* Banner colorido - 30% do card */}
        <div 
          className="h-20 flex items-center justify-between px-4"
          style={{ backgroundColor: cardColor }}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6" style={{ color: textColor }} />
            <span className="font-medium text-sm" style={{ color: textColor }}>
              {card.card_type}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-black/10"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-4 w-4" style={{ color: textColor }} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-black/10"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" style={{ color: textColor }} />
            </Button>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-[#121212] text-lg">{cardName}</h3>
            <p className="text-sm text-[#64748B]">{card.bank_name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {card.close_date && (
              <div>
                <p className="text-[#64748B]">Fecha dia</p>
                <p className="font-medium text-[#121212]">{card.close_date}</p>
              </div>
            )}
            <div>
              <p className="text-[#64748B]">Vence dia</p>
              <p className="font-medium text-[#121212]">{card.due_date}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0]">
            <p className="text-sm text-[#64748B]">Gasto este mês</p>
            <p className="text-xl font-bold text-[#121212]">
              {formatCurrency(monthlySpent)}
            </p>
          </div>
        </CardContent>
      </Card>

      <EditCreditCardModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        card={card}
      />

      <DeleteCreditCardDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        card={card}
      />
    </>
  );
}
