
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ModernQuickStatsProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyRecurringExpenses: number;
  formatCurrency: (value: number) => string;
  isLoading?: boolean;
}

export function ModernQuickStats({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  monthlyRecurringExpenses,
  formatCurrency,
  isLoading = false
}: ModernQuickStatsProps) {
  const stats = [
    {
      title: "Saldo Total",
      value: totalBalance,
      icon: DollarSign,
      color: totalBalance >= 0 ? "text-green-600" : "text-red-600",
      bgColor: totalBalance >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      title: "Receitas do Mês",
      value: monthlyIncome,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Despesas do Mês",
      value: monthlyExpenses,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Gastos Recorrentes",
      value: monthlyRecurringExpenses,
      icon: RotateCcw,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card 
          key={stat.title} 
          className="hover:shadow-md transition-all duration-300 animate-fade-in border-gray-200"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${stat.color} transition-colors duration-300`}>
              {formatCurrency(stat.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
