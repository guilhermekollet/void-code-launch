
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartData } from "@/hooks/useFinancialData";
import { useReportsFutureData } from "@/hooks/useReportsFutureData";
import { TrendingUp, Calendar } from "lucide-react";

export function ExpenseTrends() {
  const [showFuture, setShowFuture] = useState(false);
  const { monthlyData } = useChartData();
  const { data: futureData = [] } = useReportsFutureData(showFuture);

  const trendsData = monthlyData.map(month => ({
    ...month,
    isFuture: false
  }));

  const combinedData = showFuture ? [...trendsData, ...futureData] : trendsData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-gray-900">Tendência de Gastos</CardTitle>
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
        <div className="h-80" data-chart="expense-trends">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedData}>
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
              <Area 
                type="monotone" 
                dataKey="despesas" 
                stackId="1" 
                stroke="#EF4444" 
                fill="#EF4444" 
                fillOpacity={showFuture ? 0.4 : 0.6}
                name="Despesas Totais"
              />
              <Area 
                type="monotone" 
                dataKey="gastosRecorrentes" 
                stackId="2" 
                stroke="#F59E0B" 
                fill="#F59E0B" 
                fillOpacity={showFuture ? 0.6 : 0.8}
                name="Gastos Recorrentes"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {showFuture && (
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Área mais clara indica projeção baseada em transações recorrentes e parceladas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
