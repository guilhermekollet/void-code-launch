import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExpensesByCategory } from "@/components/Reports/ExpensesByCategory";
import { MonthlyComparison } from "@/components/Reports/MonthlyComparison";
import { CashFlow } from "@/components/Reports/CashFlow";
import { ExpenseTrends } from "@/components/Reports/ExpenseTrends";
import { TopCategories } from "@/components/Reports/TopCategories";
import { FinancialSummary } from "@/components/Reports/FinancialSummary";
import { useExportReport } from "@/hooks/useExportReport";
import { useFinancialMetrics } from "@/hooks/useFinancialData";
import { FileDown, BarChart3, TrendingUp, PieChart, Calendar } from "lucide-react";
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
  return <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-2">
            Análise detalhada das suas finanças - {currentMonth}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={exportToPDF} disabled={isExporting} className="bg-[#61710C] hover:bg-[#61710C]/90 text-white">
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

        <Card className="border-[#E2E8F0] shadow-sm">
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

        <Card className="border-[#E2E8F0] shadow-sm">
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

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-50 border border-[#E2E8F0]">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:border data-[state=active]:border-[#E2E8F0]">
            <BarChart3 className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:border data-[state=active]:border-[#E2E8F0]">
            <PieChart className="w-4 h-4" />
            Despesas
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:border data-[state=active]:border-[#E2E8F0]">
            <TrendingUp className="w-4 h-4" />
            Tendências
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:border data-[state=active]:border-[#E2E8F0]">
            <Calendar className="w-4 h-4" />
            Comparação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FinancialSummary />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CashFlow />
            <TopCategories />
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpensesByCategory />
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Distribuição por Período</CardTitle>
                <CardDescription className="text-gray-600">Gastos distribuídos ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Gráfico de distribuição temporal em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <ExpenseTrends />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Sazonalidade</CardTitle>
                <CardDescription className="text-gray-600">Padrões sazonais nos seus gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Análise de sazonalidade em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Previsões</CardTitle>
                <CardDescription className="text-gray-600">Projeções baseadas no histórico</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Gráfico de previsões em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <MonthlyComparison />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Comparação Anual</CardTitle>
                <CardDescription className="text-gray-600">Compare diferentes anos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Comparação anual em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Metas vs Realizado</CardTitle>
                <CardDescription className="text-gray-600">Performance contra suas metas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Gráfico de metas em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>;
}