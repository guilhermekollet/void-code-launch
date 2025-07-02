
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChartData, ChartType, TimeRange } from '../types';
import { useState } from 'react';
import { TransactionModal } from './TransactionModal';

interface ChartDisplayProps {
  data: ChartData[];
  futureData: ChartData[];
  chartType: ChartType;
  timeRange: TimeRange;
  onClose: () => void;
  onPeriodClick: (period: string) => void;
}

export function ChartDisplay({ 
  data, 
  futureData, 
  chartType, 
  timeRange, 
  onClose, 
  onPeriodClick 
}: ChartDisplayProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  
  const allData = [...data, ...futureData];
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltip = (value: number, name: string) => {
    return [formatCurrency(value), name === 'receitas' ? 'Receitas' : name === 'despesas' ? 'Despesas' : 'Saldo'];
  };

  const handlePointClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const period = data.activePayload[0].payload.period;
      setSelectedPeriod(period);
      setIsTransactionModalOpen(true);
      onPeriodClick(period);
    }
  };

  const currentData = data[data.length - 1];
  const previousData = data[data.length - 2];
  
  let trend = 0;
  let trendColor = "text-gray-500";
  let TrendIcon = TrendingUp;

  if (currentData && previousData) {
    const currentValue = chartType === 'receitas' ? currentData.receitas : 
                        chartType === 'despesas' ? currentData.despesas : currentData.saldo;
    const previousValue = chartType === 'receitas' ? previousData.receitas : 
                         chartType === 'despesas' ? previousData.despesas : previousData.saldo;
    
    if (previousValue !== 0) {
      trend = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
      
      if (chartType === 'despesas') {
        // Para despesas, crescimento é ruim (vermelho) e redução é bom (verde)
        trendColor = trend > 0 ? "text-red-500" : trend < 0 ? "text-green-500" : "text-gray-500";
        TrendIcon = trend > 0 ? TrendingUp : TrendingDown;
      } else {
        // Para receitas e saldo, crescimento é bom (verde) e redução é ruim (vermelho)
        trendColor = trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-gray-500";
        TrendIcon = trend > 0 ? TrendingUp : TrendingDown;
      }
    }
  }

  const getChartTitle = () => {
    switch (chartType) {
      case 'receitas':
        return 'Receitas';
      case 'despesas':
        return 'Despesas';
      case 'saldo':
        return 'Saldo';
      default:
        return 'Fluxo Financeiro';
    }
  };

  const getLineColor = () => {
    switch (chartType) {
      case 'receitas':
        return '#22c55e';
      case 'despesas':
        return '#ef4444';
      case 'saldo':
        return '#3b82f6';
      default:
        return '#3b82f6';
    }
  };

  const getCurrentValue = () => {
    if (!currentData) return 0;
    switch (chartType) {
      case 'receitas':
        return currentData.receitas;
      case 'despesas':
        return currentData.despesas;
      case 'saldo':
        return currentData.saldo;
      default:
        return 0;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-6xl h-[90vh] bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-2xl font-bold text-[#121212]">
                {getChartTitle()} - {timeRange === 'year' ? 'Anual' : 'Mensal'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#121212]">
                  {formatCurrency(getCurrentValue())}
                </span>
                {trend !== 0 && (
                  <Badge variant="outline" className={`${trendColor} border-current`}>
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {Math.abs(trend).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="h-[calc(100%-5rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={allData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                onClick={handlePointClick}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  labelStyle={{ color: '#121212' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <ReferenceLine x={data.length - 1} stroke="#94a3b8" strokeDasharray="2 2" />
                <Line
                  type="monotone"
                  dataKey={chartType}
                  stroke={getLineColor()}
                  strokeWidth={3}
                  dot={{ fill: getLineColor(), strokeWidth: 2, r: 6, cursor: 'pointer' }}
                  activeDot={{ r: 8, stroke: getLineColor(), strokeWidth: 2, cursor: 'pointer' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {selectedPeriod && (
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => {
            setIsTransactionModalOpen(false);
            setSelectedPeriod(null);
          }}
          period={selectedPeriod}
          timeRange={timeRange}
        />
      )}
    </>
  );
}
