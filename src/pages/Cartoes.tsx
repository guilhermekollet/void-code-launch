
import { CreditCardsSection } from "@/components/Dashboard/CreditCardsSection";
import { BillsBarChart } from "@/components/CreditCards/BillsBarChart";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, CreditCard } from "lucide-react";
import { InstallmentDetailsModal } from "@/components/CreditCards/InstallmentDetailsModal";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useTransactions } from "@/hooks/useFinancialData";
import { useInstallmentTransactions } from "@/hooks/useInstallmentTransactions";

export default function Cartoes() {
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const { data: creditCards = [] } = useCreditCards();
  const { data: transactions = [] } = useTransactions();
  const { data: installmentTransactions = [] } = useInstallmentTransactions(
    selectedInstallment?.description || '',
    selectedInstallment?.total_installments || 0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleInstallmentDetails = (transaction: any) => {
    setSelectedInstallment(transaction);
    setInstallmentModalOpen(true);
  };

  const getCreditCardInfo = (creditCardId?: number) => {
    if (!creditCardId) return null;
    return creditCards.find(card => card.id === creditCardId);
  };

  const getContrastColor = (backgroundColor: string) => {
    if (!backgroundColor || backgroundColor === '#ffffff' || backgroundColor === 'white') {
      return '#000000';
    }
    return '#ffffff';
  };

  // Filtrar transações de cartão de crédito
  const creditCardTransactions = transactions.filter(t => t.is_credit_card_expense);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#121212]">Cartões de Crédito</h1>
          <p className="text-[#64748B] mt-1">Gerencie seus cartões de crédito</p>
        </div>
      </div>

      <BillsBarChart />
      <CreditCardsSection />

      {/* Seção de Transações Recentes do Cartão */}
      {creditCardTransactions.length > 0 && (
        <Card className="bg-white border-[#E2E8F0]">
          <CardHeader>
            <CardTitle className="text-[#121212]">Compras Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creditCardTransactions.slice(0, 10).map((transaction) => {
                const creditCardInfo = getCreditCardInfo(transaction.credit_card_id);
                const isInstallment = transaction.total_installments && transaction.total_installments > 1;
                
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0] hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#121212]">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-[#64748B]">{transaction.category}</span>
                          <span className="text-sm text-[#64748B]">•</span>
                          <span className="text-sm text-[#64748B]">
                            {new Date(transaction.tx_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {creditCardInfo && (
                            <Badge
                              className="text-xs px-2 py-1"
                              style={{
                                backgroundColor: creditCardInfo.color,
                                color: getContrastColor(creditCardInfo.color),
                                border: `1px solid ${creditCardInfo.color}`
                              }}
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              {creditCardInfo.card_name || creditCardInfo.bank_name}
                            </Badge>
                          )}
                          {isInstallment && (
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-gray-100"
                              onClick={() => handleInstallmentDetails(transaction)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {transaction.installment_number}/{transaction.total_installments}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-[#121212]">
                        {formatCurrency(transaction.value)}
                      </p>
                      {isInstallment && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleInstallmentDetails(transaction)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Parcelas
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedInstallment && (
        <InstallmentDetailsModal
          open={installmentModalOpen}
          onOpenChange={setInstallmentModalOpen}
          transactions={installmentTransactions}
          creditCardName={getCreditCardInfo(selectedInstallment.credit_card_id)?.card_name || getCreditCardInfo(selectedInstallment.credit_card_id)?.bank_name || 'Cartão'}
          creditCardColor={getCreditCardInfo(selectedInstallment.credit_card_id)?.color || '#e5e7eb'}
        />
      )}
    </div>
  );
}
