import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CreditCard, Eye } from "lucide-react";
import { useCreditCardTransactions } from "@/hooks/useCreditCards";
import { useState } from "react";
import { EditCreditCardModal } from "./EditCreditCardModal";
import { DeleteCreditCardDialog } from "./DeleteCreditCardDialog";
import { CreditCardBillTransactionsModal } from "./CreditCardBillTransactionsModal";
import { useCurrentCreditCardBill } from "@/hooks/useCurrentCreditCardBill";

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

const MastercardLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 32" fill="none">
    <circle cx="15" cy="16" r="12" fill="#EB001B"/>
    <circle cx="33" cy="16" r="12" fill="#F79E1B"/>
    <path d="M24 7.6c-2.7 2.1-4.4 5.4-4.4 9 0 3.6 1.7 6.9 4.4 9 2.7-2.1 4.4-5.4 4.4-9 0-3.6-1.7-6.9-4.4-9z" fill="#FF5F00"/>
  </svg>
);

const VisaLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 32" fill="none">
    <path d="M18.5 10h-3.2l-2 12h3.2l2-12zM31.1 10h-2.8c-.6 0-1.1.3-1.3.8l-4.6 11.2h3.4l.7-1.9h4.1l.4 1.9h3l-2.9-12zm-4.7 7.8l1.7-4.6.9 4.6h-2.6zM14.5 10L11.2 19l-.3-1.6c-.6-1.9-2.4-4-4.6-4.9L9.1 22h3.4l5.1-12h-3.1zM7.1 10H2.5l-.1.6c4.1 1 6.8 3.4 7.9 6.3L8.9 11c-.2-.7-.7-1-1.3-1h-.5z" fill="#1A1F71"/>
  </svg>
);

export function CreditCardItem({ card }: CreditCardItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const { data: transactions = [] } = useCreditCardTransactions(card.id);
  const { data: currentBill } = useCurrentCreditCardBill(card.id);

  const monthlySpent = transactions.reduce((sum, transaction) => sum + Number(transaction.value), 0);
  const cardName = card.card_name || card.bank_name;
  const cardColor = card.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const textColor = getContrastColor(cardColor.replace(/.*#([a-fA-F0-9]{6}).*/, '#$1') || '#667eea');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleViewTransactions = () => {
    setIsTransactionsModalOpen(true);
  };

  // Generate card number pattern
  const generateCardNumber = (cardId: number) => {
    const lastFour = String(cardId).padStart(4, '0').slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  };

  // Determine card brand logo based on card type
  const CardBrandLogo = card.card_type.toLowerCase().includes('visa') ? VisaLogo : MastercardLogo;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-lg">
        {/* Credit Card Front */}
        <div 
          className="relative h-56 p-6 text-white flex flex-col justify-between"
          style={{ 
            background: cardColor.startsWith('linear-gradient') 
              ? cardColor 
              : `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`,
            backgroundSize: 'cover'
          }}
        >
          {/* Card Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white/20"></div>
            <div className="absolute top-8 right-8 w-24 h-24 rounded-full border-2 border-white/10"></div>
            <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full border-2 border-white/15"></div>
          </div>

          {/* Top Section */}
          <div className="relative flex justify-between items-start">
            <div className="flex items-center gap-2">
              <CreditCard className="h-8 w-8" style={{ color: textColor }} />
              <span className="text-sm font-medium opacity-90" style={{ color: textColor }}>
                CARTÃO DE CRÉDITO
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/20 rounded-full"
                onClick={handleViewTransactions}
                title="Ver transações"
              >
                <Eye className="h-4 w-4" style={{ color: textColor }} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/20 rounded-full"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="h-4 w-4" style={{ color: textColor }} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/20 rounded-full"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" style={{ color: textColor }} />
              </Button>
            </div>
          </div>

          {/* Card Number */}
          <div className="relative">
            <p className="text-xl font-mono tracking-wider" style={{ color: textColor }}>
              {generateCardNumber(card.id)}
            </p>
          </div>

          {/* Bottom Section */}
          <div className="relative flex justify-between items-end">
            <div>
              <p className="text-xs opacity-75 uppercase tracking-wide" style={{ color: textColor }}>
                Portador
              </p>
              <p className="text-lg font-semibold" style={{ color: textColor }}>
                {cardName.toUpperCase()}
              </p>
              <p className="text-xs opacity-90" style={{ color: textColor }}>
                {card.bank_name.toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs opacity-75" style={{ color: textColor }}>
                  VENCE
                </p>
                <p className="text-sm font-mono" style={{ color: textColor }}>
                  {String(card.due_date).padStart(2, '0')}/XX
                </p>
              </div>
              <CardBrandLogo className="h-8 w-12" />
            </div>
          </div>
        </div>

        {/* Card Info Section */}
        <CardContent className="p-6 space-y-4 bg-gradient-to-br from-gray-50 to-white">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {card.close_date && (
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-blue-600 font-medium">Fecha dia</p>
                <p className="text-blue-800 font-bold text-lg">{card.close_date}</p>
              </div>
            )}
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-red-600 font-medium">Vence dia</p>
              <p className="text-red-800 font-bold text-lg">{card.due_date}</p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <p className="text-green-700 text-sm font-medium mb-1">Gasto este mês</p>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(monthlySpent)}
            </p>
          </div>

          <Button
            onClick={handleViewTransactions}
            variant="outline"
            size="sm"
            className="w-full bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Transações
          </Button>
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

      {currentBill && (
        <CreditCardBillTransactionsModal
          open={isTransactionsModalOpen}
          onOpenChange={setIsTransactionsModalOpen}
          bill={currentBill}
        />
      )}
    </>
  );
}