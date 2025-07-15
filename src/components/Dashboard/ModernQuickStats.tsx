
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBillExpenses } from "@/hooks/useCreditCardBillsNew";

interface ModernQuickStatsProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyRecurringExpenses: number;
  formatCurrency: (value: number) => string;
}

export function ModernQuickStats({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  monthlyRecurringExpenses,
  formatCurrency
}: ModernQuickStatsProps) {
  const { data: billExpensesData } = useBillExpenses();
  const totalBillExpenses = billExpensesData?.totalBillExpenses || 0;

  const [currentIndex, setCurrentIndex] = useState(0);

  const cards = [
    {
      title: "Saldo Total",
      value: totalBalance,
      color: totalBalance >= 0 ? 'text-[#121212]' : 'text-red-600',
      borderColor: totalBalance >= 0 ? 'border-[#DFDFDF]' : 'border-red-300'
    },
    {
      title: "Receitas do Mês",
      value: monthlyIncome,
      color: 'text-green-600',
      borderColor: 'border-[#DFDFDF]'
    },
    {
      title: "Despesas do Mês",
      value: monthlyExpenses,
      color: 'text-red-600',
      borderColor: 'border-[#DFDFDF]'
    },
    {
      title: "Gastos Recorrentes",
      value: monthlyRecurringExpenses,
      color: 'text-red-600',
      borderColor: 'border-[#DFDFDF]'
    },
    {
      title: "Despesas em Fatura",
      value: totalBillExpenses,
      color: 'text-orange-600',
      borderColor: 'border-[#DFDFDF]'
    }
  ];

  const nextCards = () => {
    setCurrentIndex((prev) => (prev + 3) % cards.length);
  };

  const prevCards = () => {
    setCurrentIndex((prev) => (prev - 3 + cards.length) % cards.length);
  };

  const getVisibleCards = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(cards[(currentIndex + i) % cards.length]);
    }
    return visible;
  };

  return (
    <div className="space-y-4">
      {/* Desktop - 3 cards em linha */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {getVisibleCards().map((card, index) => (
          <Card key={index} className={`bg-[#FDFDFD] ${card.borderColor} shadow-sm hover:shadow-md transition-shadow`}>
            <CardHeader className="space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-[#64748B]">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {formatCurrency(card.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile - 1 card com navegação */}
      <div className="lg:hidden">
        <div className="relative">
          <Card className={`bg-[#FDFDFD] ${cards[currentIndex].borderColor} shadow-sm`}>
            <CardHeader className="space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-[#64748B]">{cards[currentIndex].title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cards[currentIndex].color}`}>
                {formatCurrency(cards[currentIndex].value)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles de navegação mobile */}
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Indicadores */}
          <div className="flex space-x-2">
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-[#61710C]' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % cards.length)}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Controles de navegação desktop */}
      <div className="hidden lg:flex justify-center items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={prevCards}
          disabled={cards.length <= 3}
          className="h-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        <div className="flex space-x-2">
          {Array.from({ length: Math.ceil(cards.length / 3) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * 3)}
              className={`w-2 h-2 rounded-full transition-colors ${
                Math.floor(currentIndex / 3) === index ? 'bg-[#61710C]' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextCards}
          disabled={cards.length <= 3}
          className="h-8"
        >
          Próximo
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
