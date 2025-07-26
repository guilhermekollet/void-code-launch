
import { CreditCardsSection } from "@/components/Dashboard/CreditCardsSection";
import { BillsBarChart } from "@/components/CreditCards/BillsBarChart";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, CreditCard, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { InstallmentDetailsModal } from "@/components/CreditCards/InstallmentDetailsModal";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useTransactions } from "@/hooks/useFinancialData";
import { useGroupedPurchases } from "@/hooks/useGroupedPurchases";
import { useCreditCardBills } from "@/hooks/useCreditCardBillsNew";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Cartoes() {
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const { data: creditCards = [] } = useCreditCards();
  const { data: transactions = [] } = useTransactions();
  const { data: bills = [] } = useCreditCardBills();
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

  // Calculate summary stats
  const totalBillAmount = bills.reduce((sum, bill) => sum + bill.bill_amount, 0);
  const totalPaidAmount = bills.reduce((sum, bill) => sum + bill.paid_amount, 0);
  const totalRemainingAmount = bills.reduce((sum, bill) => sum + bill.remaining_amount, 0);
  const upcomingBills = bills.filter(bill => new Date(bill.due_date) > new Date()).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-[#E2E8F0]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Total em Faturas</p>
                <p className="text-lg font-semibold text-[#121212]">{formatCurrency(totalBillAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E2E8F0]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Valores Pagos</p>
                <p className="text-lg font-semibold text-[#121212]">{formatCurrency(totalPaidAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E2E8F0]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Pendente</p>
                <p className="text-lg font-semibold text-[#121212]">{formatCurrency(totalRemainingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E2E8F0]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Próximas Faturas</p>
                <p className="text-lg font-semibold text-[#121212]">{upcomingBills}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Cards Section */}
      <CreditCardsSection />
      
      {/* Bills Bar Chart */}
      <BillsBarChart />

      {/* Bills List */}
      {bills.length > 0 && (
        <Card className="bg-white border-[#E2E8F0]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#121212]">Faturas Detalhadas</CardTitle>
            <p className="text-sm text-[#64748B]">Todas as faturas dos seus cartões</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bills.map((bill) => {
                const creditCardInfo = getCreditCardInfo(bill.credit_card_id);
                const isOverdue = new Date(bill.due_date) < new Date() && bill.status !== 'paid';
                const isPaid = bill.status === 'paid';
                
                return (
                  <div
                    key={bill.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isPaid 
                        ? 'border-green-200 bg-green-50' 
                        : isOverdue 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-[#E2E8F0] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isPaid 
                          ? 'bg-green-100' 
                          : isOverdue 
                          ? 'bg-red-100' 
                          : 'bg-blue-50'
                      }`}>
                        <CreditCard className={`h-5 w-5 ${
                          isPaid 
                            ? 'text-green-600' 
                            : isOverdue 
                            ? 'text-red-600' 
                            : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#121212]">
                            {creditCardInfo?.card_name || creditCardInfo?.bank_name || 'Cartão'}
                          </p>
                          <Badge
                            variant={isPaid ? 'default' : isOverdue ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {isPaid ? 'Paga' : isOverdue ? 'Vencida' : 'Pendente'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-[#64748B]">
                            Vencimento: {format(parseISO(bill.due_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          {bill.close_date && (
                            <>
                              <span className="text-sm text-[#64748B]">•</span>
                              <span className="text-sm text-[#64748B]">
                                Fechamento: {format(parseISO(bill.close_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </>
                          )}
                        </div>
                        {bill.paid_amount > 0 && bill.remaining_amount > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            Pago: {formatCurrency(bill.paid_amount)} de {formatCurrency(bill.bill_amount)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-[#121212]">
                        {formatCurrency(bill.bill_amount)}
                      </p>
                      {bill.remaining_amount > 0 && !isPaid && (
                        <p className="text-sm text-red-600 font-medium">
                          Restante: {formatCurrency(bill.remaining_amount)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção de Compras Recentes do Cartão */}
      {groupedPurchases.length > 0 && (
        <Card className="bg-white border-[#E2E8F0]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#121212]">Compras Recentes</CardTitle>
            <p className="text-sm text-[#64748B]">Últimas transações no cartão de crédito</p>
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
