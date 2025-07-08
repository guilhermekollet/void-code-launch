
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCategoryChartDataWithPeriod(period: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['category-chart-data-period', user?.id, period],
    queryFn: async () => {
      if (!user) return [];

      // First get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userData) return [];

      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      // Check if period is in days or months
      if (period.endsWith('d')) {
        const days = parseInt(period.replace('d', ''));
        startDate.setDate(startDate.getDate() - days);
      } else {
        const months = parseInt(period);
        startDate.setMonth(startDate.getMonth() - months);
      }

      // Get transactions with category data for the specified period
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .eq('type', 'despesa')
        .gte('tx_date', startDate.toISOString())
        .lte('tx_date', endDate.toISOString());

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
            icon: categoryInfo?.icon || 'tag',
            id: categoryInfo?.id
          };
        })
        .sort((a, b) => b.value - a.value); // Sort by value descending

      return chartData;
    },
    enabled: !!user,
  });
}
