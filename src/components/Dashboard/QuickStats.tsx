
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBillExpenses } from "@/hooks/useCreditCardBillsNew";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

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
  const { totalBillExpenses } = useBillExpenses();
  
  const statsCards = [
    {
      title: "Saldo Total",
      value: formatCurrency(totalBalance),
      color: totalBalance >= 0 ? 'text-[#121212]' : 'text-red-600',
      borderColor: totalBalance >= 0 ? '' : 'border-red-300'
    },
    {
      title: "Receitas do Mês",
      value: formatCurrency(monthlyIncome),
      color: 'text-green-600',
      borderColor: ''
    },
    {
      title: "Despesas do Mês",
      value: formatCurrency(monthlyExpenses),
      color: 'text-red-600',
      borderColor: ''
    },
    {
      title: "Gastos Recorrentes",
      value: formatCurrency(monthlyRecurringExpenses),
      color: 'text-red-600',
      borderColor: ''
    },
    {
      title: "Despesas em Fatura",
      value: formatCurrency(totalBillExpenses),
      color: 'text-orange-600',
      borderColor: ''
    }
  ];
  
  return (
    <div className="w-full">
      {/* Desktop and Tablet View */}
      <div className="hidden md:block">
        <Carousel className="w-full" opts={{ align: "start", loop: false }}>
          <CarouselContent className="-ml-4">
            {statsCards.map((card, index) => (
              <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5">
                <Card className={`bg-white border-[#DEDEDE] shadow-sm hover:shadow-md transition-shadow h-full ${card.borderColor}`}>
                  <CardHeader className="space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-[#64748B]">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${card.color}`}>
                      {card.value}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden xl:flex" />
          <CarouselNext className="hidden xl:flex" />
        </Carousel>
      </div>

      {/* Mobile View - Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:hidden">
        {statsCards.map((card, index) => (
          <Card key={index} className={`bg-white border-[#DEDEDE] shadow-sm hover:shadow-md transition-shadow ${card.borderColor}`}>
            <CardHeader className="space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-[#64748B]">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
