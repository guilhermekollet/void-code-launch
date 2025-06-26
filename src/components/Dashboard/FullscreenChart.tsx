
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { X, ZoomIn, ZoomOut, RotateCcw, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useChartData, useTransactions } from "@/hooks/useFinancialData";

interface FullscreenChartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenChart({ isOpen, onClose }: FullscreenChartProps) {
  const [period, setPeriod] = useState('6');
  const [zoomDomain, setZoomDomain] = useState<{ start?: number; end?: number }>({});
  const [showFuture, setShowFuture] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleLines, setVisibleLines] = useState({
    receitas: true,
    despesas: true,
    gastosRecorrentes: true,
    fluxoLiquido: true
  });

  const { monthlyData: originalData } = useChartData();
  const { data: transactions = [] } = useTransactions();

  // Calculate future installments data
  const futureData = useMemo(() => {
    if (!showFuture) return [];

    const currentDate = new Date();
    const futureMonths: any[] = [];
    
    // Get installment transactions that have future payments
    const installmentTransactions = transactions.filter(t => 
      t.is_installment && 
      t.installment_number && 
      t.total_installments &&
      t.installment_number < t.total_installments
    );

    // Calculate up to 24 months in the future
    for (let i = 1; i <= 24; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      
      let futureReceitas = 0;
      let futureDespesas = 0;
      let futureGastosRecorrentes = 0;

      // Calculate future installments for this month
      installmentTransactions.forEach(transaction => {
        const startDate = new Date(transaction.installment_start_date || transaction.tx_date);
        const monthsFromStart = Math.floor((futureDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        if (monthsFromStart >= 0 && monthsFromStart < (transaction.total_installments || 0)) {
          const amount = Number(transaction.amount);
          if (transaction.type === 'receita') {
            futureReceitas += amount;
          } else if (transaction.type === 'despesa') {
            futureDespesas += amount;
            if (transaction.is_recurring) {
              futureGastosRecorrentes += amount;
            }
          }
        }
      });

      if (futureReceitas > 0 || futureDespesas > 0) {
        futureMonths.push({
          mes: futureDate.toLocaleDateString('pt-BR', { month: 'short' }),
          receitas: futureReceitas,
          despesas: futureDespesas,
          gastosRecorrentes: futureGastosRecorrentes,
          fluxoLiquido: futureReceitas - futureDespesas,
          isFuture: true
        });
      }
    }

    // Stop when we have 6 consecutive months with no data
    let emptyMonths = 0;
    return futureMonths.filter((month, index) => {
      if (month.receitas === 0 && month.despesas === 0) {
        emptyMonths++;
      } else {
        emptyMonths = 0;
      }
      return emptyMonths < 6;
    });
  }, [showFuture, transactions]);

  // Expand data based on selected period and future toggle
  const chartData = useMemo(() => {
    const months = parseInt(period);
    const expandedData = Array.from({ length: months }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const existingData = originalData.find(d => d.mes === date.toLocaleDateString('pt-BR', { month: 'short' }));
      
      return existingData || {
        mes: date.toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: 0,
        despesas: 0,
        gastosRecorrentes: 0,
        isFuture: false
      };
    }).reverse();

    // Add flow liquid calculation
    const dataWithFlow = expandedData.map(item => ({
      ...item,
      fluxoLiquido: item.receitas - item.despesas
    }));

    // Combine with future data if enabled
    if (showFuture && futureData.length > 0) {
      return [...dataWithFlow, ...futureData];
    }

    return dataWithFlow;
  }, [period, originalData, showFuture, futureData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleZoomIn = () => {
    const dataLength = chartData.length;
    const currentStart = zoomDomain.start || 0;
    const currentEnd = zoomDomain.end || dataLength - 1;
    const range = currentEnd - currentStart;
    
    if (range > 2) {
      const newRange = Math.max(2, Math.floor(range * 0.7));
      const center = (currentStart + currentEnd) / 2;
      setZoomDomain({
        start: Math.max(0, Math.floor(center - newRange / 2)),
        end: Math.min(dataLength - 1, Math.floor(center + newRange / 2))
      });
    }
  };

  const handleZoomOut = () => {
    const dataLength = chartData.length;
    const currentStart = zoomDomain.start || 0;
    const currentEnd = zoomDomain.end || dataLength - 1;
    const range = currentEnd - currentStart;
    
    if (range < dataLength - 1) {
      const newRange = Math.min(dataLength - 1, Math.ceil(range * 1.4));
      const center = (currentStart + currentEnd) / 2;
      const newStart = Math.max(0, Math.floor(center - newRange / 2));
      const newEnd = Math.min(dataLength - 1, Math.floor(center + newRange / 2));
      
      setZoomDomain({
        start: newStart,
        end: newEnd
      });
    }
  };

  const resetZoom = () => {
    setZoomDomain({});
    setScrollPosition(0);
  };

  const toggleLine = (lineKey: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey]
    }));
  };

  const scrollLeft = () => {
    setScrollPosition(prev => Math.max(0, prev - 3));
  };

  const scrollRight = () => {
    const maxScroll = Math.max(0, chartData.length - 6);
    setScrollPosition(prev => Math.min(maxScroll, prev + 3));
  };

  const displayData = useMemo(() => {
    let data = chartData;
    
    // Apply scroll position for horizontal navigation
    if (showFuture && chartData.length > 12) {
      const startIndex = scrollPosition;
      const endIndex = Math.min(chartData.length, scrollPosition + 12);
      data = chartData.slice(startIndex, endIndex);
    }
    
    // Apply zoom if set
    if (zoomDomain.start !== undefined || zoomDomain.end !== undefined) {
      const start = zoomDomain.start || 0;
      const end = (zoomDomain.end || data.length - 1) + 1;
      data = data.slice(start, end);
    }
    
    return data;
  }, [chartData, zoomDomain, scrollPosition, showFuture]);

  // Find the index where future data starts for background differentiation
  const futureStartIndex = displayData.findIndex(item => item.isFuture);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 gap-0" hideCloseButton>
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
            <h2 className="text-2xl font-semibold text-[#121212]">Fluxo Financeiro - Tela Cheia</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 p-4 border-b border-[#E2E8F0] bg-gray-50">
            {/* Period Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Período:</span>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#E2E8F0] shadow-lg z-50">
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                  <SelectItem value="24">2 anos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Future Toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="showFuture"
                checked={showFuture}
                onCheckedChange={setShowFuture}
              />
              <label htmlFor="showFuture" className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Ver Futuro
              </label>
            </div>

            {/* Navigation Controls for Future Data */}
            {showFuture && chartData.length > 12 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Navegação:</span>
                <Button size="sm" variant="outline" onClick={scrollLeft} disabled={scrollPosition === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={scrollRight} disabled={scrollPosition >= chartData.length - 12}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Zoom:</span>
              <Button size="sm" variant="outline" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={resetZoom}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Line Toggles */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium">Linhas:</span>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="receitas"
                  checked={visibleLines.receitas}
                  onCheckedChange={() => toggleLine('receitas')}
                />
                <label htmlFor="receitas" className="text-sm flex items-center gap-1">
                  <div className="w-3 h-3 bg-[#61710C] rounded-full"></div>
                  Receitas
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="despesas"
                  checked={visibleLines.despesas}
                  onCheckedChange={() => toggleLine('despesas')}
                />
                <label htmlFor="despesas" className="text-sm flex items-center gap-1">
                  <div className="w-3 h-3 bg-[#EF4444] rounded-full"></div>
                  Despesas
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gastosRecorrentes"
                  checked={visibleLines.gastosRecorrentes}
                  onCheckedChange={() => toggleLine('gastosRecorrentes')}
                />
                <label htmlFor="gastosRecorrentes" className="text-sm flex items-center gap-1">
                  <div className="w-3 h-3 bg-[#3B82F6] rounded-full"></div>
                  Gastos Recorrentes
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fluxoLiquido"
                  checked={visibleLines.fluxoLiquido}
                  onCheckedChange={() => toggleLine('fluxoLiquido')}
                />
                <label htmlFor="fluxoLiquido" className="text-sm flex items-center gap-1">
                  <div className="w-3 h-3 bg-[#8B5CF6] rounded-full"></div>
                  Fluxo Líquido
                </label>
              </div>
            </div>
          </div>

          {/* Chart */}
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
                        strokeDasharray={displayData.some(d => d.isFuture) ? "0" : undefined}
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
                {showFuture && futureData.length > 0 && (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
