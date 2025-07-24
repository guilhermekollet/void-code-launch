import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Maximize, TrendingUp, TrendingDown } from "lucide-react";
import { useTransactions } from "@/hooks/useFinancialData";

export function RevenueExpenseChart() {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const { data: transactions = [], isLoading } = useTransactions();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate current month data
  const getCurrentMonthData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.tx_date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const revenue = currentMonthTransactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + Number(t.value), 0);

    const expenses = currentMonthTransactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + Number(t.value), 0);

    // Retornar as duas barras lado a lado, com despesas como valores positivos
    return [
      {
        name: 'Receita',
        value: revenue,
        color: '#10B981',
        icon: TrendingUp
      },
      {
        name: 'Despesa', 
        value: Math.abs(expenses), // Tornar despesas positivas para mostrar barras lado a lado
        color: '#EF4444',
        icon: TrendingDown
      }
    ];
  };

  const chartData = getCurrentMonthData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-gray-900 text-base mb-1">{label}</p>
          <p className="font-bold text-lg" style={{ color: data.payload.color }}>
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const dataItem = chartData.find(item => item.name === payload.value);
    if (!dataItem) return null;
    
    const IconComponent = dataItem.icon;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-20} y={0} width={40} height={40}>
          <div className="flex justify-center">
            <IconComponent 
              className="w-6 h-6" 
              style={{ color: dataItem.color }}
            />
          </div>
        </foreignObject>
        <text 
          x={0} 
          y={55} 
          textAnchor="middle" 
          fontSize={12}
          fill="#666"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-[#DEDEDE] shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-[#121212]">Receita x Despesa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#61710C]"></div>
              <span className="text-sm">Carregando...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.every(item => item.value === 0)) {
    return (
      <Card className="bg-white border-[#DEDEDE] shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-[#121212]">Receita x Despesa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-gray-500">
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
      </Card>
    );
  }

  return (
    <Card className="bg-white border-[#DEDEDE] shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col">
          <CardTitle className="text-[#121212] text-xl sm:text-2xl font-semibold">
            Receita x Despesa
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Comparação do mês atual
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
        <ResponsiveContainer width="100%" height={280} minWidth={300}>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              left: 20,
              bottom: 70,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={<CustomXAxisTick />}
              height={70}
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
              {chartData.map((entry, index) => (
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
  );
}