
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useChartData } from "@/hooks/useFinancialData";

interface FullscreenChartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenChart({ isOpen, onClose }: FullscreenChartProps) {
  const [period, setPeriod] = useState('6');
  const [zoomDomain, setZoomDomain] = useState<{ start?: number; end?: number }>({});
  const [visibleLines, setVisibleLines] = useState({
    receitas: true,
    despesas: true,
    gastosRecorrentes: true,
    fluxoLiquido: true
  });

  const { monthlyData: originalData } = useChartData();

  // Expandir dados baseado no período selecionado
  const chartData = useMemo(() => {
    const months = parseInt(period);
    const expandedData = Array.from({ length: months }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Buscar dados existentes ou criar entrada vazia
      const existingData = originalData.find(d => d.mes === date.toLocaleDateString('pt-BR', { month: 'short' }));
      
      return existingData || {
        mes: date.toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: 0,
        despesas: 0,
        gastosRecorrentes: 0
      };
    }).reverse();

    // Adicionar fluxo líquido
    return expandedData.map(item => ({
      ...item,
      fluxoLiquido: item.receitas - item.despesas
    }));
  }, [period, originalData]);

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
      const newRange = Math.min(dataLength - 1, Math.floor(range * 1.3));
      const center = (currentStart + currentEnd) / 2;
      setZoomDomain({
        start: Math.max(0, Math.floor(center - newRange / 2)),
        end: Math.min(dataLength - 1, Math.floor(center + newRange / 2))
      });
    }
  };

  const resetZoom = () => {
    setZoomDomain({});
  };

  const toggleLine = (lineKey: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey]
    }));
  };

  const displayData = useMemo(() => {
    if (!zoomDomain.start && !zoomDomain.end) return chartData;
    return chartData.slice(zoomDomain.start || 0, (zoomDomain.end || chartData.length - 1) + 1);
  }, [chartData, zoomDomain]);

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
      <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 gap-0">
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
                <SelectContent>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                  <SelectItem value="24">2 anos</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <CardContent className="p-4 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
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
                    />
                    
                    {visibleLines.receitas && (
                      <Line
                        type="monotone"
                        dataKey="receitas"
                        stroke="#61710C"
                        strokeWidth={3}
                        name="Receitas"
                        dot={{ fill: '#61710C', strokeWidth: 2, r: 4 }}
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
                        dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
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
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
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
                        dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#8B5CF6' }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
