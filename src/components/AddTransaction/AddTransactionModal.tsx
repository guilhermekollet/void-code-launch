import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IOSSwitch } from "@/components/ui/ios-switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { CategoryDropdown } from "./CategoryDropdown";
import { useAddTransaction } from "@/hooks/useAddTransaction";

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransactionModal({
  open,
  onOpenChange
}: AddTransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDate, setRecurringDate] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('');
  const [installmentStartDate, setInstallmentStartDate] = useState('');
  
  const addTransaction = useAddTransaction();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAmount('');
      setType('despesa');
      setCategory('');
      setDescription('');
      setDate(new Date());
      setIsRecurring(false);
      setRecurringDate('');
      setIsInstallment(false);
      setTotalInstallments('');
      setInstallmentStartDate('');
    }
  }, [open]);

  const handleSave = () => {
    if (!amount) return;

    const baseData = {
      amount: parseFloat(amount),
      type,
      category: category || 'Outros',
      description: description || 'Sem descrição',
      tx_date: date.toISOString()
    };

    // Criar o objeto final com todas as propriedades necessárias
    const transactionData = {
      ...baseData,
      ...(type === 'despesa' && isRecurring && recurringDate && {
        is_recurring: true,
        recurring_date: parseInt(recurringDate)
      }),
      ...(type === 'despesa' && isInstallment && totalInstallments && installmentStartDate && {
        is_installment: true,
        total_installments: parseInt(totalInstallments),
        installment_start_date: installmentStartDate
      })
    };

    addTransaction.mutate(transactionData, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const isFormValid = amount && 
    (!isRecurring || (isRecurring && recurringDate)) && 
    (!isInstallment || (isInstallment && totalInstallments && installmentStartDate));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto p-0 rounded-xl max-h-[90vh] flex flex-col bg-white border-[#DEDEDE]">
        {/* Fixed Header */}
        <div className="p-6 pb-4 flex-shrink-0 border-b border-[#DEDEDE]">
          <h2 className="text-2xl font-semibold text-gray-900">
            Nova Transação
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Adicione uma nova receita ou despesa
          </p>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Type Tabs */}
            <Tabs value={type} onValueChange={value => setType(value as 'receita' | 'despesa')}>
              <TabsList className="grid w-full grid-cols-2 h-11">
                <TabsTrigger value="despesa" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700 h-9">
                  Despesa
                </TabsTrigger>
                <TabsTrigger value="receita" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 h-9">
                  Receita
                </TabsTrigger>
              </TabsList>
              <TabsContent value="despesa" className="mt-4" />
              <TabsContent value="receita" className="mt-4" />
            </Tabs>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Valor *</Label>
                <CurrencyInput
                  id="amount"
                  value={amount}
                  onChange={setAmount}
                  autoFocus
                  className="h-10"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data da transação</Label>
                <DatePicker
                  date={date}
                  onDateChange={(newDate) => setDate(newDate || new Date())}
                  placeholder="Selecionar data"
                  className="h-10"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categoria</Label>
                <CategoryDropdown value={category} onChange={setCategory} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
                <Input 
                  id="description" 
                  placeholder="Descrição da transação" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="h-10" 
                />
              </div>

              {/* Opções para Despesas */}
              {type === 'despesa' && (
                <div className="space-y-5 border-t border-[#DEDEDE] pt-5">
                  <h3 className="text-sm font-medium text-gray-700">Opções Avançadas</h3>
                  
                  {/* Gasto Recorrente */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <Label htmlFor="recurring" className="text-sm font-medium">Gasto Recorrente</Label>
                      <span className="text-xs text-gray-500">Repetir mensalmente</span>
                    </div>
                    <IOSSwitch 
                      id="recurring" 
                      checked={isRecurring} 
                      onCheckedChange={setIsRecurring} 
                    />
                  </div>

                  {isRecurring && (
                    <div className="space-y-2 pl-4 border-l-2 border-green-200">
                      <Label htmlFor="recurringDate" className="text-sm font-medium">Dia da cobrança mensal</Label>
                      <Input 
                        id="recurringDate" 
                        type="number" 
                        min="1" 
                        max="31" 
                        placeholder="Dia (1-31)" 
                        value={recurringDate} 
                        onChange={e => setRecurringDate(e.target.value)} 
                        className="h-10" 
                      />
                    </div>
                  )}

                  {/* Despesa Parcelada */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <Label htmlFor="installment" className="text-sm font-medium">Despesa Parcelada</Label>
                      <span className="text-xs text-gray-500">Dividir em parcelas</span>
                    </div>
                    <IOSSwitch 
                      id="installment" 
                      checked={isInstallment} 
                      onCheckedChange={setIsInstallment} 
                    />
                  </div>

                  {isInstallment && (
                    <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                      <div className="space-y-2">
                        <Label htmlFor="installmentStartDate" className="text-sm font-medium">Data de início</Label>
                        <Input 
                          id="installmentStartDate" 
                          type="date" 
                          value={installmentStartDate} 
                          onChange={e => setInstallmentStartDate(e.target.value)} 
                          className="h-10" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalInstallments" className="text-sm font-medium">Número de parcelas</Label>
                        <Input 
                          id="totalInstallments" 
                          type="number" 
                          min="2" 
                          placeholder="Ex: 12" 
                          value={totalInstallments} 
                          onChange={e => setTotalInstallments(e.target.value)} 
                          className="h-10" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Fixed Action Button */}
        <div className="p-6 pt-4 flex-shrink-0 border-t border-[#DEDEDE]">
          <Button 
            onClick={handleSave} 
            disabled={!isFormValid || addTransaction.isPending} 
            className="w-full h-12 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
            style={{
              background: 'linear-gradient(135deg, #61710C 0%, #84CC16 100%)',
              color: '#CFF500',
              border: 'none'
            }}
          >
            {addTransaction.isPending ? 'Salvando...' : 'Salvar Transação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
