import { useCallback, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useFinancialMetrics, useChartData } from './useFinancialData';
import { useToast } from './use-toast';

export function useExportReport() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { totalBalance, monthlyIncome, monthlyExpenses, monthlyRecurringExpenses } = useFinancialMetrics();
  const { data: chartData } = useChartData();
  
  const monthlyData = chartData?.monthlyData || [];
  const categoryData = chartData?.categoryData || [];

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
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: element.offsetHeight,
        width: element.offsetWidth,
        logging: false
      });
      
      return canvas.toDataURL('image/png', 0.9);
    } catch (error) {
      console.error('Erro ao capturar gráfico:', error);
      return null;
    }
  };

  const generateHTMLReport = async () => {
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const monthlyNet = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? ((monthlyNet / monthlyIncome) * 100) : 0;

    // Capturar gráficos
    const cashFlowChart = await captureChart('[data-chart="cash-flow"] .recharts-wrapper');
    const expensesByCategoryChart = await captureChart('[data-chart="expenses-by-category"] .recharts-wrapper');
    const monthlyComparisonChart = await captureChart('[data-chart="monthly-comparison"] .recharts-wrapper');
    const expenseTrendsChart = await captureChart('[data-chart="expense-trends"] .recharts-wrapper');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Financeiro - Bolsofy</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            margin: 15%;
            size: A4;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #ffffff;
            padding: 0;
            margin: 0;
        }
        
        .container {
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 48px;
            padding-bottom: 24px;
            border-bottom: 3px solid #61710C;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #61710C;
            letter-spacing: 1px;
        }
        
        .date {
            font-size: 14px;
            color: #6b7280;
            text-transform: capitalize;
        }
        
        .title {
            text-align: center;
            margin-bottom: 48px;
        }
        
        .title h1 {
            font-size: 36px;
            color: #1f2937;
            margin-bottom: 12px;
            font-weight: 700;
        }
        
        .title p {
            font-size: 18px;
            color: #6b7280;
            font-weight: 400;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            margin-bottom: 48px;
        }
        
        .metric-card {
            background: #f8fafc;
            padding: 24px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            text-align: center;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        
        .metric-card h3 {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 600;
        }
        
        .metric-card .value {
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 6px;
            line-height: 1.2;
        }
        
        .metric-card .positive {
            color: #22c55e;
        }
        
        .metric-card .negative {
            color: #ef4444;
        }
        
        .metric-card .neutral {
            color: #3b82f6;
        }
        
        .section {
            margin-bottom: 56px;
        }
        
        .section-title {
            font-size: 22px;
            font-weight: bold;
            color: #61710C;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 48px;
        }
        
        .chart-container {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        
        .chart-container h4 {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .chart-container img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
        }
        
        .full-width-chart {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin-bottom: 48px;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        
        .full-width-chart h4 {
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 24px;
            font-weight: 600;
        }
        
        .data-table {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 40px;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        
        .data-table table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .data-table th {
            background: #f8fafc;
            padding: 16px 14px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
        }
        
        .data-table td {
            padding: 14px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 14px;
        }
        
        .data-table tr:hover {
            background: #f9fafb;
        }
        
        .data-table tr:last-child td {
            border-bottom: none;
        }
        
        .category-analysis {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 24px;
        }
        
        .category-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #61710C;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        
        .category-name {
            font-weight: 500;
            color: #374151;
            font-size: 15px;
        }
        
        .category-value {
            font-weight: bold;
            color: #61710C;
            font-size: 15px;
        }
        
        .footer {
            margin-top: 72px;
            padding-top: 24px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
        }
        
        .footer p {
            margin-bottom: 8px;
        }
        
        .page-break {
            page-break-before: always;
            margin-top: 48px;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #61710C, #8B9F1A);
            color: white;
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 32px;
            text-align: center;
        }
        
        .highlight-box h3 {
            font-size: 18px;
            margin-bottom: 8px;
        }
        
        .highlight-box p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .spacer {
            height: 24px;
        }
        
        .spacer-large {
            height: 48px;
        }
        
        @media print {
            body {
                padding: 0;
                margin: 0;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            .chart-container, .full-width-chart, .data-table, .metric-card {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">BOLSOFY</div>
            <div class="date">${currentDate}</div>
        </div>
        
        <div class="title">
            <h1>Relatório Financeiro</h1>
            <p>Análise completa das suas finanças pessoais</p>
        </div>
        
        <div class="highlight-box">
            <h3>Resumo Executivo</h3>
            <p>Análise detalhada do seu desempenho financeiro com métricas essenciais e insights estratégicos</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Receitas do Mês</h3>
                <div class="value positive">${formatCurrency(monthlyIncome)}</div>
            </div>
            <div class="metric-card">
                <h3>Despesas do Mês</h3>
                <div class="value negative">${formatCurrency(monthlyExpenses)}</div>
            </div>
            <div class="metric-card">
                <h3>Resultado do Mês</h3>
                <div class="value ${monthlyNet >= 0 ? 'positive' : 'negative'}">${formatCurrency(monthlyNet)}</div>
            </div>
            <div class="metric-card">
                <h3>Saldo Total</h3>
                <div class="value ${totalBalance >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalBalance)}</div>
            </div>
        </div>
        
        <div class="spacer-large"></div>
        
        <div class="section">
            <h2 class="section-title">📈 Análise de Fluxo de Caixa</h2>
            ${cashFlowChart ? `
            <div class="full-width-chart">
                <h4>Evolução do Fluxo de Caixa</h4>
                <div class="spacer"></div>
                <img src="${cashFlowChart}" alt="Gráfico de Fluxo de Caixa" />
            </div>
            ` : '<div class="full-width-chart"><p>Gráfico de fluxo de caixa não disponível</p></div>'}
        </div>
        
        <div class="section">
            <h2 class="section-title">🏷️ Análise de Categorias</h2>
            <div class="charts-grid">
                <div class="chart-container">
                    <h4>Despesas por Categoria</h4>
                    <div class="spacer"></div>
                    ${expensesByCategoryChart ? `<img src="${expensesByCategoryChart}" alt="Despesas por Categoria" />` : '<p>Gráfico não disponível</p>'}
                </div>
                <div class="chart-container">
                    <h4>Tendência de Gastos</h4>
                    <div class="spacer"></div>
                    ${expenseTrendsChart ? `<img src="${expenseTrendsChart}" alt="Tendência de Gastos" />` : '<p>Gráfico não disponível</p>'}
                </div>
            </div>
            
            <div class="spacer"></div>
            
            <div class="category-analysis">
                ${categoryData.slice(0, 6).map((category, index) => `
                    <div class="category-item">
                        <span class="category-name">${index + 1}. ${category.name}</span>
                        <span class="category-value">${formatCurrency(category.value)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="page-break"></div>
        
        <div class="section">
            <h2 class="section-title">📊 Comparação Mensal</h2>
            ${monthlyComparisonChart ? `
            <div class="full-width-chart">
                <h4>Evolução Mensal de Receitas e Despesas</h4>
                <div class="spacer"></div>
                <img src="${monthlyComparisonChart}" alt="Comparação Mensal" />
            </div>
            ` : '<div class="full-width-chart"><p>Gráfico de comparação mensal não disponível</p></div>'}
        </div>
        
        <div class="spacer-large"></div>
        
        <div class="section">
            <h2 class="section-title">📋 Dados Mensais Detalhados</h2>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Mês</th>
                            <th>Receitas</th>
                            <th>Despesas</th>
                            <th>Gastos Recorrentes</th>
                            <th>Resultado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${monthlyData.slice(-6).map(month => {
                            const resultado = month.receitas - month.despesas;
                            return `
                            <tr>
                                <td><strong>${month.mes}</strong></td>
                                <td style="color: #22c55e; font-weight: 600;">${formatCurrency(month.receitas)}</td>
                                <td style="color: #ef4444; font-weight: 600;">${formatCurrency(month.despesas)}</td>
                                <td style="color: #f59e0b; font-weight: 600;">${formatCurrency(month.gastosRecorrentes)}</td>
                                <td style="color: ${resultado >= 0 ? '#22c55e' : '#ef4444'}; font-weight: 700;">${formatCurrency(resultado)}</td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="spacer"></div>
        
        <div class="section">
            <h2 class="section-title">📈 Métricas de Performance</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Taxa de Poupança</h3>
                    <div class="value ${savingsRate >= 0 ? 'positive' : 'negative'}">${savingsRate.toFixed(1)}%</div>
                </div>
                <div class="metric-card">
                    <h3>Gastos Recorrentes</h3>
                    <div class="value neutral">${formatCurrency(monthlyRecurringExpenses)}</div>
                </div>
                <div class="metric-card">
                    <h3>% Gastos Recorrentes</h3>
                    <div class="value neutral">${monthlyExpenses > 0 ? ((monthlyRecurringExpenses / monthlyExpenses) * 100).toFixed(1) : 0}%</div>
                </div>
                <div class="metric-card">
                    <h3>Categorias Ativas</h3>
                    <div class="value neutral">${categoryData.length}</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Relatório gerado automaticamente pelo Bolsofy</strong> • ${currentDate}</p>
            <p>Mantenha suas finanças sempre organizadas e tome decisões inteligentes</p>
        </div>
    </div>
</body>
</html>
    `;
  };

  const convertHTMLToPDF = async (html: string) => {
    // Criar um elemento temporário para renderizar o HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm'; // A4 width
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        windowWidth: 794,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      return pdf;
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const exportToPDF = useCallback(async (selectedPeriod: string) => {
    setIsExporting(true);
    
    try {
      toast({
        title: "Processando",
        description: "Preparando seu relatório financeiro...",
      });

      const htmlContent = await generateHTMLReport();
      
      toast({
        title: "Processando",
        description: "Gerando arquivo PDF...",
      });

      const pdf = await convertHTMLToPDF(htmlContent);
      
      const fileName = `relatorio-financeiro-bolsofy-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Sucesso! 🎉",
        description: "Seu relatório foi exportado para PDF",
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

  const exportToExcel = useCallback(async (selectedPeriod: string) => {
    setIsExporting(true);
    
    try {
      toast({
        title: "Processando",
        description: "Preparando dados para Excel...",
      });

      // Criar dados para Excel
      const excelData = {
        period: selectedPeriod,
        metrics: [
          { Métrica: 'Receitas do Mês', Valor: formatCurrency(monthlyIncome) },
          { Métrica: 'Despesas do Mês', Valor: formatCurrency(monthlyExpenses) },
          { Métrica: 'Resultado do Mês', Valor: formatCurrency(monthlyIncome - monthlyExpenses) },
          { Métrica: 'Saldo Total', Valor: formatCurrency(totalBalance) },
        ],
        monthlyData: monthlyData.slice(-6).map(month => ({
          Mês: month.mes,
          Receitas: formatCurrency(month.receitas),
          Despesas: formatCurrency(month.despesas),
          'Gastos Recorrentes': formatCurrency(month.gastosRecorrentes),
          Resultado: formatCurrency(month.receitas - month.despesas)
        })),
        categories: categoryData.slice(0, 10).map((category, index) => ({
          Posição: index + 1,
          Categoria: category.name,
          Valor: formatCurrency(category.value)
        }))
      };

      // Simular download de Excel (você pode usar uma biblioteca como xlsx aqui)
      const jsonData = JSON.stringify(excelData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-financeiro-bolsofy-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso! 🎉",
        description: "Dados exportados com sucesso",
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [monthlyIncome, monthlyExpenses, totalBalance, monthlyData, categoryData, toast]);

  return {
    exportToPDF,
    exportToExcel,
    isExporting
  };
}
