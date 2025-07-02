
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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
                <div className="p-4 h-full">
                  <p className="text-center text-gray-500 py-8">
                    Gráfico de fluxo financeiro - Clique nos pontos para ver detalhes das transações
                  </p>
                </div>
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
