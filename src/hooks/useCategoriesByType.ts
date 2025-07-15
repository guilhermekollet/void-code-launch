
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCategoriesByType(type: 'receita' | 'despesa' | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories', user?.id, type],
    queryFn: async () => {
      if (!user || !type) return [];

      // First get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userData.id)
        .eq('type', type)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories by type:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user && !!type,
  });
}
