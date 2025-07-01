
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Maximize, ChevronLeft, ChevronRight } from "lucide-react";
import { useCategoryChartData } from "@/hooks/useCategoryChartData";
import { FullscreenCategoryChart } from "./FullscreenCategoryChart";

export function CategoryChart() {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { data: categoryData = [] } = useCategoryChartData();

  // Responsive pagination logic
  const itemsPerPage = useMemo(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 4; // Mobile
      if (window.innerWidth < 1024) return 6; // Tablet
      return 8; // Desktop
    }
    return 8;
  }, []);

  const totalPages = Math.ceil(categoryData.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = categoryData.slice(startIndex, endIndex);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const nextPage = () => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
  };

  if (categoryData.length === 0) {
    return (
      <Card className="bg-white border-[#E2E8F0]">
        <CardHeader>
          <CardTitle className="text-[#121212]">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-[#64748B]">
            Nenhuma categoria encontrada
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border-[#E2E8F0] hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[#121212] text-2xl font-semibold">Gastos por Categoria</CardTitle>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 text-xs text-[#64748B]">
                <span>{currentPage + 1} de {totalPages}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevPage}
                  className="h-8 w-8 text-[#64748B] hover:text-[#121212] hover:bg-[#F8F9FA]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextPage}
                  className="h-8 w-8 text-[#64748B] hover:text-[#121212] hover:bg-[#F8F9FA]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreenOpen(true)}
              className="h-8 w-8 text-[#64748B] hover:text-[#121212] hover:bg-[#F8F9FA]"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => {
                  if (percent < 5) return ''; // Hide labels for small slices
                  return `${name} ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={window.innerWidth < 768 ? 60 : 80}
                fill="#8884d8"
                dataKey="value"
              >
                {currentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  color: '#121212'
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  paddingTop: '10px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <FullscreenCategoryChart 
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      />
    </>
  );
}
