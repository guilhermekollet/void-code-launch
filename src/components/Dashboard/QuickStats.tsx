import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface QuickStatsProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyRecurringExpenses: number;
  formatCurrency: (value: number) => string;
}
export function QuickStats({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  monthlyRecurringExpenses,
  formatCurrency
}: QuickStatsProps) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Saldo Total - cor condicional baseada no valor */}
      <Card className={`bg-white border-[#DEDEDE] ${totalBalance >= 0 ? '' : 'border-red-300'}`}>
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-black">Saldo Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-[#121212]' : 'text-red-600'}`}>{formatCurrency(totalBalance)}</div>
        </CardContent>
      </Card>

      {/* Receitas do Mês */}
      <Card className="bg-white border-[#DEDEDE]">
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-black">Receitas do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyIncome)}</div>
        </CardContent>
      </Card>

      {/* Despesas do Mês */}
      <Card className="bg-white border-[#DEDEDE]">
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-black">Despesas do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(monthlyExpenses)}</div>
        </CardContent>
      </Card>

      {/* Gastos Recorrentes */}
      <Card className="bg-white border-[#DEDEDE]">
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-black">Gastos Recorrentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(monthlyRecurringExpenses)}</div>
        </CardContent>
      </Card>
    </div>;
}