
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartData } from "@/hooks/useFinancialData";
import { useReportsFutureData } from "@/hooks/useReportsFutureData";
import { TrendingUp, Calendar } from "lucide-react";

export function CashFlow() {
  const [showFuture, setShowFuture] = useState(false);
  const { monthlyData } = useChartData();
  const { data: futureData = [] } = useReportsFutureData(showFuture);

  const cashFlowData = monthlyData.map(month => ({
    ...month,
    fluxo: month.receitas - month.despesas,
    isFuture: false
  }));

  const combinedData = showFuture ? [...cashFlowData, ...futureData] : cashFlowData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Separate data for historical and future
  const historicalData = combinedData.filter(item => !item.isFuture);
  const futureDataOnly = combinedData.filter(item => item.isFuture);

  return (
    <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-gray-900">Fluxo de Caixa</CardTitle>
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
        <div className="h-80" data-chart="cash-flow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData}>
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
              {/* Historical data line */}
              <Line 
                type="monotone" 
                dataKey="fluxo" 
                stroke="#61710C" 
                strokeWidth={3}
                name="Fluxo de Caixa"
                connectNulls={false}
                dot={{ fill: '#61710C', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#61710C', strokeWidth: 2 }}
              />
              {/* Future data line with dashed style */}
              {showFuture && (
                <Line 
                  type="monotone" 
                  dataKey="fluxo" 
                  stroke="#84CC16" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Fluxo de Caixa (Projeção)"
                  connectNulls={false}
                  dot={{ fill: '#84CC16', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#84CC16', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {showFuture && (
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Linha tracejada indica projeção baseada em transações recorrentes e parceladas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
