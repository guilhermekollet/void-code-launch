
export interface FullscreenChartProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface VisibleLines {
  receitas: boolean;
  despesas: boolean;
  gastosRecorrentes: boolean;
  fluxoLiquido: boolean;
}

export interface ChartDataPoint {
  mes: string;
  receitas: number;
  despesas: number;
  gastosRecorrentes: number;
  fluxoLiquido: number;
  isFuture?: boolean;
}

export interface ZoomDomain {
  start?: number;
  end?: number;
}

export interface ChartData {
  period: string;
  receitas: number;
  despesas: number;
  gastosRecorrentes: number;
  fluxoLiquido: number;
  isFuture?: boolean;
}

export type ChartType = 'receitas' | 'despesas' | 'saldo';
export type TimeRange = 'month' | 'year';
