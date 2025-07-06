
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CategoryData {
  name: string;
  icon: string;
  color: string;
  type: 'receita' | 'despesa';
}

export function useCategoryMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addCategory = useMutation({
    mutationFn: async (categoryData: CategoryData) => {
      if (!user) throw new Error('User not authenticated');

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

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Sucesso",
        description: "Categoria adicionada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...categoryData }: CategoryData & { id: number }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .update({
          name: categoryData.name,
          icon: categoryData.icon,
          color: categoryData.color,
          type: categoryData.type,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data'] });
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (categoryId: number) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data'] });
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria. Verifique se não há transações usando esta categoria.",
        variant: "destructive",
      });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['category-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data-period'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      toast({
        title: "Cor atualizada",
        description: "A cor da categoria foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a cor da categoria.",
        variant: "destructive",
      });
    },
  });

  return {
    addCategory,
    updateCategory,
    deleteCategory,
    updateCategoryColor,
  };
}
