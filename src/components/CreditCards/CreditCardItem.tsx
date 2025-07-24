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
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-white border-0 shadow-md">
        {/* Credit Card Front - Layout Horizontal */}
        <div 
          className="relative h-40 p-4 text-white flex flex-col justify-between aspect-video rounded-lg"
          style={{ 
            background: cardColor.startsWith('linear-gradient') 
              ? cardColor 
              : `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`,
            backgroundSize: 'cover'
          }}
        >
          {/* Card Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 rounded-lg">
            <div className="absolute top-2 right-2 w-16 h-16 rounded-full border-2 border-white/20"></div>
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full border border-white/10"></div>
            <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full border border-white/15"></div>
          </div>

          {/* Top Section */}
          <div className="relative flex justify-between items-start">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" style={{ color: textColor }} />
              <span className="text-xs font-medium opacity-90" style={{ color: textColor }}>
                CARTÃO DE CRÉDITO
              </span>
            </div>
            <CardBrandLogo className="h-6 w-8" />
          </div>

          {/* Card Number */}
          <div className="relative">
            <p className="text-lg font-mono tracking-wider" style={{ color: textColor }}>
              {generateCardNumber(card.id)}
            </p>
          </div>

          {/* Bottom Section */}
          <div className="relative flex justify-between items-end">
            <div>
              <p className="text-xs opacity-75 uppercase tracking-wide" style={{ color: textColor }}>
                {cardName.toUpperCase()}
              </p>
              <p className="text-xs opacity-90" style={{ color: textColor }}>
                {card.bank_name.toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75" style={{ color: textColor }}>
                VENCE {String(card.due_date).padStart(2, '0')}/XX
              </p>
            </div>
          </div>
        </div>

        {/* Card Info Section */}
        <CardContent className="p-4 space-y-3 bg-gradient-to-br from-gray-50 to-white">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {card.close_date && (
              <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-blue-600 font-medium text-xs">Fechamento</p>
                <p className="text-blue-800 font-bold">{card.close_date}</p>
              </div>
            )}
            <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
              <p className="text-red-600 font-medium text-xs">Vencimento</p>
              <p className="text-red-800 font-bold">{card.due_date}</p>
            </div>
          </div>

          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <p className="text-green-700 text-xs font-medium mb-1">Gasto este mês</p>
            <p className="text-xl font-bold text-green-800">
              {formatCurrency(monthlySpent)}
            </p>
          </div>

          <Button
            onClick={() => setIsEditModalOpen(true)}
            variant="outline"
            size="sm"
            className="w-full bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Gerenciar Cartão
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