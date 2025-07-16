
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export function useModifySubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ planType, billingCycle }: { planType: string; billingCycle: string }) => {
      console.log('[useModifySubscription] Modifying subscription:', { planType, billingCycle });
      
      const { data, error } = await supabase.functions.invoke('modify-subscription', {
        body: { planType, billingCycle }
      });

      if (error) {
        console.error('Error modifying subscription:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('[useModifySubscription] Subscription modified successfully:', data);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      
      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error in subscription modification:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

export function useCreateCheckout() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ planType, billingCycle }: { planType: string; billingCycle: string }) => {
      console.log('[useCreateCheckout] Creating checkout:', { planType, billingCycle });
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType, billingCycle }
      });

      if (error) {
        console.error('Error creating checkout:', error);
        throw error;
      }

      // Abrir em nova aba
      if (data?.url) {
        window.open(data.url, '_blank');
      }

      return data;
    },
    onError: (error) => {
      console.error('Error in checkout creation:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar checkout. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

export function useCustomerPortal() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      console.log('[useCustomerPortal] Opening customer portal');
      
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Error opening customer portal:', error);
        throw error;
      }

      // Abrir em nova aba
      if (data?.url) {
        window.open(data.url, '_blank');
      }

      return data;
    },
    onError: (error) => {
      console.error('Error in customer portal:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir portal de gerenciamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

export function useRefreshSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      console.log('[useRefreshSubscription] Refreshing subscription status');
      
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error refreshing subscription:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      console.log('[useRefreshSubscription] Subscription refreshed successfully');
      
      // Invalidar queries relacionadas para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      
      toast({
        title: "Sucesso",
        description: "Status da assinatura atualizado!",
      });
    },
    onError: (error) => {
      console.error('Error in subscription refresh:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}
