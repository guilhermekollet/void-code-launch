
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, TrendingUp, FileText, BarChart3, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/configuracoes');
  };

  const reportFeatures = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Análise detalhada de gastos por categoria",
      description: "Visualize seus gastos organizados por categorias com gráficos interativos"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Fluxo de caixa mensal",
      description: "Acompanhe a evolução das suas receitas e despesas mês a mês"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Comparação de períodos",
      description: "Compare seus gastos entre diferentes meses e períodos"
    },
    {
      icon: <Download className="h-5 w-5" />,
      title: "Exportação em PDF e Excel",
      description: "Baixe seus relatórios em formato PDF ou planilha Excel"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Gráficos avançados de tendências",
      description: "Visualize tendências de gastos e projeções futuras"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#61710C]" />
            Relatórios é uma funcionalidade premium
          </DialogTitle>
          <DialogDescription>
            Upgrade para o plano Premium e tenha acesso a relatórios financeiros avançados
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          <div className="text-center space-y-2">
            <p className="text-base text-gray-700 font-medium">
              Com o plano Premium, você terá acesso a:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                <div className="text-[#61710C] mt-1">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{feature.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-6">
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="px-8"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpgrade} 
                className="bg-[#61710C] hover:bg-[#61710C]/90 px-8"
              >
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
