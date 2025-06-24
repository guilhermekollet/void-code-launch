import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpensesByCategory } from "@/components/Reports/ExpensesByCategory";
import { MonthlyComparison } from "@/components/Reports/MonthlyComparison";
import { CashFlow } from "@/components/Reports/CashFlow";
import { ExpenseTrends } from "@/components/Reports/ExpenseTrends";
import { TopCategories } from "@/components/Reports/TopCategories";
import { FinancialSummary } from "@/components/Reports/FinancialSummary";

export default function Relatorios() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600 mt-2">
          Análise detalhada das suas finanças
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
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
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Período</CardTitle>
                <CardDescription>Gastos distribuídos ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  Gráfico de distribuição temporal em desenvolvimento
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <ExpenseTrends />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sazonalidade</CardTitle>
                <CardDescription>Padrões sazonais nos seus gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  Análise de sazonalidade em desenvolvimento
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Previsões</CardTitle>
                <CardDescription>Projeções baseadas no histórico</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  Gráfico de previsões em desenvolvimento
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <MonthlyComparison />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparação Anual</CardTitle>
                <CardDescription>Compare diferentes anos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  Comparação anual em desenvolvimento
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Metas vs Realizado</CardTitle>
                <CardDescription>Performance contra suas metas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  Gráfico de metas em desenvolvimento
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
