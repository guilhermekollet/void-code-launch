
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLastUsedCreditCard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['last-used-credit-card'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('last_used_credit_card_id')
        .eq('user_id', user.id)
        .single();

      if (!userData || !userData.last_used_credit_card_id) return null;

      const { data: creditCard, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('id', userData.last_used_credit_card_id)
        .single();

      if (error) return null;
      return creditCard;
    },
    enabled: !!user,
  });
}

export function useUpdateLastUsedCreditCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (creditCardId: number) => {
      if (!user) throw new Error('User not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) throw new Error('User not found');

      const { error } = await supabase
        .from('users')
        .update({ last_used_credit_card_id: creditCardId })
        .eq('id', userData.id);

      if (error) throw error;
      return creditCardId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['last-used-credit-card'] });
    },
  });
}
