
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCategories(type?: 'receita' | 'despesa') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories', user?.id, type],
    queryFn: async () => {
      if (!user) return [];

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return [];

      let query = supabase
        .from('categories')
        .select('*')
        .eq('user_id', userData.id)
        .order('name', { ascending: true });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user,
  });
}
