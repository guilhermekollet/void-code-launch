
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useChartData } from "@/hooks/useFinancialData";

export function TopCategories() {
  const { data } = useChartData();
  const categoryData = data?.categoryData || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const maxValue = Math.max(...categoryData.map(cat => cat.value));
  const topCategories = categoryData.slice(0, 5);

  return (
    <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Top 5 Categorias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topCategories.map((category, index) => (
            <div key={category.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {formatCurrency(category.value)}
                </span>
              </div>
              <Progress 
                value={(category.value / maxValue) * 100} 
                className="h-2"
                style={{ backgroundColor: '#F3F4F6' }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
