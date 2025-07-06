
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCreditCardBills } from "@/hooks/useCreditCardBillsNew";
import { Skeleton } from "@/components/ui/skeleton";

export function BillsBarChart() {
  const { data: bills = [], isLoading } = useCreditCardBills();

  if (isLoading) {
    return (
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#121212] text-xl font-semibold">Visão Geral das Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (bills.length === 0) {
    return (
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#121212] text-xl font-semibold">Visão Geral das Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#64748B] text-center py-6 text-sm">
            Nenhuma fatura encontrada para exibir no gráfico.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group bills by credit card
  const billsByCard = bills.reduce((acc, bill) => {
    const cardName = bill.credit_cards.card_name || bill.credit_cards.bank_name;
    const existingCard = acc.find(item => item.cardName === cardName);
    
    if (existingCard) {
      existingCard.totalAmount += bill.bill_amount;
      existingCard.paidAmount += bill.paid_amount;
      existingCard.remainingAmount += bill.remaining_amount;
      if (bill.status === 'paid') {
        existingCard.paidBills += 1;
      } else {
        existingCard.pendingBills += 1;
      }
    } else {
      acc.push({
        cardName,
        totalAmount: bill.bill_amount,
        paidAmount: bill.paid_amount,
        remainingAmount: bill.remaining_amount,
        paidBills: bill.status === 'paid' ? 1 : 0,
        pendingBills: bill.status === 'paid' ? 0 : 1,
        color: bill.credit_cards.color
      });
    }
    
    return acc;
  }, [] as any[]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-[#121212]">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-green-600">
              Pagas: {formatCurrency(data.paidAmount)} ({data.paidBills} fatura{data.paidBills !== 1 ? 's' : ''})
            </p>
            <p className="text-sm text-yellow-600">
              Pendentes: {formatCurrency(data.remainingAmount)} ({data.pendingBills} fatura{data.pendingBills !== 1 ? 's' : ''})
            </p>
            <p className="text-sm font-medium text-[#121212] border-t pt-1">
              Total: {formatCurrency(data.totalAmount)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white border-[#E2E8F0] shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#121212] text-xl font-semibold">Visão Geral das Faturas</CardTitle>
        <p className="text-[#64748B] text-sm">Valores pagos (verde) vs pendentes (amarelo) por cartão</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={billsByCard}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="cardName" 
              stroke="#64748B"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#64748B"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="paidAmount"
              stackId="a"
              fill="#22C55E"
              name="Valor Pago"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="remainingAmount"
              stackId="a"
              fill="#EAB308"
              name="Valor Pendente"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-[#64748B]">Faturas Pagas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-[#64748B]">Faturas Pendentes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
