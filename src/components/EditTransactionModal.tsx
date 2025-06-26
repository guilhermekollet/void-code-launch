
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { useCategories } from "@/hooks/useCategories";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string | null;
  category: string;
  tx_date: string;
}

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Transaction>) => void;
}

export function EditTransactionModal({ 
  transaction, 
  isOpen, 
  onClose,
  onSave
}: EditTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  const { data: categories = [] } = useCategories();

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setCategory(transaction.category);
      setAmount(transaction.amount.toFixed(2));
      setType(transaction.type || 'despesa');
      setDate(new Date(transaction.tx_date));
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction) return;

    const updates = {
      description,
      category,
      amount: parseFloat(amount),
      type,
      tx_date: date.toISOString(),
    };

    onSave(transaction.id, updates);
    onClose();
  };

  const handleClose = () => {
    onClose();
    setDescription('');
    setCategory('');
    setAmount('');
    setType('');
    setDate(new Date());
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-white border-[#DEDEDE] rounded-xl">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da transação"
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[#DEDEDE] shadow-lg z-50">
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[#DEDEDE] shadow-lg z-50">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <CurrencyInput
              id="amount"
              value={amount}
              onChange={setAmount}
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium block">Data da transação</Label>
            <DatePicker
              date={date}
              onDateChange={(newDate) => setDate(newDate || new Date())}
              placeholder="Selecionar data"
              className="h-10 w-full"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto h-10">
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto h-10">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
