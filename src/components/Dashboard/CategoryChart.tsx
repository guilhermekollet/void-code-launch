
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Maximize } from "lucide-react";
import { useCategoryChartData } from "@/hooks/useCategoryChartData";
import { FullscreenCategoryChart } from "./FullscreenCategoryChart";
import * as LucideIcons from "lucide-react";
import { Tag } from "lucide-react";

export function CategoryChart() {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const {
    data: allCategoryData = [],
    isLoading
  } = useCategoryChartData();

  // Mostrar apenas as 3 maiores categorias no dashboard principal
  const categoryData = allCategoryData.slice(0, 3);

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

  const CustomTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-gray-900 text-base mb-1">{label}</p>
          <p className="text-[#61710C] font-bold text-lg">
            {formatCurrency(data.value)}
          </p>
        </div>;
    }
    return null;
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload, width } = props;
    const categoryInfo = categoryData.find(cat => cat.name === payload.value);
    if (!categoryInfo) return null;
    
    const IconComponent = getIconComponent(categoryInfo.icon);
    
    // Com apenas 3 categorias, temos mais espaço para ícones e texto
    const shouldShowIcon = width > 30;
    const shouldShowText = width > 50;
    
    return (
      <g transform={`translate(${x},${y})`}>
        {shouldShowIcon && (
          <foreignObject x={-18} y={0} width={36} height={36}>
            <div className="flex justify-center">
              <IconComponent 
                className="w-5 h-5 sm:w-6 sm:h-6" 
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
            {payload.value.length > 12 ? `${payload.value.substring(0, 10)}...` : payload.value}
          </text>
        )}
      </g>
    );
  };

  if (isLoading) {
    return <Card className="bg-white border-[#DEDEDE] shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-[#121212]">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#61710C]"></div>
              <span className="text-sm">Carregando...</span>
            </div>
          </div>
        </CardContent>
      </Card>;
  }

  if (!categoryData || categoryData.length === 0) {
    return <Card className="bg-white border-[#DEDEDE] shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-[#121212]">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Nenhum dado disponível</span>
            </div>
          </div>
        </CardContent>
      </Card>;
  }

  return (
    <>
      <Card className="bg-white border-[#DEDEDE] shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col">
            <CardTitle className="text-[#121212] text-xl sm:text-2xl font-semibold">
              Gastos por Categoria
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Top 3 maiores categorias
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreenOpen(true)}
            className="h-8 w-8 text-[#64748B] hover:text-[#121212] hover:bg-[#F8F9FA]"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={380} minWidth={300}>
            <BarChart
              data={categoryData}
              margin={{
                top: 20,
                right: 20,
                left: 20,
                bottom: 80,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={<CustomXAxisTick />}
                height={80}
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
                radius={[6, 6, 0, 0]}
                stroke="none"
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
        </CardContent>
      </Card>

      <FullscreenCategoryChart 
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      />
    </>
  );
}
