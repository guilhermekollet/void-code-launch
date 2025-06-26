
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpensesByCategory } from "@/components/Reports/ExpensesByCategory";
import { MonthlyComparison } from "@/components/Reports/MonthlyComparison";
import { CashFlow } from "@/components/Reports/CashFlow";
import { ExpenseTrends } from "@/components/Reports/ExpenseTrends";
import { TopCategories } from "@/components/Reports/TopCategories";
import { FinancialSummary } from "@/components/Reports/FinancialSummary";
import { useExportReport } from "@/hooks/useExportReport";
import { useFinancialMetrics } from "@/hooks/useFinancialData";
import { FileDown, BarChart3, TrendingUp, PieChart } from "lucide-react";

export default function Relatorios() {
  const {
    exportToPDF,
    isExporting
  } = useExportReport();
  const {
    totalBalance,
    monthlyIncome,
    monthlyExpenses
  } = useFinancialMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const currentMonth = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-2">
            Análise detalhada das suas finanças - {currentMonth}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={exportToPDF} 
            disabled={isExporting} 
            className="bg-white hover:bg-gray-50 text-black border border-[#E2E8F0] shadow-sm"
            variant="outline"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#E2E8F0] shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Receitas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
              Despesas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlyExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Saldo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção 1: Resumo Financeiro */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#61710C]" />
          <h2 className="text-xl font-semibold text-gray-900">Resumo Financeiro</h2>
        </div>
        <FinancialSummary />
      </section>

      {/* Seção 2: Fluxo de Caixa e Top Categorias */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#61710C]" />
          <h2 className="text-xl font-semibold text-gray-900">Análise de Fluxo</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CashFlow />
          <TopCategories />
        </div>
      </section>

      {/* Seção 3: Despesas por Categoria e Tendências */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-[#61710C]" />
          <h2 className="text-xl font-semibold text-gray-900">Análise de Gastos</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpensesByCategory />
          <ExpenseTrends />
        </div>
      </section>

      {/* Seção 4: Comparação Mensal */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#61710C]" />
          <h2 className="text-xl font-semibold text-gray-900">Comparação Temporal</h2>
        </div>
        <MonthlyComparison />
      </section>
    </div>
  );
}
