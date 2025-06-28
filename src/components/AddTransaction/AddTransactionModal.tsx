
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { CategoryDropdown } from "./CategoryDropdown";
import { CreditCardSection } from "./CreditCardSection";
import { useAddTransaction } from "@/hooks/useAddTransaction";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
  const [activeTab, setActiveTab] = useState<'receita' | 'despesa'>('despesa');
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringDate: '',
    isInstallment: false,
    totalInstallments: '',
    installmentStartDate: '',
    creditCardId: '',
    isInstallmentCreditCard: false,
    installmentBillingDate: '',
    installmentCreditCardCount: '',
  });

  const addTransactionMutation = useAddTransaction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare transaction data based on whether it's credit card or regular transaction
    const baseData = {
      amount: parseFloat(formData.amount),
      type: activeTab,
      category: formData.category,
      description: formData.description,
      tx_date: formData.date,
    };

    if (formData.creditCardId) {
      // Credit card transaction
      const transactionData = {
        ...baseData,
        credit_card_id: parseInt(formData.creditCardId),
        is_credit_card_expense: true,
        is_installment: formData.isInstallmentCreditCard,
        installment_billing_date: formData.isInstallmentCreditCard ? formData.installmentBillingDate : undefined,
        total_installments: formData.isInstallmentCreditCard ? parseInt(formData.installmentCreditCardCount) : undefined,
      };

      addTransactionMutation.mutate(transactionData, {
        onSuccess: () => {
          onClose();
          resetForm();
        },
      });
    } else {
      // Regular transaction (existing logic)
      const transactionData = {
        ...baseData,
        is_recurring: formData.isRecurring,
        recurring_date: formData.isRecurring ? parseInt(formData.recurringDate) : undefined,
        is_installment: formData.isInstallment,
        total_installments: formData.isInstallment ? parseInt(formData.totalInstallments) : undefined,
        installment_start_date: formData.isInstallment ? formData.installmentStartDate : undefined,
      };

      addTransactionMutation.mutate(transactionData, {
        onSuccess: () => {
          onClose();
          resetForm();
        },
      });
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringDate: '',
      isInstallment: false,
      totalInstallments: '',
      installmentStartDate: '',
      creditCardId: '',
      isInstallmentCreditCard: false,
      installmentBillingDate: '',
      installmentCreditCardCount: '',
    });
    setActiveTab('despesa');
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    const baseValid = formData.amount && formData.category && formData.description;
    
    if (formData.creditCardId && formData.isInstallmentCreditCard) {
      return baseValid && formData.installmentBillingDate && formData.installmentCreditCardCount;
    }
    
    if (formData.isRecurring) {
      return baseValid && formData.recurringDate;
    }
    
    if (formData.isInstallment) {
      return baseValid && formData.totalInstallments && formData.installmentStartDate;
    }
    
    return baseValid;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'receita' | 'despesa')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="receita" className="text-green-600 data-[state=active]:bg-green-50">
                Receita
              </TabsTrigger>
              <TabsTrigger value="despesa" className="text-red-600 data-[state=active]:bg-red-50">
                Despesa
              </TabsTrigger>
            </TabsList>

            <TabsContent value="receita" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>

              <CategoryDropdown
                value={formData.category}
                onChange={(value) => handleInputChange('category', value)}
              />

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição da receita"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => handleInputChange('isRecurring', checked)}
                />
                <Label htmlFor="recurring">Receita recorrente</Label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurring-date">Dia do mês para recorrência</Label>
                  <Input
                    id="recurring-date"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.recurringDate}
                    onChange={(e) => handleInputChange('recurringDate', e.target.value)}
                    placeholder="Ex: 15"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="despesa" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>

              <CategoryDropdown
                value={formData.category}
                onChange={(value) => handleInputChange('category', value)}
              />

              <CreditCardSection
                selectedCardId={formData.creditCardId}
                onCardChange={(cardId) => handleInputChange('creditCardId', cardId)}
                isInstallment={formData.isInstallmentCreditCard}
                onInstallmentChange={(isInstallment) => handleInputChange('isInstallmentCreditCard', isInstallment)}
                installmentDate={formData.installmentBillingDate}
                onInstallmentDateChange={(date) => handleInputChange('installmentBillingDate', date)}
                installmentCount={formData.installmentCreditCardCount}
                onInstallmentCountChange={(count) => handleInputChange('installmentCreditCardCount', count)}
                transactionAmount={parseFloat(formData.amount) || 0}
              />

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição da despesa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              {!formData.creditCardId && (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="recurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked) => handleInputChange('isRecurring', checked)}
                    />
                    <Label htmlFor="recurring">Despesa recorrente</Label>
                  </div>

                  {formData.isRecurring && (
                    <div className="space-y-2">
                      <Label htmlFor="recurring-date">Dia do mês para recorrência</Label>
                      <Input
                        id="recurring-date"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.recurringDate}
                        onChange={(e) => handleInputChange('recurringDate', e.target.value)}
                        placeholder="Ex: 15"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="installment"
                      checked={formData.isInstallment}
                      onCheckedChange={(checked) => handleInputChange('isInstallment', checked)}
                    />
                    <Label htmlFor="installment">Despesa parcelada</Label>
                  </div>

                  {formData.isInstallment && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="installment-start">Data de início</Label>
                        <Input
                          id="installment-start"
                          type="date"
                          value={formData.installmentStartDate}
                          onChange={(e) => handleInputChange('installmentStartDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="installments">Número de parcelas</Label>
                        <Input
                          id="installments"
                          type="number"
                          min="2"
                          value={formData.totalInstallments}
                          onChange={(e) => handleInputChange('totalInstallments', e.target.value)}
                          placeholder="Ex: 12"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid() || addTransactionMutation.isPending}
            >
              {addTransactionMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
