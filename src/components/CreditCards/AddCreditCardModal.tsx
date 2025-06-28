
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useAddCreditCard } from "@/hooks/useCreditCardMutations";

interface AddCreditCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const cardColors = [
  { name: 'Azul Escuro', value: '#1e3a8a' },
  { name: 'Laranja', value: '#ea580c' },
  { name: 'Branco', value: '#ffffff' },
  { name: 'Preto Carbon', value: '#171717' },
  { name: 'Verde', value: '#16a34a' },
  { name: 'Vermelho', value: '#dc2626' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Roxo', value: '#7c3aed' },
];

export function AddCreditCardModal({ open, onOpenChange }: AddCreditCardModalProps) {
  const [bankName, setBankName] = useState('');
  const [cardName, setCardName] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [cardType, setCardType] = useState<'VISA' | 'Mastercard' | 'Outro'>('Outro');
  const [selectedColor, setSelectedColor] = useState('#e5e7eb');

  const addCreditCard = useAddCreditCard();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bankName.trim() || !dueDate) {
      return;
    }

    addCreditCard.mutate({
      bank_name: bankName.trim(),
      card_name: cardName.trim() || undefined,
      close_date: closeDate ? parseInt(closeDate) : undefined,
      due_date: parseInt(dueDate),
      card_type: cardType,
      color: selectedColor,
    }, {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      }
    });
  };

  const resetForm = () => {
    setBankName('');
    setCardName('');
    setCloseDate('');
    setDueDate('');
    setCardType('Outro');
    setSelectedColor('#e5e7eb');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#121212]">Adicionar Cartão de Crédito</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName" className="text-[#121212]">Nome do Banco *</Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Ex: Nubank, Inter, Itaú..."
              required
              className="border-[#E2E8F0] focus:border-[#61710C]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardName" className="text-[#121212]">Nome do Cartão (opcional)</Label>
            <Input
              id="cardName"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Ex: Gold, Platinum, Black..."
              className="border-[#E2E8F0] focus:border-[#61710C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="closeDate" className="text-[#121212]">Data que fecha (opcional)</Label>
              <Input
                id="closeDate"
                type="number"
                min="1"
                max="31"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                placeholder="Ex: 15"
                className="border-[#E2E8F0] focus:border-[#61710C]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-[#121212]">Data que vence *</Label>
              <Input
                id="dueDate"
                type="number"
                min="1"
                max="31"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="Ex: 10"
                required
                className="border-[#E2E8F0] focus:border-[#61710C]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#121212]">Tipo do Cartão</Label>
            <Select value={cardType} onValueChange={(value: 'VISA' | 'Mastercard' | 'Outro') => setCardType(value)}>
              <SelectTrigger className="border-[#E2E8F0] focus:border-[#61710C]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="VISA">VISA</SelectItem>
                <SelectItem value="Mastercard">Mastercard</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[#121212]">Cor do Cartão</Label>
            <div className="grid grid-cols-4 gap-3">
              {cardColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`h-12 rounded-lg border-2 transition-all ${
                    selectedColor === color.value 
                      ? 'border-[#61710C] scale-105' 
                      : 'border-[#E2E8F0] hover:border-[#61710C]'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${
                        color.value === '#ffffff' || color.value === '#e5e7eb' 
                          ? 'bg-[#61710C]' 
                          : 'bg-white'
                      }`} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-[#E2E8F0] text-[#64748B] hover:bg-[#F8F9FA]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addCreditCard.isPending}
              className="flex-1 bg-[#61710C] hover:bg-[#4F5A0A] text-white"
            >
              {addCreditCard.isPending ? 'Salvando...' : 'Salvar Cartão'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
