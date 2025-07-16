
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: number;
  name: string | null;
  email: string | null;
  phone_number: string;
  user_id: string | null;
  completed_onboarding: boolean | null;
  plan_type: string | null;
  billing_cycle: string | null;
}

export function useUserProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (updates: Partial<Pick<UserProfile, 'name' | 'email' | 'phone_number' | 'completed_onboarding'>>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      
      // Só mostrar toast se não foi apenas update do onboarding
      if (!('completed_onboarding' in variables && Object.keys(variables).length === 1)) {
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram salvas com sucesso.",
        });
      }
    },
    onError: (error, variables) => {
      // Só mostrar toast de erro se não foi apenas update do onboarding
      if (!('completed_onboarding' in variables && Object.keys(variables).length === 1)) {
        toast({
          title: "Erro ao atualizar perfil",
          description: "Não foi possível salvar as alterações.",
          variant: "destructive",
        });
      }
      console.error('Error updating profile:', error);
    },
  });
}
