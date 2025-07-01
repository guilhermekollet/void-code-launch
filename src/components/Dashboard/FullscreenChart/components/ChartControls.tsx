
import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { IOSSwitch } from "@/components/ui/ios-switch";
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { VisibleLines } from '../types';

interface ChartControlsProps {
  period: string;
  setPeriod: (value: string) => void;
  showFuture: boolean;
  setShowFuture: (value: boolean) => void;
  scrollPosition: number;
  scrollLeft: () => void;
  scrollRight: () => void;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  showScrollControls: boolean;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  resetZoom: () => void;
  visibleLines: VisibleLines;
  toggleLine: (line: keyof VisibleLines) => void;
}

export function ChartControls({
  period,
  setPeriod,
  showFuture,
  setShowFuture,
  scrollPosition,
  scrollLeft,
  scrollRight,
  canScrollLeft,
  canScrollRight,
  showScrollControls,
  handleZoomIn,
  handleZoomOut,
  resetZoom,
  visibleLines,
  toggleLine
}: ChartControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 border-b border-[#E2E8F0] bg-gray-50">
      {/* Period Control */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Período:</span>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-[#E2E8F0] shadow-lg z-50">
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="3">3 meses</SelectItem>
            <SelectItem value="6">6 meses</SelectItem>
            <SelectItem value="12">1 ano</SelectItem>
            <SelectItem value="24">2 anos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Future Toggle Switch */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Futuro:</span>
        <IOSSwitch
          checked={showFuture}
          onCheckedChange={setShowFuture}
        />
      </div>

      {/* Navigation Controls for Future Data */}
      {showScrollControls && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Navegação:</span>
          <Button size="sm" variant="outline" onClick={scrollLeft} disabled={!canScrollLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={scrollRight} disabled={!canScrollRight}>
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
            onCheckedChange={(checked) => toggleLine('receitas')}
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
            onCheckedChange={(checked) => toggleLine('despesas')}
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
            onCheckedChange={(checked) => toggleLine('gastosRecorrentes')}
          />
          <label htmlFor="gastosRecorrentes" className="text-sm flex items-center gap-1">
            <div className="w-3 h-3 bg-[#3B82F6] rounded-full"></div>
            Gastos Recorrentes
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="faturas"
            checked={visibleLines.faturas}
            onCheckedChange={(checked) => toggleLine('faturas')}
          />
          <label htmlFor="faturas" className="text-sm flex items-center gap-1">
            <div className="w-3 h-3 bg-[#F59E0B] rounded-full"></div>
            Faturas
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="fluxoLiquido"
            checked={visibleLines.fluxoLiquido}
            onCheckedChange={(checked) => toggleLine('fluxoLiquido')}
          />
          <label htmlFor="fluxoLiquido" className="text-sm flex items-center gap-1">
            <div className="w-3 h-3 bg-[#8B5CF6] rounded-full"></div>
            Fluxo Líquido
          </label>
        </div>
      </div>
    </div>
  );
}
