
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { FullscreenChartProps, VisibleLines, ZoomDomain } from './FullscreenChart/types';
import { useFullscreenChartData } from './FullscreenChart/hooks/useChartData';
import { ChartControls } from './FullscreenChart/components/ChartControls';
import { ChartDisplay } from './FullscreenChart/components/ChartDisplay';

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

  const chartData = useFullscreenChartData(period, showFuture);

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

  const showScrollControls = showFuture && chartData.length > 12;
  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < chartData.length - 12;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 gap-0" hideCloseButton>
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
            <h2 className="text-2xl font-semibold text-[#121212]">Fluxo Financeiro</h2>
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

          {/* Chart */}
          <ChartDisplay
            displayData={displayData}
            visibleLines={visibleLines}
            futureStartIndex={futureStartIndex}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
