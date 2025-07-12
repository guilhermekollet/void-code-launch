
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinancialMetrics } from "@/hooks/useFinancialData";
import { FinancialSummary } from "@/components/Reports/FinancialSummary";
import { CashFlow } from "@/components/Reports/CashFlow";
import { ExpensesByCategory } from "@/components/Reports/ExpensesByCategory";
import { TopCategories } from "@/components/Reports/TopCategories";
import { ExpenseTrends } from "@/components/Reports/ExpenseTrends";
import { MonthlyComparison } from "@/components/Reports/MonthlyComparison";
import { FileDown, Calendar, TrendingUp, PieChart, BarChart3, DollarSign } from "lucide-react";
import { useExportReport } from "@/hooks/useExportReport";

export default function Relatorios() {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const { exportToPDF, exportToExcel, isExporting } = useExportReport();
  const { totalBalance, monthlyIncome, monthlyExpenses } = useFinancialMetrics();

  const handleExportPDF = () => {
    exportToPDF(selectedPeriod);
  };

  const handleExportExcel = () => {
    exportToExcel(selectedPeriod);
  };

  const periodOptions = [
    { value: 'current-month', label: 'Mês Atual' },
    { value: 'last-month', label: 'Mês Anterior' },
    { value: 'last-3-months', label: 'Últimos 3 Meses' },
    { value: 'last-6-months', label: 'Últimos 6 Meses' },
    { value: 'current-year', label: 'Ano Atual' },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header with Export Options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios Financeiros</h1>
          <p className="text-gray-600">Análise detalhada das suas finanças</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-[#61710C] focus:border-transparent"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </Button>
            <Button
              onClick={handleExportExcel}
              disabled={isExporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <FinancialSummary />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CashFlow />
        <ExpensesByCategory />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TopCategories />
        <ExpenseTrends />
      </div>

      <MonthlyComparison />

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(totalBalance)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-[#61710C]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-sm font-medium text-gray-600">Receitas do Mês</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(monthlyIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-sm font-medium text-gray-600">Despesas do Mês</p>
                <p className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(monthlyExpenses)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-sm font-medium text-gray-600">Resultado</p>
                <p className={`text-2xl font-bold ${monthlyIncome - monthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(monthlyIncome - monthlyExpenses)}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-[#61710C]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
