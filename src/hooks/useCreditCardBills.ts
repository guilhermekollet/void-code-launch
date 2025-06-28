
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CreditCardBill {
  id: number;
  user_id: number;
  credit_card_id: number;
  bill_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
  credit_cards: {
    bank_name: string;
    card_name: string | null;
    color: string;
  };
}

export function useCreditCardBills() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-card-bills'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) throw new Error('User not found');

      const { data, error } = await supabase
        .from('credit_card_bills')
        .select(`
          *,
          credit_cards (
            bank_name,
            card_name,
            color
          )
        `)
        .eq('user_id', userData.id)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching credit card bills:', error);
        throw error;
      }

      return data as CreditCardBill[];
    },
    enabled: !!user,
  });
}

export function usePayBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ billId, paymentAmount }: { billId: number; paymentAmount: number }) => {
      if (!user) throw new Error('User not authenticated');

      // Get current bill details
      const { data: bill, error: billError } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('id', billId)
        .single();

      if (billError || !bill) throw new Error('Bill not found');

      const newPaidAmount = bill.paid_amount + paymentAmount;
      const newRemainingAmount = bill.bill_amount - newPaidAmount;
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'pending';

      // Update bill
      const { error } = await supabase
        .from('credit_card_bills')
        .update({
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus,
        })
        .eq('id', billId);

      if (error) throw error;

      return { billId, paymentAmount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error paying bill:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}
