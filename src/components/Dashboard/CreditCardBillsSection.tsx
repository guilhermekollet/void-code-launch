
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCardBillItem } from "./CreditCardBillItem";
import { useCreditCardBills } from "@/hooks/useCreditCardBills";
import { Skeleton } from "@/components/ui/skeleton";

export function CreditCardBillsSection() {
  const { data: bills = [], isLoading } = useCreditCardBills();

  if (isLoading) {
    return (
      <Card className="bg-white border-[#E2E8F0]">
        <CardHeader>
          <CardTitle className="text-[#121212] text-2xl font-semibold">Faturas dos Cartões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bills.length === 0) {
    return (
      <Card className="bg-white border-[#E2E8F0]">
        <CardHeader>
          <CardTitle className="text-[#121212] text-2xl font-semibold">Faturas dos Cartões</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#64748B] text-center py-8">
            Nenhuma fatura encontrada. As faturas serão geradas automaticamente com base nas suas compras.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-[#E2E8F0]">
      <CardHeader>
        <CardTitle className="text-[#121212] text-2xl font-semibold">Faturas dos Cartões</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map((bill) => (
            <CreditCardBillItem key={bill.id} bill={bill} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
