
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartData } from "@/hooks/useFinancialData";

export function CashFlow() {
  const { data } = useChartData();
  const monthlyData = data?.monthlyData || [];

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
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="mes" 
                stroke="#64748B" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#64748B" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`} 
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
                dataKey="receitas" 
                stroke="#10B981" 
                strokeWidth={2} 
                name="Receitas"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="despesas" 
                stroke="#EF4444" 
                strokeWidth={2} 
                name="Despesas"
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
