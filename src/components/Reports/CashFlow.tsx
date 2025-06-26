
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartData } from "@/hooks/useFinancialData";

export function CashFlow() {
  const { monthlyData } = useChartData();

  const cashFlowData = monthlyData.map(month => ({
    ...month,
    fluxo: month.receitas - month.despesas
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Fluxo de Caixa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80" data-chart="cash-flow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="mes"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis 
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={{ stroke: '#E2E8F0' }}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="fluxo" 
                stroke="#61710C" 
                strokeWidth={3}
                name="Fluxo de Caixa"
                dot={{ fill: '#61710C', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#61710C', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
