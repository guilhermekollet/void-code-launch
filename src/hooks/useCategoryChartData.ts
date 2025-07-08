
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCategoryChartData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['category-chart-data', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return [];

      // Get transactions with category data
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .eq('type', 'despesa');

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        return [];
      }

      // Get categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userData.id);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return [];
      }

      // Group transactions by category and calculate totals
      const categoryTotals = transactions.reduce((acc, transaction) => {
        const categoryName = transaction.category;
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += Number(transaction.value);
        return acc;
      }, {} as Record<string, number>);

      // Create chart data with real category colors and icons
      const chartData = Object.entries(categoryTotals)
        .map(([categoryName, total]) => {
          const categoryInfo = categories.find(cat => cat.name === categoryName);
          return {
            name: categoryName,
            value: total,
            color: categoryInfo?.color || '#61710C',
            icon: categoryInfo?.icon || 'tag'
          };
        })
        .sort((a, b) => b.value - a.value); // Sort by value descending

      return chartData;
    },
    enabled: !!user,
  });
}
