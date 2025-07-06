
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCardBillItem } from "./CreditCardBillItem";
import { useCreditCardBills } from "@/hooks/useCreditCardBillsNew";
import { useCreditCards } from "@/hooks/useCreditCards";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CreditCardBillsSection() {
  const { data: bills = [], isLoading } = useCreditCardBills();
  const { data: creditCards = [] } = useCreditCards();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-[#121212] text-xl font-semibold">Faturas dos Cartões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px] rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show the section if user has no credit cards
  if (creditCards.length === 0) {
    return null;
  }

  if (bills.length === 0) {
    return (
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-[#121212] text-xl font-semibold">Faturas dos Cartões</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#64748B] text-center py-6 text-sm">
            Nenhuma fatura encontrada. As faturas aparecerão automaticamente quando houver compras registradas no cartão de crédito.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Limit to show only 2 bills
  const limitedBills = bills.slice(0, 2);
  const hasMoreBills = bills.length > 2;

  return (
    <Card className="bg-white border-[#E2E8F0] shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#121212] text-xl font-semibold">Faturas dos Cartões</CardTitle>
          {hasMoreBills && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/cartoes')}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver todas ({bills.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {limitedBills.map((bill) => (
            <CreditCardBillItem key={bill.id} bill={bill} compact />
          ))}
        </div>
        {hasMoreBills && (
          <div className="text-center mt-4">
            <p className="text-xs text-[#64748B]">
              Mostrando 2 de {bills.length} faturas. 
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => navigate('/cartoes')}
                className="p-0 ml-1 h-auto text-xs"
              >
                Ver todas
              </Button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
