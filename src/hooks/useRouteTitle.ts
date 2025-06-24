
import { useLocation } from 'react-router-dom';

export function useRouteTitle() {
  const location = useLocation();
  
  const routeTitleMap: Record<string, string> = {
    '/': 'Dashboard Financeiro',
    '/transacoes': 'Transações',
    '/recorrentes': 'Gastos Recorrentes',
    '/assinatura': 'Assinatura',
    '/relatorios': 'Relatórios',
    '/configuracoes': 'Configurações'
  };

  return routeTitleMap[location.pathname] || 'Dashboard Financeiro';
}
