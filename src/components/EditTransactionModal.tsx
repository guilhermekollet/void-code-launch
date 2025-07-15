
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { useUpdateTransaction } from "@/hooks/useTransactionMutations";
import { useCategoriesByType } from "@/hooks/useCategoriesByType";
import { useCreditCards } from "@/hooks/useCreditCards";

interface Transaction {
  id: number;
  description: string;
  value: number;
  category: string;
  tx_date: string;
  credit_card_id?: number | null;
  type: string;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export function EditTransactionModal({ isOpen, onClose, transaction }: EditTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [date, setDate] = useState<Date>(new Date());
  const [creditCardId, setCreditCardId] = useState<string>('');

  const updateTransaction = useUpdateTransaction();
  const { data: categories = [] } = useCategoriesByType(type);
  const { data: creditCards = [] } = useCreditCards();

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || '');
      setAmount(Math.abs(transaction.value)); // Always show positive value for editing
      setCategory(transaction.category);
      setType(transaction.type as 'receita' | 'despesa');
      setDate(new Date(transaction.tx_date));
      setCreditCardId(transaction.credit_card_id ? transaction.credit_card_id.toString() : '');
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction) return;

    try {
      // Process amount based on type
      const processedAmount = type === 'despesa' ? -Math.abs(amount) : Math.abs(amount);
      
      // Convert creditCardId string to number or null for the database
      const creditCardIdValue = creditCardId ? parseInt(creditCardId, 10) : null;
      
      await updateTransaction.mutateAsync({
        id: transaction.id,
        description,
        value: processedAmount,
        category,
        tx_date: date.toISOString(),
        credit_card_id: creditCardIdValue,
        type
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da transação"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(value: 'receita' | 'despesa') => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Valor</Label>
            <CurrencyInput
              value={amount}
              onValueChange={setAmount}
              placeholder="R$ 0,00"
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === 'despesa' && (
            <div>
              <Label htmlFor="creditCard">Cartão de Crédito (Opcional)</Label>
              <Select 
                value={creditCardId} 
                onValueChange={setCreditCardId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cartão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum cartão</SelectItem>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id.toString()}>
                      {card.bank_name} - {card.card_name || 'Cartão'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="date">Data</Label>
            <DatePicker
              date={date}
              onDateChange={(newDate) => newDate && setDate(newDate)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateTransaction.isPending}>
              {updateTransaction.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
