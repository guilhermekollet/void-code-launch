
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useDeleteAccount() {
  const { toast } = useToast();
  const { signOut } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('delete-user-account');
      
      if (error) {
        throw error;
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: async () => {
      toast({
        title: "Conta excluída com sucesso",
        description: "Todos os seus dados foram arquivados e sua conta foi removida.",
      });
      
      // Sign out the user
      await signOut();
    },
    onError: (error: any) => {
      console.error('Error deleting account:', error);
      toast({
        title: "Erro ao excluir conta",
        description: error.message || "Não foi possível excluir sua conta. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}
