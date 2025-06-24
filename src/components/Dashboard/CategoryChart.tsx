import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useCategoryChartData } from "@/hooks/useCategoryChartData";
import * as LucideIcons from "lucide-react";
import { Tag } from "lucide-react";

export function CategoryChart() {
  const {
    data: categoryData = [],
    isLoading
  } = useCategoryChartData();

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
    const { x, y, payload } = props;
    const categoryInfo = categoryData.find(cat => cat.name === payload.value);
    if (!categoryInfo) return null;
    
    const IconComponent = getIconComponent(categoryInfo.icon);
    
    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-15} y={0} width={30} height={30}>
          <div className="flex justify-center">
            <IconComponent 
              className="w-5 h-5" 
              style={{ color: categoryInfo.color }}
            />
          </div>
        </foreignObject>
        <text 
          x={0} 
          y={40} 
          dy={16} 
          textAnchor="middle" 
          fill="#666" 
          className="text-xs font-medium"
        >
          {payload.value.length > 8 ? payload.value.substring(0, 8) + '...' : payload.value}
        </text>
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

  return <Card className="bg-white border-[#DEDEDE] shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-[#121212] text-2xl font-semibold">
          Gastos por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={380}>
          <BarChart
            data={categoryData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={<CustomXAxisTick />}
              height={80}
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
            >
              {categoryData.map((entry, index) => (
                <Bar 
                  key={`bar-${index}`} 
                  fill={entry.color}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>;
}
