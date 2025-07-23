
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
import { useGroupedPurchases } from "@/hooks/useGroupedPurchases";

export default function Cartoes() {
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const { data: creditCards = [] } = useCreditCards();
  const { data: transactions = [] } = useTransactions();
  const groupedPurchases = useGroupedPurchases(transactions);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handlePurchaseDetails = (purchase: any) => {
    setSelectedPurchase(purchase);
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

  return (
    <div className="space-y-6">
      <CreditCardsSection />
      <BillsBarChart />

      {/* Seção de Compras Recentes do Cartão */}
      {groupedPurchases.length > 0 && (
        <Card className="bg-white border-[#E2E8F0]">
          <CardHeader>
            <CardTitle className="text-[#121212]">Compras Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedPurchases.slice(0, 10).map((purchase) => {
                const creditCardInfo = getCreditCardInfo(purchase.credit_card_id);
                const isInstallment = purchase.totalInstallments > 1;
                
                return (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0] hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#121212]">{purchase.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-[#64748B]">{purchase.category}</span>
                          <span className="text-sm text-[#64748B]">•</span>
                          <span className="text-sm text-[#64748B]">
                            {new Date(purchase.firstPaymentDate).toLocaleDateString('pt-BR')}
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
                              {creditCardInfo.card_name || creditCardInfo.bank_name}
                            </Badge>
                          )}
                          {isInstallment && (
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-gray-100"
                              onClick={() => handlePurchaseDetails(purchase)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {purchase.totalInstallments}x de {formatCurrency(purchase.installmentValue)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-[#121212]">
                        {formatCurrency(isInstallment ? purchase.totalValue : purchase.installmentValue)}
                      </p>
                      {isInstallment && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => handlePurchaseDetails(purchase)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Compra
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

      {selectedPurchase && (
        <InstallmentDetailsModal
          open={installmentModalOpen}
          onOpenChange={setInstallmentModalOpen}
          transactions={selectedPurchase.transactions}
          creditCardName={getCreditCardInfo(selectedPurchase.credit_card_id)?.card_name || getCreditCardInfo(selectedPurchase.credit_card_id)?.bank_name || 'Cartão'}
          creditCardColor={getCreditCardInfo(selectedPurchase.credit_card_id)?.color || '#e5e7eb'}
        />
      )}
    </div>
  );
}
