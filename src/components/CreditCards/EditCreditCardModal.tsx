
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateCreditCard } from "@/hooks/useCreditCardMutations";
import { CreditCard } from "@/hooks/useCreditCards";

interface EditCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
}

const cardColors = [
  { name: 'Azul Moderno', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Laranja-Amarelo', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Branco', value: '#ffffff' },
  { name: 'Preto Carbon', value: '#2c3e50' },
  { name: 'Verde', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Vermelho', value: 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)' },
  { name: 'Rosa', value: 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)' },
  { name: 'Roxo', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
];

export function EditCreditCardModal({ isOpen, onClose, card }: EditCreditCardModalProps) {
  const [formData, setFormData] = useState({
    bank_name: '',
    card_name: '',
    close_date: '',
    due_date: '',
    card_type: 'Outro' as 'VISA' | 'Mastercard' | 'Outro',
    color: cardColors[0].value,
  });

  const updateCreditCardMutation = useUpdateCreditCard();

  useEffect(() => {
    if (card) {
      setFormData({
        bank_name: card.bank_name,
        card_name: card.card_name || '',
        close_date: card.close_date ? card.close_date.toString() : '',
        due_date: card.due_date.toString(),
        card_type: card.card_type,
        color: card.color,
      });
    }
  }, [card]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!card) return;

    const updates = {
      bank_name: formData.bank_name,
      card_name: formData.card_name || undefined,
      close_date: formData.close_date ? parseInt(formData.close_date) : undefined,
      due_date: parseInt(formData.due_date),
      card_type: formData.card_type,
      color: formData.color,
    };

    updateCreditCardMutation.mutate({ id: card.id, updates }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Cartão de Crédito</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Nome do Banco *</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => handleInputChange('bank_name', e.target.value)}
              placeholder="Ex: Nubank, Bradesco..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card_name">Nome do Cartão</Label>
            <Input
              id="card_name"
              value={formData.card_name}
              onChange={(e) => handleInputChange('card_name', e.target.value)}
              placeholder="Ex: Cartão Roxinho, Gold..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="close_date">Dia que Fecha</Label>
              <Input
                id="close_date"
                type="number"
                min="1"
                max="31"
                value={formData.close_date}
                onChange={(e) => handleInputChange('close_date', e.target.value)}
                placeholder="Ex: 15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Dia que Vence *</Label>
              <Input
                id="due_date"
                type="number"
                min="1"
                max="31"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                placeholder="Ex: 20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo do Cartão</Label>
            <Select value={formData.card_type} onValueChange={(value) => handleInputChange('card_type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VISA">VISA</SelectItem>
                <SelectItem value="Mastercard">Mastercard</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cor do Cartão</Label>
            <div className="grid grid-cols-4 gap-2">
              {cardColors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  className={`h-10 rounded-md border-2 ${
                    formData.color === color.value ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  style={{ background: color.value }}
                  onClick={() => handleInputChange('color', color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateCreditCardMutation.isPending}>
              {updateCreditCardMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
