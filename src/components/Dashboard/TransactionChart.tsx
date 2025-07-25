
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Maximize } from "lucide-react";
import { useChartDataWithInstallments } from "@/hooks/useFinancialData";
import { FullscreenChart } from "./FullscreenChart";

export function TransactionChart() {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const monthlyData = useChartDataWithInstallments();

  if (!monthlyData || monthlyData.length === 0 || monthlyData.every(d => d.receitas === 0 && d.despesas === 0)) {
    return (
      <Card className="bg-white border-[#E2E8F0]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-[#121212]">Fluxo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-gray-500">
            Sem dados disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border-[#E2E8F0] hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold text-[#121212]">Fluxo Financeiro</CardTitle>
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
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
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
                dot={{ fill: '#61710C', strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6, fill: '#61710C' }} 
              />
              <Line 
                type="monotone" 
                dataKey="despesas" 
                stroke="#EF4444" 
                strokeWidth={3} 
                name="Despesas" 
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6, fill: '#EF4444' }} 
              />
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
               <Line 
                type="monotone" 
                dataKey="faturas" 
                stroke="#F59E0B" 
                strokeWidth={2} 
                name="Faturas" 
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }} 
                activeDot={{ r: 5, fill: '#F59E0B' }} 
               />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <FullscreenChart 
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      />
    </>
  );
}
