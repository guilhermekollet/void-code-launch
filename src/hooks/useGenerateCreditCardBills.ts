
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  parseISO, 
  isSameMonth, 
  getDate,
  setDate,
  isAfter,
  addDays
} from 'date-fns';

export const useGenerateCreditCardBills = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (selectedMonth: Date) => {
      console.log('Generating bills for month:', format(selectedMonth, 'yyyy-MM'));
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!userData) throw new Error('Dados do usuário não encontrados');

      // Get all credit cards for the user
      const { data: creditCards, error: cardsError } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', userData.id);

      if (cardsError) throw cardsError;
      if (!creditCards || creditCards.length === 0) {
        throw new Error('Nenhum cartão de crédito encontrado');
      }

      const generatedBills = [];

      for (const card of creditCards) {
        console.log(`Processing card: ${card.bank_name} - ${card.card_name}`);
        
        // Calculate bill period based on card's close_date
        const closeDate = card.close_date || 5; // Default to 5th if not set
        const dueDate = card.due_date;
        
        // Bill close date for the selected month
        let billCloseDate = setDate(selectedMonth, closeDate);
        
        // If we're past the close date this month, the bill period starts from last month's close date
        if (isAfter(new Date(), billCloseDate)) {
          billCloseDate = setDate(addMonths(selectedMonth, -1), closeDate);
        }
        
        const billStartDate = addDays(setDate(addMonths(billCloseDate, -1), closeDate), 1);
        const billEndDate = billCloseDate;
        
        // Calculate due date (usually next month after close date)
        const billDueDate = setDate(addMonths(billCloseDate, 1), dueDate);
        
        console.log(`Bill period: ${format(billStartDate, 'yyyy-MM-dd')} to ${format(billEndDate, 'yyyy-MM-dd')}`);
        console.log(`Due date: ${format(billDueDate, 'yyyy-MM-dd')}`);

        // Check if bill already exists for this period
        const { data: existingBill } = await supabase
          .from('credit_card_bills')
          .select('id')
          .eq('credit_card_id', card.id)
          .eq('close_date', format(billEndDate, 'yyyy-MM-dd'))
          .single();

        if (existingBill) {
          console.log(`Bill already exists for card ${card.id} for period ending ${format(billEndDate, 'yyyy-MM-dd')}`);
          continue;
        }

        // Get transactions for this card in the bill period
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.user.id)
          .eq('credit_card_id', card.id)
          .gte('tx_date', format(billStartDate, 'yyyy-MM-dd'))
          .lte('tx_date', format(billEndDate, 'yyyy-MM-dd'));

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError);
          throw transactionsError;
        }

        console.log(`Found ${transactions?.length || 0} transactions for this bill period`);

        // Calculate bill amount
        const billAmount = transactions?.reduce((total, transaction) => {
          return total + Number(transaction.value || 0); // Using 'value' instead of 'amount'
        }, 0) || 0;

        console.log(`Total bill amount: ${billAmount}`);

        // Create the bill
        const { data: newBill, error: billError } = await supabase
          .from('credit_card_bills')
          .insert({
            user_id: userData.id,
            credit_card_id: card.id,
            bill_amount: billAmount,
            due_date: format(billDueDate, 'yyyy-MM-dd'),
            close_date: format(billEndDate, 'yyyy-MM-dd'),
            status: 'pending',
            paid_amount: 0,
            remaining_amount: billAmount
          })
          .select()
          .single();

        if (billError) {
          console.error('Error creating bill:', billError);
          throw billError;
        }

        console.log(`Created bill with ID: ${newBill.id}`);
        generatedBills.push(newBill);
      }

      return {
        generatedBills,
        message: `${generatedBills.length} fatura(s) gerada(s) com sucesso`
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
      toast({
        title: "Faturas geradas",
        description: data.message,
      });
    },
    onError: (error: any) => {
      console.error('Error generating bills:', error);
      toast({
        title: "Erro ao gerar faturas",
        description: error.message || "Não foi possível gerar as faturas.",
        variant: "destructive",
      });
    },
  });
};
