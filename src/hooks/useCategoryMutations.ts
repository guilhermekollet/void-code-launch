
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

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ 
      categoryId, 
      name, 
      icon, 
      color, 
      type 
    }: { 
      categoryId: number; 
      name: string; 
      icon: string; 
      color: string; 
      type: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('categories')
        .update({ name, icon, color, type })
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data-period'] });
      
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria.",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      if (!user) throw new Error('User not authenticated');

      // Check if category has transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('category', (await supabase.from('categories').select('name').eq('id', categoryId).single()).data?.name || '')
        .limit(1);

      if (transactions && transactions.length > 0) {
        throw new Error('Não é possível excluir uma categoria que possui transações vinculadas.');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data-period'] });
      
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting category:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a categoria.",
        variant: "destructive",
      });
    },
  });

  return {
    updateCategoryColor,
    updateCategoryMutation,
    deleteCategoryMutation,
  };
}
