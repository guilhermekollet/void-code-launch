
import { useCallback, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useFinancialMetrics, useChartData } from './useFinancialData';
import { useToast } from './use-toast';

export function useExportReport() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { totalBalance, monthlyIncome, monthlyExpenses, monthlyRecurringExpenses } = useFinancialMetrics();
  const { monthlyData, categoryData } = useChartData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportToPDF = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentY = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Relatório Financeiro', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 15;
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 20;

      // Resumo Financeiro
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Resumo Financeiro', 20, currentY);
      currentY += 10;

      pdf.setFontSize(11);
      const summaryData = [
        ['Saldo Total', formatCurrency(totalBalance)],
        ['Receitas do Mês', formatCurrency(monthlyIncome)],
        ['Despesas do Mês', formatCurrency(monthlyExpenses)],
        ['Gastos Recorrentes', formatCurrency(monthlyRecurringExpenses)],
        ['Resultado do Mês', formatCurrency(monthlyIncome - monthlyExpenses)],
      ];

      summaryData.forEach(([label, value]) => {
        pdf.text(label + ':', 20, currentY);
        pdf.text(value, 120, currentY);
        currentY += 8;
      });

      currentY += 15;

      // Dados Mensais
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = 20;
      }

      pdf.setFontSize(16);
      pdf.text('Evolução Mensal', 20, currentY);
      currentY += 10;

      pdf.setFontSize(10);
      pdf.text('Mês', 20, currentY);
      pdf.text('Receitas', 50, currentY);
      pdf.text('Despesas', 90, currentY);
      pdf.text('Resultado', 130, currentY);
      currentY += 8;

      monthlyData.slice(-6).forEach((month) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
        
        const resultado = month.receitas - month.despesas;
        pdf.text(month.mes, 20, currentY);
        pdf.text(formatCurrency(month.receitas), 50, currentY);
        pdf.text(formatCurrency(month.despesas), 90, currentY);
        pdf.setTextColor(resultado >= 0 ? 0 : 255, resultado >= 0 ? 150 : 0, 0);
        pdf.text(formatCurrency(resultado), 130, currentY);
        pdf.setTextColor(40, 40, 40);
        currentY += 8;
      });

      currentY += 15;

      // Categorias
      if (currentY > pageHeight - 80) {
        pdf.addPage();
        currentY = 20;
      }

      pdf.setFontSize(16);
      pdf.text('Despesas por Categoria', 20, currentY);
      currentY += 10;

      pdf.setFontSize(10);
      pdf.text('Categoria', 20, currentY);
      pdf.text('Valor', 120, currentY);
      pdf.text('%', 160, currentY);
      currentY += 8;

      const totalCategoryExpenses = categoryData.reduce((sum, cat) => sum + cat.value, 0);
      
      categoryData.slice(0, 8).forEach((category) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
        
        const percentage = totalCategoryExpenses > 0 ? (category.value / totalCategoryExpenses * 100).toFixed(1) : '0';
        pdf.text(category.name, 20, currentY);
        pdf.text(formatCurrency(category.value), 120, currentY);
        pdf.text(percentage + '%', 160, currentY);
        currentY += 8;
      });

      // Footer
      const footerY = pageHeight - 10;
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Relatório gerado automaticamente pelo sistema', pageWidth / 2, footerY, { align: 'center' });

      // Save PDF
      pdf.save(`relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [totalBalance, monthlyIncome, monthlyExpenses, monthlyRecurringExpenses, monthlyData, categoryData, toast]);

  return {
    exportToPDF,
    isExporting
  };
}
