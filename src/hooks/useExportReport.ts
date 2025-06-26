
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

  const captureChart = async (selector: string): Promise<string | null> => {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) return null;
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 1,
        useCORS: true,
        allowTaint: true,
        height: element.offsetHeight,
        width: element.offsetWidth
      });
      
      return canvas.toDataURL('image/png', 0.8);
    } catch (error) {
      console.error('Erro ao capturar gráfico:', error);
      return null;
    }
  };

  const addLogo = (pdf: jsPDF) => {
    try {
      // Logo do Bolsofy (simulada - você pode substituir pela URL real ou base64)
      const logoData = '/bolsologodash.webp';
      // Para uma implementação real, você deveria converter a logo para base64
      // Por agora, vamos adicionar um placeholder de texto estilizado
      pdf.setFontSize(12);
      pdf.setTextColor(97, 113, 12); // #61710C
      pdf.text('BOLSOFY', 15, 15);
    } catch (error) {
      console.error('Erro ao adicionar logo:', error);
    }
  };

  const exportToPDF = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentY = 25;

      // Adicionar logo
      addLogo(pdf);

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Relatório Financeiro', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 10;
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 20;

      // Seção 1: Resumo Financeiro
      pdf.setFontSize(18);
      pdf.setTextColor(97, 113, 12); // #61710C
      pdf.text('📊 Resumo Financeiro', 20, currentY);
      currentY += 12;

      // Cards de resumo em grid
      const cardWidth = (pageWidth - 50) / 3;
      const cardHeight = 25;
      const cardStartY = currentY;

      // Card 1: Receitas
      pdf.setFillColor(34, 197, 94); // Green
      pdf.roundedRect(20, cardStartY, cardWidth, cardHeight, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text('Receitas do Mês', 25, cardStartY + 8);
      pdf.setFontSize(12);
      pdf.text(formatCurrency(monthlyIncome), 25, cardStartY + 18);

      // Card 2: Despesas
      pdf.setFillColor(239, 68, 68); // Red
      pdf.roundedRect(25 + cardWidth, cardStartY, cardWidth, cardHeight, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text('Despesas do Mês', 30 + cardWidth, cardStartY + 8);
      pdf.setFontSize(12);
      pdf.text(formatCurrency(monthlyExpenses), 30 + cardWidth, cardStartY + 18);

      // Card 3: Saldo
      const balanceColor = totalBalance >= 0 ? [34, 197, 94] : [239, 68, 68];
      pdf.setFillColor(balanceColor[0], balanceColor[1], balanceColor[2]);
      pdf.roundedRect(30 + (cardWidth * 2), cardStartY, cardWidth, cardHeight, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text('Saldo Total', 35 + (cardWidth * 2), cardStartY + 8);
      pdf.setFontSize(12);
      pdf.text(formatCurrency(totalBalance), 35 + (cardWidth * 2), cardStartY + 18);

      currentY += 35;

      // Capturar e adicionar gráficos
      toast({
        title: "Processando",
        description: "Capturando gráficos para o relatório...",
      });

      // Gráfico de Fluxo de Caixa
      const cashFlowChart = await captureChart('[data-chart] .recharts-wrapper');
      if (cashFlowChart && currentY < pageHeight - 80) {
        pdf.setFontSize(16);
        pdf.setTextColor(97, 113, 12);
        pdf.text('📈 Fluxo de Caixa', 20, currentY);
        currentY += 10;
        
        try {
          pdf.addImage(cashFlowChart, 'PNG', 20, currentY, pageWidth - 40, 60);
          currentY += 70;
        } catch (error) {
          console.error('Erro ao adicionar gráfico de fluxo:', error);
          currentY += 20;
        }
      }

      // Nova página se necessário
      if (currentY > pageHeight - 100) {
        pdf.addPage();
        currentY = 20;
        addLogo(pdf);
        currentY = 30;
      }

      // Seção 2: Dados Mensais Detalhados
      pdf.setFontSize(16);
      pdf.setTextColor(97, 113, 12);
      pdf.text('📅 Evolução Mensal', 20, currentY);
      currentY += 12;

      // Tabela de dados mensais
      pdf.setFontSize(10);
      pdf.setTextColor(40, 40, 40);
      
      // Cabeçalho da tabela
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, currentY, pageWidth - 40, 8, 'F');
      pdf.text('Mês', 25, currentY + 6);
      pdf.text('Receitas', 60, currentY + 6);
      pdf.text('Despesas', 100, currentY + 6);
      pdf.text('Resultado', 140, currentY + 6);
      currentY += 10;

      monthlyData.slice(-6).forEach((month, index) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
          addLogo(pdf);
          currentY = 30;
        }
        
        const resultado = month.receitas - month.despesas;
        
        // Linha alternada
        if (index % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(20, currentY - 2, pageWidth - 40, 8, 'F');
        }
        
        pdf.setTextColor(40, 40, 40);
        pdf.text(month.mes, 25, currentY + 4);
        pdf.text(formatCurrency(month.receitas), 60, currentY + 4);
        pdf.text(formatCurrency(month.despesas), 100, currentY + 4);
        pdf.setTextColor(resultado >= 0 ? 34 : 239, resultado >= 0 ? 197 : 68, resultado >= 0 ? 94 : 68);
        pdf.text(formatCurrency(resultado), 140, currentY + 4);
        pdf.setTextColor(40, 40, 40);
        currentY += 8;
      });

      currentY += 15;

      // Nova página se necessário
      if (currentY > pageHeight - 80) {
        pdf.addPage();
        currentY = 20;
        addLogo(pdf);
        currentY = 30;
      }

      // Seção 3: Top Categorias
      pdf.setFontSize(16);
      pdf.setTextColor(97, 113, 12);
      pdf.text('🏷️ Top Categorias de Gastos', 20, currentY);
      currentY += 12;

      const totalCategoryExpenses = categoryData.reduce((sum, cat) => sum + cat.value, 0);
      
      categoryData.slice(0, 8).forEach((category, index) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
          addLogo(pdf);
          currentY = 30;
        }
        
        const percentage = totalCategoryExpenses > 0 ? (category.value / totalCategoryExpenses * 100).toFixed(1) : '0';
        
        // Barra de progresso visual
        const barWidth = (category.value / Math.max(...categoryData.map(c => c.value))) * 100;
        pdf.setFillColor(97, 113, 12);
        pdf.rect(20, currentY, barWidth, 4, 'F');
        
        // Dados da categoria
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        pdf.text(`${index + 1}. ${category.name}`, 25, currentY + 12);
        pdf.text(formatCurrency(category.value), 120, currentY + 12);
        pdf.text(`${percentage}%`, 160, currentY + 12);
        currentY += 18;
      });

      // Footer em todas as páginas
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const footerY = pageHeight - 10;
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Relatório gerado automaticamente pelo Bolsofy', pageWidth / 2, footerY, { align: 'center' });
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 20, footerY, { align: 'right' });
      }

      // Save PDF
      const fileName = `relatorio-bolsofy-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Sucesso! 🎉",
        description: "Relatório exportado com gráficos e design aprimorado!",
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
