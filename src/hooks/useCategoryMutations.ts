
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useCategoryMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateCategoryColor = useMutation({
    mutationFn: async ({ categoryId, color }: { categoryId: number; color: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('categories')
        .update({ color })
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate and refetch category data
      queryClient.invalidateQueries({ queryKey: ['category-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data-period'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      toast({
        title: "Cor atualizada",
        description: "A cor da categoria foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating category color:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a cor da categoria.",
        variant: "destructive",
      });
    },
  });

  return {
    updateCategoryColor,
  };
}
