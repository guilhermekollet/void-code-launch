import { useCreditCardBills } from "@/hooks/useCreditCardBillsNew";
import { useCreditCards } from "@/hooks/useCreditCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addMonths, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, DollarSign, AlertCircle } from "lucide-react";

export function BillsTimelineChart() {
  const { data: bills = [], isLoading: billsLoading } = useCreditCardBills();
  const { data: creditCards = [], isLoading: cardsLoading } = useCreditCards();

  if (billsLoading || cardsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline de Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-200';
      case 'overdue':
        return 'bg-red-500/20 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <DollarSign className="h-3 w-3" />;
      case 'overdue':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <CreditCard className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paga';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencida';
      case 'partial':
        return 'Parcial';
      default:
        return 'Desconhecido';
    }
  };

  // Generate timeline for current and next 2 months
  const currentDate = new Date();
  const timelineMonths = Array.from({ length: 3 }, (_, i) => addMonths(currentDate, i));

  // Group bills by month and card
  const billsByMonth = timelineMonths.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthBills = bills.filter(bill => {
      const dueDate = new Date(bill.due_date);
      return isAfter(dueDate, monthStart) && isBefore(dueDate, monthEnd);
    });

    return {
      month,
      bills: monthBills,
      totalAmount: monthBills.reduce((sum, bill) => sum + Number(bill.bill_amount), 0),
      totalRemaining: monthBills.reduce((sum, bill) => sum + Number(bill.remaining_amount), 0),
    };
  });

  // Calculate summary statistics
  const totalPending = bills
    .filter(bill => bill.status === 'pending' || bill.status === 'overdue')
    .reduce((sum, bill) => sum + Number(bill.remaining_amount), 0);

  const upcomingBills = bills.filter(bill => {
    const dueDate = new Date(bill.due_date);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return isAfter(dueDate, new Date()) && isBefore(dueDate, nextWeek);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Timeline de Faturas
        </CardTitle>
        
        {/* Summary stats */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Total pendente:</span>
            <span className="font-semibold text-red-600">{formatCurrency(totalPending)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Próximas 7 dias:</span>
            <span className="font-semibold text-orange-600">{upcomingBills.length} faturas</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Total de cartões:</span>
            <span className="font-semibold">{creditCards.length}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {billsByMonth.map(({ month, bills: monthBills, totalAmount, totalRemaining }) => (
            <div key={month.toISOString()} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {format(month, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Total: {formatCurrency(totalAmount)}</span>
                  {totalRemaining > 0 && (
                    <span className="text-red-600">Pendente: {formatCurrency(totalRemaining)}</span>
                  )}
                </div>
              </div>

              {monthBills.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma fatura para este mês</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {monthBills.map(bill => {
                    const card = creditCards.find(c => c.id === bill.credit_card_id);
                    return (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-8 rounded-sm"
                            style={{
                              background: card?.color || 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                            }}
                          />
                          <div>
                            <p className="font-medium">{card?.bank_name} - {card?.card_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Vence em {format(new Date(bill.due_date), 'd \'de\' MMMM', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(Number(bill.bill_amount))}</p>
                            {Number(bill.remaining_amount) > 0 && (
                              <p className="text-sm text-red-600">
                                Resta: {formatCurrency(Number(bill.remaining_amount))}
                              </p>
                            )}
                          </div>
                          
                          <Badge className={`${getStatusColor(bill.status)} flex items-center gap-1`}>
                            {getStatusIcon(bill.status)}
                            {getStatusLabel(bill.status)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {bills.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma fatura encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Adicione transações em cartões de crédito para gerar faturas automaticamente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}