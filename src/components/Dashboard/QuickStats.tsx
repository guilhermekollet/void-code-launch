
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBillExpenses } from "@/hooks/useCreditCardBillsNew";

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
  const { data: billExpensesData } = useBillExpenses();
  const totalBillExpenses = billExpensesData?.totalBillExpenses || 0;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* Saldo Total - cor condicional baseada no valor */}
      <Card className={`bg-white border-[#DEDEDE] shadow-sm hover:shadow-md transition-shadow ${totalBalance >= 0 ? '' : 'border-red-300'}`}>
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-[#64748B]">Saldo Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-[#121212]' : 'text-red-600'}`}>
            {formatCurrency(totalBalance)}
          </div>
        </CardContent>
      </Card>

      {/* Receitas do Mês */}
      <Card className="bg-white border-[#DEDEDE] shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-[#64748B]">Receitas do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyIncome)}</div>
        </CardContent>
      </Card>

      {/* Despesas do Mês */}
      <Card className="bg-white border-[#DEDEDE] shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-[#64748B]">Despesas do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(monthlyExpenses)}</div>
        </CardContent>
      </Card>

      {/* Gastos Recorrentes */}
      <Card className="bg-white border-[#DEDEDE] shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-[#64748B]">Gastos Recorrentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(monthlyRecurringExpenses)}</div>
        </CardContent>
      </Card>

      {/* Despesas em Fatura */}
      <Card className="bg-white border-[#DEDEDE] shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-[#64748B]">Despesas em Fatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalBillExpenses)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
