
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface TransactionUpdateData {
  id: number;
  description?: string;
  value?: number;
  category?: string;
  tx_date?: string;
  credit_card_id?: number | null;
  type?: string;
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: TransactionUpdateData) => {
      console.log('Updating transaction:', { id, updateData });
      
      // Validar dados obrigatórios
      if (!id || id <= 0) {
        throw new Error('Valid transaction ID is required');
      }

      // Validate numeric values
      if (updateData.value !== undefined) {
        if (updateData.value <= 0) {
          throw new Error('Amount must be greater than 0');
        }
        if (updateData.value > 999999999) {
          throw new Error('Amount is too large');
        }
      }

      // Validate type
      if (updateData.type !== undefined && !['receita', 'despesa'].includes(updateData.type)) {
        throw new Error('Invalid transaction type');
      }

      // Validate text fields
      if (updateData.description !== undefined) {
        if (updateData.description.trim().length === 0) {
          throw new Error('Description cannot be empty');
        }
        if (updateData.description.length > 500) {
          throw new Error('Description is too long (max 500 characters)');
        }
      }

      if (updateData.category !== undefined && updateData.category.trim().length === 0) {
        throw new Error('Category cannot be empty');
      }

      // Validate date
      if (updateData.tx_date !== undefined) {
        const txDate = new Date(updateData.tx_date);
        if (isNaN(txDate.getTime())) {
          throw new Error('Invalid transaction date');
        }
      }

      // Validate credit card ownership if specified
      if (updateData.credit_card_id !== undefined && updateData.credit_card_id !== null) {
        const { data: cardOwnership, error: cardError } = await supabase
          .from('credit_cards')
          .select('user_id')
          .eq('id', updateData.credit_card_id)
          .single();

        if (cardError || !cardOwnership) {
          throw new Error('Invalid credit card');
        }
      }

      // Preparar dados para atualização, removendo campos undefined
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      console.log('Clean update data:', cleanUpdateData);

      // Verificar se há dados para atualizar
      if (Object.keys(cleanUpdateData).length === 0) {
        throw new Error('Nenhum dado válido para atualização');
      }

      // Adicionar timestamp de atualização
      const dataToUpdate = {
        ...cleanUpdateData,
        registered_at: new Date().toISOString()
      };

      console.log('Final data to update:', dataToUpdate);

      const { data, error } = await supabase
        .from('transactions')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Erro ao atualizar transação: ${error.message}`);
      }

      console.log('Transaction updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Transaction update successful:', data);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data'] });
      
      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Transaction update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      console.log('Deleting transaction:', id);
      
      if (!id) {
        throw new Error('ID da transação é obrigatório');
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Erro ao excluir transação: ${error.message}`);
      }

      console.log('Transaction deleted successfully');
      return id;
    },
    onSuccess: () => {
      console.log('Transaction deletion successful');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
      queryClient.invalidateQueries({ queryKey: ['category-chart-data'] });
      
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Transaction deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}
