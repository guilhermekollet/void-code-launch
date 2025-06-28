
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCreditCards } from "@/hooks/useCreditCards";

interface CreditCardSectionProps {
  selectedCardId: string;
  onCardChange: (cardId: string) => void;
  isInstallment: boolean;
  onInstallmentChange: (isInstallment: boolean) => void;
  installmentDate: string;
  onInstallmentDateChange: (date: string) => void;
  installmentCount: string;
  onInstallmentCountChange: (count: string) => void;
  transactionAmount: number;
}

export function CreditCardSection({
  selectedCardId,
  onCardChange,
  isInstallment,
  onInstallmentChange,
  installmentDate,
  onInstallmentDateChange,
  installmentCount,
  onInstallmentCountChange,
  transactionAmount,
}: CreditCardSectionProps) {
  const { data: cards = [] } = useCreditCards();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const installmentValue = transactionAmount && installmentCount ? 
    transactionAmount / parseInt(installmentCount) : 0;

  if (cards.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Cartão de Crédito</Label>
        <p className="text-sm text-gray-500">
          Nenhum cartão cadastrado. Cadastre um cartão na seção "Cartões" para usar esta funcionalidade.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Cartão de Crédito</Label>
        <Select value={selectedCardId} onValueChange={onCardChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cartão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhum cartão</SelectItem>
            {cards.map((card) => (
              <SelectItem key={card.id} value={card.id.toString()}>
                {card.card_name || card.bank_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCardId && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Switch
              id="installment-mode"
              checked={isInstallment}
              onCheckedChange={onInstallmentChange}
            />
            <Label htmlFor="installment-mode">Despesa parcelada</Label>
          </div>

          {isInstallment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="installment-date">Data de Cobrança</Label>
                <Input
                  id="installment-date"
                  type="date"
                  value={installmentDate}
                  onChange={(e) => onInstallmentDateChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="installment-count">Número de Parcelas</Label>
                <Input
                  id="installment-count"
                  type="number"
                  min="2"
                  max="60"
                  value={installmentCount}
                  onChange={(e) => onInstallmentCountChange(e.target.value)}
                  placeholder="Ex: 12"
                  required
                />
              </div>

              {installmentCount && transactionAmount && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Valor por parcela:</strong> {formatCurrency(installmentValue)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {installmentCount}x de {formatCurrency(installmentValue)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
