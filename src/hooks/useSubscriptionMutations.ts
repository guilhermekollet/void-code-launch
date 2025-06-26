
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CheckoutParams {
  planType: string;
  billingCycle: 'monthly' | 'yearly';
}

export function useCreateCheckout() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CheckoutParams) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error) => {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar sessão de pagamento.",
        variant: "destructive",
      });
    },
  });
}

export function useCustomerPortal() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error) => {
      console.error('Error accessing customer portal:', error);
      toast({
        title: "Erro",
        description: "Erro ao acessar portal do cliente.",
        variant: "destructive",
      });
    },
  });
}

export function useRefreshSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast({
        title: "Sucesso",
        description: "Status da assinatura atualizado!",
      });
    },
    onError: (error) => {
      console.error('Error refreshing subscription:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da assinatura.",
        variant: "destructive",
      });
    },
  });
}
