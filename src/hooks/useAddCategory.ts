
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CategoryData {
  name: string;
  icon: string;
  color: string;
  type: string;
}

export function useAddCategory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categoryData: CategoryData) => {
      if (!user) throw new Error('User not authenticated');

      // First get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) throw new Error('User not found');

      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: userData.id,
          name: categoryData.name,
          icon: categoryData.icon,
          color: categoryData.color,
          type: categoryData.type,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding category:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Sucesso",
        description: "Categoria adicionada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error adding category:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}
