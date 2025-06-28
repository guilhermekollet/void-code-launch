
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CreditCard {
  id: number;
  user_id: number;
  bank_name: string;
  card_name: string | null;
  close_date: number | null;
  due_date: number;
  card_type: 'VISA' | 'Mastercard' | 'Outro';
  color: string;
  created_at: string;
  updated_at: string;
}

export function useCreditCards() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-cards', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return [];

      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching credit cards:', error);
        return [];
      }

      return (data || []) as CreditCard[];
    },
    enabled: !!user,
  });
}

export function useCreditCardExpenses(cardId: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-card-expenses', cardId, user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // First get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userData.id)
        .eq('credit_card_id', cardId)
        .eq('is_credit_card_expense', true)
        .gte('tx_date', new Date(currentYear, currentMonth, 1).toISOString())
        .lt('tx_date', new Date(currentYear, currentMonth + 1, 1).toISOString());

      if (error) {
        console.error('Error fetching credit card expenses:', error);
        return 0;
      }

      return data?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
    },
    enabled: !!user && !!cardId,
  });
}
