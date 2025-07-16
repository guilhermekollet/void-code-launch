
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IOSSwitch } from "@/components/ui/ios-switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { CategoryDropdown } from "./CategoryDropdown";
import { CreditCardDropdown } from "@/components/CreditCards/CreditCardDropdown";
import { InstallmentSelect } from "./InstallmentSelect";
import { useAddTransaction } from "@/hooks/useAddTransaction";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useLastUsedCreditCard, useUpdateLastUsedCreditCard } from "@/hooks/useLastUsedCreditCard";

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
  
  // Credit card related states
  const [isCreditCardExpense, setIsCreditCardExpense] = useState(false);
  const [selectedCreditCard, setSelectedCreditCard] = useState('');
  const [creditCardInstallments, setCreditCardInstallments] = useState('1');
  
  const addTransaction = useAddTransaction();
  const { data: creditCards = [] } = useCreditCards();
  const { data: lastUsedCard } = useLastUsedCreditCard();
  const updateLastUsedCard = useUpdateLastUsedCreditCard();

  // Auto-select credit card logic
  useEffect(() => {
    if (isCreditCardExpense && creditCards.length > 0) {
      if (creditCards.length === 1) {
        // If only one card, select it automatically
        setSelectedCreditCard(creditCards[0].id.toString());
      } else if (lastUsedCard && !selectedCreditCard) {
        // If multiple cards and last used exists, select it
        setSelectedCreditCard(lastUsedCard.id.toString());
      }
    }
  }, [isCreditCardExpense, creditCards, lastUsedCard, selectedCreditCard]);

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
      setIsCreditCardExpense(false);
      setSelectedCreditCard('');
      setCreditCardInstallments('1');
    }
  }, [open]);

  const handleCategoryAdded = (categoryName: string) => {
    setCategory(categoryName);
  };

  const handleSave = () => {
    if (!amount) return;

    const baseData = {
      amount: parseFloat(amount),
      type,
      category: category || 'Outros',
      description: description || 'Sem descrição',
      tx_date: date.toISOString(),
      ...(isCreditCardExpense && selectedCreditCard && {
        is_credit_card_expense: true,
        credit_card_id: parseInt(selectedCreditCard),
        installments: parseInt(creditCardInstallments),
        installment_value: parseFloat(amount) / parseInt(creditCardInstallments)
      })
    };

    // Create the final transaction object with all necessary properties
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
        // Update last used credit card
        if (isCreditCardExpense && selectedCreditCard) {
          updateLastUsedCard.mutate(parseInt(selectedCreditCard));
        }
        onOpenChange(false);
      }
    });
  };

  const isFormValid = amount && 
    (!isRecurring || (isRecurring && recurringDate)) && 
    (!isInstallment || (isInstallment && totalInstallments && installmentStartDate)) &&
    (!isCreditCardExpense || (isCreditCardExpense && selectedCreditCard));

  const parsedAmount = parseFloat(amount) || 0;

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
                <TabsTrigger 
                  value="despesa" 
                  className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700 data-[state=inactive]:border data-[state=inactive]:border-[#DEDEDE] h-9"
                >
                  Despesa
                </TabsTrigger>
                <TabsTrigger 
                  value="receita" 
                  className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=inactive]:border data-[state=inactive]:border-[#DEDEDE] h-9"
                >
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

              {/* Credit Card Switch - only for expenses */}
              {type === 'despesa' && (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label htmlFor="credit-card" className="text-sm font-medium">Compra no cartão</Label>
                    <span className="text-xs text-gray-500">Despesa feita no cartão de crédito</span>
                  </div>
                  <IOSSwitch 
                    id="credit-card" 
                    checked={isCreditCardExpense} 
                    onCheckedChange={setIsCreditCardExpense} 
                  />
                </div>
              )}

              {/* Credit Card Selection */}
              {type === 'despesa' && isCreditCardExpense && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cartão de crédito</Label>
                    <CreditCardDropdown
                      value={selectedCreditCard}
                      onChange={setSelectedCreditCard}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Número de parcelas</Label>
                    <InstallmentSelect
                      value={creditCardInstallments}
                      onChange={setCreditCardInstallments}
                      amount={parsedAmount}
                    />
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium block">Data da transação</Label>
                <DatePicker
                  date={date}
                  onDateChange={(newDate) => setDate(newDate || new Date())}
                  placeholder="Selecionar data"
                  className="h-10 w-full"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categoria</Label>
                <CategoryDropdown 
                  value={category} 
                  onChange={setCategory}
                  onCategoryAdded={handleCategoryAdded}
                />
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
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Advanced Options for Expenses - only show if not credit card expense */}
              {type === 'despesa' && !isCreditCardExpense && (
                <div className="space-y-5 border-t border-[#DEDEDE] pt-5">
                  <h3 className="text-sm font-medium text-gray-700">Opções Avançadas</h3>
                  
                  {/* Recurring Expense */}
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
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  )}

                  {/* Installment Expense */}
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
                          style={{ fontSize: '16px' }}
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
                          style={{ fontSize: '16px' }}
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
              backgroundColor: '#61710C',
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
