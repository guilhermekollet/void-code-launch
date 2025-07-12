
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCreditCardBills } from "@/hooks/useCreditCardBillsNew";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  // Create timeline data for 4 months: 2 past + current + 1 future
  const today = new Date();
  const months = [
    subMonths(today, 2),
    subMonths(today, 1),
    today,
    addMonths(today, 1)
  ];

  const timelineData = months.map((month, index) => {
    const monthKey = format(month, 'yyyy-MM');
    const monthLabel = format(month, 'MMM yyyy', { locale: ptBR });
    
    // Filter bills for this month
    const monthBills = bills.filter(bill => {
      const billMonth = format(parseISO(bill.due_date), 'yyyy-MM');
      return billMonth === monthKey;
    });

    // Calculate totals
    const totalAmount = monthBills.reduce((sum, bill) => sum + bill.bill_amount, 0);
    const paidAmount = monthBills.reduce((sum, bill) => sum + bill.paid_amount, 0);
    const remainingAmount = monthBills.reduce((sum, bill) => sum + bill.remaining_amount, 0);
    
    // Determine status
    const isCurrent = index === 2; // Current month is at index 2
    const isPast = index < 2;
    const isFuture = index > 2;
    
    let status = 'pending';
    if (isPast && paidAmount === totalAmount && totalAmount > 0) {
      status = 'paid';
    } else if (isPast && remainingAmount > 0) {
      status = 'overdue';
    } else if (isFuture) {
      status = 'future';
    } else if (isCurrent) {
      status = 'current';
    }

    return {
      month: monthLabel,
      monthKey,
      totalAmount,
      paidAmount,
      remainingAmount,
      billsCount: monthBills.length,
      status,
      isCurrent,
      isPast,
      isFuture
    };
  });

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
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-[#121212] mb-2">{label}</p>
          <div className="space-y-2">
            {data.paidAmount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm">Pago: {formatCurrency(data.paidAmount)}</span>
              </div>
            )}
            {data.remainingAmount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-sm">Pendente: {formatCurrency(data.remainingAmount)}</span>
              </div>
            )}
            <div className="border-t pt-2">
              <p className="text-sm font-medium">
                Total: {formatCurrency(data.totalAmount)} • {data.billsCount} fatura{data.billsCount !== 1 ? 's' : ''}
              </p>
            </div>
            {data.isCurrent && (
              <div className="text-xs text-blue-600 font-medium">📅 Mês Atual</div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const maxValue = Math.max(...timelineData.map(d => d.totalAmount));

  return (
    <Card className="bg-white border-[#E2E8F0] shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#121212] text-xl font-semibold">Visão Geral das Faturas</CardTitle>
        <p className="text-[#64748B] text-sm">Timeline: 2 meses passados • atual • 1 futuro</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={timelineData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#64748B"
              fontSize={12}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              stroke="#64748B"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Paid amount - Green */}
            <Bar
              dataKey="paidAmount"
              stackId="bills"
              fill="#22C55E"
              name="Valor Pago"
              radius={[0, 0, 0, 0]}
            />
            
            {/* Remaining amount - Yellow */}
            <Bar
              dataKey="remainingAmount"
              stackId="bills"
              fill="#EAB308"
              name="Valor Pendente"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Legend and Status Indicators */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-[#64748B]">Valores Pagos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-[#64748B]">Valores Pendentes</span>
            </div>
          </div>
          
          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {timelineData.map((data, index) => (
              <div 
                key={data.monthKey} 
                className={`p-3 rounded-lg border text-center ${
                  data.isCurrent 
                    ? 'bg-blue-50 border-blue-200' 
                    : data.isPast 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="text-xs font-medium text-gray-600 mb-1">
                  {data.isPast ? '📅 Passado' : data.isCurrent ? '🔵 Atual' : '🔮 Futuro'}
                </div>
                <div className="text-sm font-semibold text-gray-800">{data.month}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {data.totalAmount > 0 ? formatCurrency(data.totalAmount) : 'Sem faturas'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
