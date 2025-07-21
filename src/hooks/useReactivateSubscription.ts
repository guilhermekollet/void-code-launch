import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useReactivateSubscription() {
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ planType, billingCycle }: { planType: string; billingCycle: string }) => {
      console.log('[useReactivateSubscription] Reactivating subscription:', { planType, billingCycle });
      
      if (!user?.id || !user?.email) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.functions.invoke('reactivate-subscription', {
        body: { 
          planType, 
          billingCycle,
          userId: user.id,
          email: user.email
        }
      });

      if (error) {
        console.error('Error reactivating subscription:', error);
        throw error;
      }

      // Abrir em nova aba
      if (data?.url) {
        window.open(data.url, '_blank');
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('[useReactivateSubscription] Reactivation checkout created:', data);
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para finalizar a reativação.",
      });
    },
    onError: (error) => {
      console.error('Error in subscription reactivation:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar reativação. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}