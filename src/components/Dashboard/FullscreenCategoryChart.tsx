
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useCategoryChartDataWithPeriod } from '@/hooks/useCategoryChartDataWithPeriod';
import { EditCategoryColorModal } from './EditCategoryColorModal';
import * as LucideIcons from "lucide-react";
import { Tag } from "lucide-react";

interface FullscreenCategoryChartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenCategoryChart({ isOpen, onClose }: FullscreenCategoryChartProps) {
  const [period, setPeriod] = useState('6');
  const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string; color: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: categoryData = [], isLoading } = useCategoryChartDataWithPeriod(period);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getIconComponent = (iconName: string) => {
    if (!iconName) return Tag;
    
    const pascalCase = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    // @ts-ignore - Dynamic icon access
    return LucideIcons[pascalCase] || Tag;
  };

  const handleBarClick = (data: any) => {
    const categoryInfo = categoryData.find(cat => cat.name === data.name);
    if (categoryInfo && categoryInfo.id) {
      setSelectedCategory({
        id: categoryInfo.id,
        name: categoryInfo.name,
        color: categoryInfo.color
      });
      setIsEditModalOpen(true);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-gray-900 text-base mb-1">{label}</p>
          <p className="text-[#61710C] font-bold text-lg">
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload, width } = props;
    const categoryInfo = categoryData.find(cat => cat.name === payload.value);
    if (!categoryInfo) return null;
    
    const IconComponent = getIconComponent(categoryInfo.icon);
    
    // Responsive logic for fullscreen - more generous spacing
    const shouldShowIcon = width > 30;
    const shouldShowText = width > 50;
    
    return (
      <g transform={`translate(${x},${y})`}>
        {shouldShowIcon && (
          <foreignObject x={-18} y={0} width={36} height={36}>
            <div className="flex justify-center">
              <IconComponent 
                className="w-5 h-5 md:w-6 md:h-6" 
                style={{ color: categoryInfo.color }}
              />
            </div>
          </foreignObject>
        )}
        {shouldShowText && (
          <text 
            x={0} 
            y={shouldShowIcon ? 50 : 15} 
            textAnchor="middle" 
            fontSize={12}
            fill="#666"
          >
            {payload.value.length > 10 ? `${payload.value.substring(0, 8)}...` : payload.value}
          </text>
        )}
      </g>
    );
  };

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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 gap-0" hideCloseButton>
          <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
              <h2 className="text-xl md:text-2xl font-semibold text-[#121212]">Gastos por Categoria</h2>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b border-[#E2E8F0] bg-gray-50">
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
                    <SelectItem value="12">12 meses</SelectItem>
                    <SelectItem value="24">2 anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Clique nas barras para editar as cores das categorias
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1 p-4 md:p-6">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#61710C]"></div>
                    <span className="text-sm">Carregando...</span>
                  </div>
                </div>
              ) : categoryData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Nenhum dado disponível para o período selecionado</span>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto h-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={400}>
                    <BarChart
                      data={categoryData}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 20,
                        bottom: 100,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={<CustomXAxisTick />}
                        height={100}
                        interval={0}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => formatCurrency(value).replace('R$', 'R$').replace(',00', '')}
                        tick={{ fontSize: 12, fill: '#666' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="value" 
                        radius={[8, 8, 0, 0]}
                        stroke="none"
                        onClick={handleBarClick}
                        className="cursor-pointer"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditCategoryColorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={selectedCategory}
      />
    </>
  );
}
