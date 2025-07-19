
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

      return data || [];
    },
    enabled: !!user,
  });
}

export function useCreditCardTransactions(cardId: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-card-transactions', cardId, user?.id],
    queryFn: async () => {
      if (!user || !cardId) return [];

      // First get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return [];

      // Get current month transactions for this credit card
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('credit_card_id', cardId)
        .eq('is_credit_card_expense', true)
        .eq('type', 'despesa')
        .gte('tx_date', startOfMonth.toISOString())
        .lte('tx_date', endOfMonth.toISOString());

      if (error) {
        console.error('Error fetching credit card transactions:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user && !!cardId,
  });
}
