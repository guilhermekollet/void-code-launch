
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InstallmentTransaction {
  id: number;
  description: string;
  value: number;
  tx_date: string;
  installment_number: number;
  total_installments: number;
  category: string;
}

interface InstallmentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: InstallmentTransaction[];
  creditCardName: string;
  creditCardColor: string;
}

export function InstallmentDetailsModal({
  open,
  onOpenChange,
  transactions,
  creditCardName,
  creditCardColor
}: InstallmentDetailsModalProps) {
  if (!transactions || transactions.length === 0) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getContrastColor = (backgroundColor: string) => {
    if (!backgroundColor || backgroundColor === '#ffffff' || backgroundColor === 'white') {
      return '#000000';
    }
    return '#ffffff';
  };

  const baseTransaction = transactions[0];
  const totalAmount = transactions.reduce((sum, t) => sum + t.value, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-[#121212] flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: creditCardColor }}
            >
              <CreditCard 
                className="h-4 w-4" 
                style={{ color: getContrastColor(creditCardColor) }}
              />
            </div>
            Detalhes do Parcelamento
          </DialogTitle>
          <div className="flex items-center gap-2 text-[#64748B]">
            <span>{creditCardName}</span>
            <span>•</span>
            <span>{baseTransaction.category}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <div className="bg-[#F8F9FA] p-4 rounded-lg border border-[#E2E8F0]">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-[#64748B]">Valor Total</p>
                <p className="text-lg font-bold text-[#121212]">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Parcelas</p>
                <p className="text-lg font-bold text-[#121212]">
                  {baseTransaction.total_installments}x de {formatCurrency(baseTransaction.value)}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Parcelas */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#121212] flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Parcelas
            </h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((transaction) => {
                const isPaid = new Date(transaction.tx_date) <= new Date();
                
                return (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isPaid ? 'bg-green-50 border-green-200' : 'bg-white border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={isPaid ? "default" : "outline"}
                        className={`text-xs ${
                          isPaid ? 'bg-green-100 text-green-700 border-green-200' : ''
                        }`}
                      >
                        {transaction.installment_number}/{transaction.total_installments}
                      </Badge>
                      <div>
                        <p className="font-medium text-[#121212]">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-[#64748B]">
                          {format(new Date(transaction.tx_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-[#121212]">
                        {formatCurrency(transaction.value)}
                      </p>
                      <p className={`text-xs ${
                        isPaid ? 'text-green-600' : 'text-[#64748B]'
                      }`}>
                        {isPaid ? 'Processada' : 'Pendente'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
