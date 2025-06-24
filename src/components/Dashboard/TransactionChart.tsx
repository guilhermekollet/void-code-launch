import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useChartData } from "@/hooks/useFinancialData";
export function TransactionChart() {
  const {
    monthlyData
  } = useChartData();
  if (monthlyData.length === 0 || monthlyData.every(d => d.receitas === 0 && d.despesas === 0)) {
    return <Card className="bg-white border-[#E2E8F0]">
        <CardHeader>
          <CardTitle className="text-[#121212]">Fluxo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-[#64748B]">
            Nenhuma transação encontrada
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white border-[#E2E8F0] hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-[#121212] text-2xl font-semibold">Fluxo Financeiro</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="mes" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: '#121212'
          }} formatter={(value: number, name: string) => [`R$ ${value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2
          })}`, name]} />
            <Line type="monotone" dataKey="receitas" stroke="#61710C" strokeWidth={3} name="Receitas" dot={{
            fill: '#61710C',
            strokeWidth: 2,
            r: 4
          }} activeDot={{
            r: 6,
            fill: '#61710C'
          }} />
            <Line type="monotone" dataKey="despesas" stroke="#EF4444" strokeWidth={3} name="Despesas" dot={{
            fill: '#EF4444',
            strokeWidth: 2,
            r: 4
          }} activeDot={{
            r: 6,
            fill: '#EF4444'
          }} />
            <Line type="monotone" dataKey="gastosRecorrentes" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" name="Gastos Recorrentes" dot={{
            fill: '#3B82F6',
            strokeWidth: 2,
            r: 3
          }} activeDot={{
            r: 5,
            fill: '#3B82F6'
          }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>;
}