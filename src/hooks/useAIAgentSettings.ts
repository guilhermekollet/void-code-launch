
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AIAgentSettings {
  id: string;
  user_id: string;
  phone_number: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useAIAgentSettings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['aiAgentSettings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('ai_agent_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as AIAgentSettings | null;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateAIAgentSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (settings: Partial<Pick<AIAgentSettings, 'phone_number' | 'is_enabled'>>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // First try to update if exists
      const { data: existing } = await supabase
        .from('ai_agent_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from('ai_agent_settings')
          .update(settings)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('ai_agent_settings')
          .insert({
            user_id: user.id,
            ...settings,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiAgentSettings'] });
      toast({
        title: "Configurações salvas",
        description: "Configurações do agente de IA atualizadas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
      console.error('Error updating AI agent settings:', error);
    },
  });
}
