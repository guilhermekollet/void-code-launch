import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useUpdateRecurringTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast({
        title: "Sucesso",
        description: "Despesa recorrente atualizada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error updating recurring transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar despesa recorrente.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteRecurringTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast({
        title: "Sucesso",
        description: "Despesa recorrente excluída com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error deleting recurring transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir despesa recorrente.",
        variant: "destructive",
      });
    },
  });
}

export function useToggleRecurringTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, isRecurring }: { id: number; isRecurring: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .update({ is_recurring: !isRecurring })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast({
        title: "Sucesso",
        description: "Status da despesa recorrente atualizado!",
      });
    },
    onError: (error) => {
      console.error('Error toggling recurring transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da despesa.",
        variant: "destructive",
      });
    },
  });
}
