import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialMetrics } from "@/hooks/useFinancialData";
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from "lucide-react";
export function FinancialSummary() {
  const {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyRecurringExpenses
  } = useFinancialMetrics();
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const monthlyNet = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? monthlyNet / monthlyIncome * 100 : 0;
  const cards = [{
    title: "Saldo Total",
    value: formatCurrency(totalBalance),
    icon: DollarSign,
    color: totalBalance >= 0 ? "text-green-600" : "text-red-600"
  }, {
    title: "Receitas do Mês",
    value: formatCurrency(monthlyIncome),
    icon: TrendingUp,
    color: "text-green-600"
  }, {
    title: "Despesas do Mês",
    value: formatCurrency(monthlyExpenses),
    icon: TrendingDown,
    color: "text-red-600"
  }, {
    title: "Gastos Recorrentes",
    value: formatCurrency(monthlyRecurringExpenses),
    icon: CreditCard,
    color: "text-orange-600"
  }];
  return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => <Card key={index} className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Resultado do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(monthlyNet)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Poupança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {savingsRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">% Gastos Recorrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              {monthlyExpenses > 0 ? (monthlyRecurringExpenses / monthlyExpenses * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}