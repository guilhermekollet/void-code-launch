
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ModifySubscriptionParams {
  planType: 'basic' | 'premium';
  billingCycle: 'monthly' | 'yearly';
  action: 'upgrade' | 'downgrade' | 'change_cycle';
}

export function useModifySubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ModifySubscriptionParams) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('modify-subscription', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      
      if (data.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecionando...",
          description: "Você será redirecionado para completar a alteração.",
        });
      } else if (data.action === 'subscription_modified') {
        toast({
          title: "Sucesso!",
          description: "Sua assinatura foi modificada com sucesso.",
        });
      }
    },
    onError: (error) => {
      console.error('Error modifying subscription:', error);
      toast({
        title: "Erro",
        description: "Erro ao modificar assinatura. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}
