
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CreditCardData {
  bank_name: string;
  card_name?: string;
  close_date?: number;
  due_date: number;
  card_type: 'VISA' | 'Mastercard' | 'Outro';
  color: string;
}

export function useAddCreditCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (cardData: CreditCardData) => {
      if (!user) throw new Error('User not authenticated');

      // First get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) throw new Error('User not found');

      const { data, error } = await supabase
        .from('credit_cards')
        .insert({
          user_id: userData.id,
          bank_name: cardData.bank_name,
          card_name: cardData.card_name || cardData.bank_name,
          close_date: cardData.close_date,
          due_date: cardData.due_date,
          card_type: cardData.card_type,
          color: cardData.color,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding credit card:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      toast({
        title: "Sucesso",
        description: "Cartão de crédito adicionado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error adding credit card:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar cartão de crédito. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCreditCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CreditCardData> }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('credit_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating credit card:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      toast({
        title: "Sucesso",
        description: "Cartão de crédito atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error updating credit card:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar cartão de crédito. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCreditCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting credit card:', error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      toast({
        title: "Sucesso",
        description: "Cartão de crédito excluído com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error deleting credit card:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir cartão de crédito. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}
