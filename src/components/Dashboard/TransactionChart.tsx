
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Maximize } from "lucide-react";
import { useChartDataWithInstallments } from "@/hooks/useFinancialData";
import { FullscreenChart } from "./FullscreenChart";
import { TransactionsModal } from "./TransactionsModal";

export function TransactionChart() {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const { data: monthlyData = [] } = useChartDataWithInstallments();

  const handlePointClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const monthData = data.activePayload[0].payload;
      const month = monthData.period || monthData.mes;
      if (month) {
        setSelectedMonth(month);
        setIsTransactionsModalOpen(true);
      }
    }
  };

  if (monthlyData.length === 0 || monthlyData.every(d => d.receitas === 0 && d.despesas === 0)) {
    return (
      <Card className="bg-white border-[#E2E8F0]">
        <CardHeader>
          <CardTitle className="text-[#121212]">Fluxo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-[#64748B]">
            Nenhuma transação encontrada
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border-[#E2E8F0] hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[#121212] text-2xl font-semibold">Fluxo Financeiro</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreenOpen(true)}
            className="h-8 w-8 text-[#64748B] hover:text-[#121212] hover:bg-[#F8F9FA]"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart 
              data={monthlyData}
              onClick={handlePointClick}
            >
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
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                  name
                ]} 
              />
              <Line 
                type="monotone" 
                dataKey="receitas" 
                stroke="#61710C" 
                strokeWidth={3} 
                name="Receitas" 
                dot={{ fill: '#61710C', strokeWidth: 2, r: 4, cursor: 'pointer' }} 
                activeDot={{ r: 6, fill: '#61710C', cursor: 'pointer' }} 
              />
              <Line 
                type="monotone" 
                dataKey="despesas" 
                stroke="#EF4444" 
                strokeWidth={3} 
                name="Despesas" 
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4, cursor: 'pointer' }} 
                activeDot={{ r: 6, fill: '#EF4444', cursor: 'pointer' }} 
              />
               <Line 
                type="monotone" 
                dataKey="gastosRecorrentes" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                name="Gastos Recorrentes" 
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3, cursor: 'pointer' }} 
                activeDot={{ r: 5, fill: '#3B82F6', cursor: 'pointer' }} 
               />
               <Line 
                type="monotone" 
                dataKey="faturas" 
                stroke="#F59E0B" 
                strokeWidth={2} 
                name="Faturas" 
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3, cursor: 'pointer' }} 
                activeDot={{ r: 5, fill: '#F59E0B', cursor: 'pointer' }} 
               />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <FullscreenChart 
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      />

      <TransactionsModal
        isOpen={isTransactionsModalOpen}
        onClose={() => setIsTransactionsModalOpen(false)}
        selectedMonth={selectedMonth}
      />
    </>
  );
}
