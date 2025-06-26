
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ChartDataPoint, VisibleLines } from '../types';

interface ChartDisplayProps {
  displayData: ChartDataPoint[];
  visibleLines: VisibleLines;
  futureStartIndex: number;
}

export function ChartDisplay({ displayData, visibleLines, futureStartIndex }: ChartDisplayProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="flex-1 p-4">
      <Card className="h-full border-[#E2E8F0]">
        <CardContent className="p-4 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              
              {/* Background differentiation for future data */}
              {futureStartIndex > 0 && (
                <ReferenceLine 
                  x={displayData[futureStartIndex]?.mes} 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              )}
              
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
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  color: '#121212'
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name
                ]}
                labelFormatter={(label) => {
                  const dataPoint = displayData.find(d => d.mes === label);
                  return `${label}${dataPoint?.isFuture ? ' (Projeção)' : ''}`;
                }}
              />
              
              {visibleLines.receitas && (
                <Line
                  type="monotone"
                  dataKey="receitas"
                  stroke="#61710C"
                  strokeWidth={3}
                  name="Receitas"
                  dot={(props) => {
                    const { payload } = props;
                    return (
                      <circle
                        {...props}
                        fill={payload.isFuture ? "#61710C80" : "#61710C"}
                        strokeWidth={2}
                        r={4}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#61710C' }}
                />
              )}
              
              {visibleLines.despesas && (
                <Line
                  type="monotone"
                  dataKey="despesas"
                  stroke="#EF4444"
                  strokeWidth={3}
                  name="Despesas"
                  dot={(props) => {
                    const { payload } = props;
                    return (
                      <circle
                        {...props}
                        fill={payload.isFuture ? "#EF444480" : "#EF4444"}
                        strokeWidth={2}
                        r={4}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#EF4444' }}
                />
              )}
              
              {visibleLines.gastosRecorrentes && (
                <Line
                  type="monotone"
                  dataKey="gastosRecorrentes"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Gastos Recorrentes"
                  dot={(props) => {
                    const { payload } = props;
                    return (
                      <circle
                        {...props}
                        fill={payload.isFuture ? "#3B82F680" : "#3B82F6"}
                        strokeWidth={2}
                        r={3}
                      />
                    );
                  }}
                  activeDot={{ r: 5, fill: '#3B82F6' }}
                />
              )}
              
              {visibleLines.fluxoLiquido && (
                <Line
                  type="monotone"
                  dataKey="fluxoLiquido"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  name="Fluxo Líquido"
                  dot={(props) => {
                    const { payload } = props;
                    return (
                      <circle
                        {...props}
                        fill={payload.isFuture ? "#8B5CF680" : "#8B5CF6"}
                        strokeWidth={2}
                        r={4}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#8B5CF6' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          
          {/* Future data legend */}
          {displayData.some(d => d.isFuture) && (
            <div className="absolute top-4 right-4 bg-white border border-[#E2E8F0] rounded-lg p-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <div className="w-3 h-0.5 bg-[#F59E0B]"></div>
                <span>Dados Projetados</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
