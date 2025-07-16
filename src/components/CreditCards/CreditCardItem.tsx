
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Edit, Trash2, CreditCard } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCurrentCreditCardBill } from '@/hooks/useCurrentCreditCardBill';
import { useCreditCardBillTransactions } from '@/hooks/useCreditCardBillTransactions';
import { EditCreditCardModal } from './EditCreditCardModal';
import { DeleteCreditCardDialog } from './DeleteCreditCardDialog';
import { CreditCardBillTransactionsModal } from './CreditCardBillTransactionsModal';
import { formatCurrency } from '@/lib/utils';

interface CreditCard {
  id: number;
  bank_name: string;
  card_name?: string;
  card_type: string;
  due_date: number;
  close_date?: number;
  color: string;
}

interface CreditCardItemProps {
  card: CreditCard;
}

export function CreditCardItem({ card }: CreditCardItemProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);

  const { data: currentBill } = useCurrentCreditCardBill(card.id);
  const { data: transactions = [] } = useCreditCardBillTransactions(currentBill?.id);

  const handleViewTransactions = () => {
    setShowTransactionsModal(true);
  };

  const displayName = card.card_name || `${card.bank_name} ${card.card_type}`;
  
  return (
    <>
      <Card className="overflow-hidden">
        <div 
          className="h-4 w-full" 
          style={{ background: card.color }}
        />
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-sm">{displayName}</h3>
                <p className="text-xs text-muted-foreground">{card.bank_name}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewTransactions}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver transações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vencimento:</span>
              <span>Dia {card.due_date}</span>
            </div>
            {card.close_date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fechamento:</span>
                <span>Dia {card.close_date}</span>
              </div>
            )}
            
            {currentBill && (
              <div className="mt-3 p-2 bg-muted rounded-md">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Fatura atual:</span>
                  <Badge variant={currentBill.status === 'paid' ? 'default' : 'secondary'}>
                    {formatCurrency(currentBill.remaining_amount)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditCreditCardModal
        card={card}
        open={showEditModal}
        onOpenChange={setShowEditModal}
      />

      <DeleteCreditCardDialog
        card={card}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />

      <CreditCardBillTransactionsModal
        open={showTransactionsModal}
        onOpenChange={setShowTransactionsModal}
        bill={currentBill}
        transactions={transactions}
        cardName={displayName}
      />
    </>
  );
}
