
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
