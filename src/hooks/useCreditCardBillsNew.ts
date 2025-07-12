import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, addMonths, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

export interface CreditCardBill {
  id: number;
  created_at: string;
  user_id: number;
  credit_card_id: number;
  bill_amount: number;
  due_date: string;
  close_date: string;
  status: 'pending' | 'paid' | 'overdue';
  paid_amount: number;
  remaining_amount: number;
  archived: boolean;
  credit_cards: {
    id: number;
    bank_name: string;
    card_name: string | null;
    color: string;
  };
}

interface Transaction {
  id: number;
  created_at: string;
  user_id: number;
  tx_date: string;
  description: string;
  value: number;
  type: 'receita' | 'despesa';
  category: string;
  is_recurring: boolean;
  credit_card_id: number | null;
  is_installment: boolean;
  installment_number: number | null;
  total_installments: number | null;
}

interface CreditCard {
  id: number;
  created_at: string;
  user_id: number;
  bank_name: string;
  card_name: string;
  close_date: number;
  due_date: number;
  color: string;
}

export const useCreditCardBillsNew = (selectedMonth?: Date) => {
  // Use 4-month range: 2 past + current + 1 future for timeline view
  const baseMonth = selectedMonth || new Date();
  const startDate = startOfMonth(subMonths(baseMonth, 2));
  const endDate = endOfMonth(addMonths(baseMonth, 1));

  return useQuery({
    queryKey: ['credit-card-bills', format(startDate, 'yyyy-MM'), format(endDate, 'yyyy-MM')],
    queryFn: async (): Promise<CreditCardBill[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userData) throw new Error('Dados do usuário não encontrados');

      const { data: bills, error } = await supabase
        .from('credit_card_bills')
        .select(`
          *,
          credit_cards (
            id,
            bank_name,
            card_name,
            color
          )
        `)
        .eq('user_id', userData.id)
        .gte('due_date', format(startDate, 'yyyy-MM-dd'))
        .lte('due_date', format(endDate, 'yyyy-MM-dd'))
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Type cast to ensure proper typing
      return (bills || []).map(bill => ({
        ...bill,
        status: bill.status as 'pending' | 'paid' | 'overdue'
      })) as CreditCardBill[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreditCardBills = useCreditCardBillsNew;

export const useArchiveBill = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (billId: number) => {
      const { error } = await supabase
        .from('credit_card_bills')
        .update({ archived: true })
        .eq('id', billId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
      toast({
        title: "Fatura arquivada",
        description: "A fatura foi arquivada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error archiving bill:', error);
      toast({
        title: "Erro ao arquivar",
        description: "Não foi possível arquivar a fatura.",
        variant: "destructive",
      });
    },
  });
};

export const usePayBill = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ billId, amount }: { billId: number; amount: number }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userData) throw new Error('Dados do usuário não encontrados');

      const { error } = await supabase
        .from('bill_payments')
        .insert({
          bill_id: billId,
          amount,
          user_id: userData.id,
        });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('credit_card_bills')
        .update({ 
          paid_amount: amount,
          remaining_amount: 0,
          status: 'paid'
        })
        .eq('id', billId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
      toast({
        title: "Pagamento registrado",
        description: "O pagamento da fatura foi registrado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error paying bill:', error);
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
    },
  });
};

export const useBillExpenses = () => {
  return useQuery({
    queryKey: ['bill-expenses'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userData) throw new Error('Dados do usuário não encontrados');

      const { data: bills } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('user_id', userData.id)
        .eq('status', 'pending');

      const totalExpenses = bills?.reduce((sum, bill) => sum + Number(bill.bill_amount), 0) || 0;

      return { totalExpenses, totalBillExpenses: totalExpenses };
    },
  });
};
