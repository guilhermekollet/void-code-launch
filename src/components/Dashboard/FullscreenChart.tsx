
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { FullscreenChartProps, VisibleLines, ZoomDomain } from './FullscreenChart/types';
import { useFullscreenChartData } from './FullscreenChart/hooks/useChartData';
import { ChartControls } from './FullscreenChart/components/ChartControls';
import { TransactionsSidebar } from './FullscreenChart/components/TransactionsSidebar';

export function FullscreenChart({ isOpen, onClose }: FullscreenChartProps) {
  const [period, setPeriod] = useState('6');
  const [zoomDomain, setZoomDomain] = useState<ZoomDomain>({});
  const [showFuture, setShowFuture] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleLines, setVisibleLines] = useState<VisibleLines>({
    receitas: true,
    despesas: true,
    gastosRecorrentes: true,
    fluxoLiquido: true
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');

  const chartData = useFullscreenChartData(period, showFuture);

  const scrollLeft = () => {
    setScrollPosition(prev => Math.max(0, prev - 3));
  };

  const scrollRight = () => {
    const maxScroll = Math.max(0, chartData.length - 12);
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

  // Check if there are future transactions to show
  const hasFutureData = chartData.some(item => item.isFuture && (item.receitas > 0 || item.despesas > 0));

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (sidebarOpen) {
        setSidebarOpen(false);
      } else {
        onClose();
      }
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, sidebarOpen]);

  const showScrollControls = showFuture && chartData.length > 12;
  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < chartData.length - 12;

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
      const newEnd = Math.min(dataLength - 1, newStart + newRange);
      
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

  const toggleLine = (lineKey: keyof VisibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey]
    }));
  };

  const handlePointClick = (month: string) => {
    setSelectedMonth(month);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedMonth('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltip = (value: number, name: string) => {
    const nameMapping: Record<string, string> = {
      receitas: 'Receitas',
      despesas: 'Despesas',
      gastosRecorrentes: 'Gastos Recorrentes',
      fluxoLiquido: 'Saldo',
      faturas: 'Faturas'
    };
    return [formatCurrency(value), nameMapping[name] || name];
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 gap-0" hideCloseButton>
          <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0] flex-shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold text-[#121212]">Fluxo Financeiro</h2>
                {showFuture && !hasFutureData && (
                  <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                    Nenhuma transação futura encontrada
                  </div>
                )}
              </div>
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
            <div className="flex-shrink-0">
              <ChartControls
                period={period}
                setPeriod={setPeriod}
                showFuture={showFuture}
                setShowFuture={setShowFuture}
                scrollPosition={scrollPosition}
                scrollLeft={scrollLeft}
                scrollRight={scrollRight}
                canScrollLeft={canScrollLeft}
                canScrollRight={canScrollRight}
                showScrollControls={showScrollControls}
                handleZoomIn={handleZoomIn}
                handleZoomOut={handleZoomOut}
                resetZoom={resetZoom}
                visibleLines={visibleLines}
                toggleLine={toggleLine}
              />
            </div>

            {/* Chart - takes remaining height */}
            <div className="flex-1 min-h-0 p-4">
              <div className="h-full bg-white rounded-lg border border-gray-200">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={displayData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        const period = data.activePayload[0].payload.period || data.activePayload[0].payload.mes;
                        if (period) {
                          handlePointClick(period);
                        }
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="mes"
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
                    {futureStartIndex >= 0 && (
                      <ReferenceLine x={futureStartIndex} stroke="#94a3b8" strokeDasharray="2 2" />
                    )}
                    
                    {visibleLines.receitas && (
                      <Line
                        type="monotone"
                        dataKey="receitas"
                        stroke="#61710C"
                        strokeWidth={3}
                        name="Receitas"
                        dot={{ fill: '#61710C', strokeWidth: 2, r: 4, cursor: 'pointer' }}
                        activeDot={{ r: 8, stroke: '#61710C', strokeWidth: 2, cursor: 'pointer' }}
                      />
                    )}
                    
                    {visibleLines.despesas && (
                      <Line
                        type="monotone"
                        dataKey="despesas"
                        stroke="#EF4444"
                        strokeWidth={3}
                        name="Despesas"
                        dot={{ fill: '#EF4444', strokeWidth: 2, r: 4, cursor: 'pointer' }}
                        activeDot={{ r: 8, stroke: '#EF4444', strokeWidth: 2, cursor: 'pointer' }}
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
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3, cursor: 'pointer' }}
                        activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, cursor: 'pointer' }}
                      />
                    )}
                    
                    {visibleLines.fluxoLiquido && (
                      <Line
                        type="monotone"
                        dataKey="fluxoLiquido"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        name="Saldo"
                        dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3, cursor: 'pointer' }}
                        activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2, cursor: 'pointer' }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transactions Sidebar */}
      <TransactionsSidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        selectedMonth={selectedMonth}
      />
    </>
  );
}
