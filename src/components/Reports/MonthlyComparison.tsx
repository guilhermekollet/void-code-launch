
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useChartData } from "@/hooks/useFinancialData";
import { useReportsFutureData } from "@/hooks/useReportsFutureData";
import { TrendingUp, Calendar } from "lucide-react";

export function MonthlyComparison() {
  const [showFuture, setShowFuture] = useState(false);
  const { data } = useChartData();
  const { data: futureData } = useReportsFutureData();
  
  const monthlyData = data?.monthlyData || [];

  const comparisonData = monthlyData.map(month => ({
    ...month,
    isFuture: false
  }));

  const combinedData = showFuture && futureData ? [...comparisonData, futureData.nextMonth, futureData.monthAfterNext].filter(Boolean) : comparisonData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-gray-900">Comparação Mensal</CardTitle>
        <Button
          variant={showFuture ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFuture(!showFuture)}
          className="h-8 px-3 text-xs"
        >
          <Calendar className="w-3 h-3 mr-1" />
          {showFuture ? 'Ocultar Projeção' : 'Ver Projeção'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-80" data-chart="monthly-comparison">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={combinedData}>
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
                labelFormatter={(label, payload) => {
                  const isFuture = payload?.[0]?.payload?.isFuture;
                  return `${label}${isFuture ? ' (Projeção)' : ''}`;
                }}
              />
              <Legend />
              <Bar 
                dataKey="receitas" 
                fill={showFuture ? "#86EFAC" : "#22C55E"}
                name="Receitas" 
                radius={[2, 2, 0, 0]}
                fillOpacity={showFuture ? 0.7 : 1}
              />
              <Bar 
                dataKey="despesas" 
                fill={showFuture ? "#FCA5A5" : "#EF4444"}
                name="Despesas" 
                radius={[2, 2, 0, 0]}
                fillOpacity={showFuture ? 0.7 : 1}
              />
              <Bar 
                dataKey="gastosRecorrentes" 
                fill={showFuture ? "#FDE68A" : "#F59E0B"}
                name="Gastos Recorrentes" 
                radius={[2, 2, 0, 0]}
                fillOpacity={showFuture ? 0.7 : 1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {showFuture && (
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Barras mais claras indicam projeção baseada em transações recorrentes e parceladas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
