
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Iniciando processo de exclusão para usuário:', user.id)

    // Get user data from public.users table
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user data:', userError)
      return new Response(
        JSON.stringify({ error: 'Dados do usuário não encontrados' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Dados do usuário encontrados:', userData.id)

    // Archive user data
    const { error: archiveUserError } = await supabaseClient
      .from('users_archive')
      .insert({
        original_user_id: userData.id,
        auth_user_id: user.id,
        full_name: userData.name,
        phone_number: userData.phone_number,
        email: userData.email || user.email,
        plan_type: userData.plan_type,
        account_created_at: userData.created_at
      })

    if (archiveUserError) {
      console.error('Error archiving user data:', archiveUserError)
      return new Response(
        JSON.stringify({ error: 'Erro ao arquivar dados do usuário' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Dados do usuário arquivados com sucesso')

    // Get all user transactions with credit card info
    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select(`
        *,
        credit_cards (
          bank_name,
          card_name,
          card_type
        )
      `)
      .eq('user_id', userData.id)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
    } else if (transactions && transactions.length > 0) {
      console.log('Arquivando', transactions.length, 'transações')
      
      // Archive transactions
      const transactionsToArchive = transactions.map(transaction => ({
        original_transaction_id: transaction.id,
        original_user_id: userData.id,
        description: transaction.description,
        category: transaction.category,
        value: transaction.value,
        tx_date: transaction.tx_date,
        registered_at: transaction.registered_at,
        type: transaction.type,
        is_recurring: transaction.is_recurring,
        is_installment: transaction.is_installment,
        installments: transaction.installments,
        installment_number: transaction.installment_number,
        total_installments: transaction.total_installments,
        credit_card_info: transaction.credit_cards ? {
          bank_name: transaction.credit_cards.bank_name,
          card_name: transaction.credit_cards.card_name,
          card_type: transaction.credit_cards.card_type
        } : null
      }))

      const { error: archiveTransactionsError } = await supabaseClient
        .from('transactions_archive')
        .insert(transactionsToArchive)

      if (archiveTransactionsError) {
        console.error('Error archiving transactions:', archiveTransactionsError)
        return new Response(
          JSON.stringify({ error: 'Erro ao arquivar transações' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('Transações arquivadas com sucesso')
    }

    // Delete user data in correct order to respect foreign key constraints
    console.log('Iniciando exclusão dos dados ativos')

    try {
      // 1. Delete bill payments first
      console.log('Excluindo bill_payments...')
      const { error: billPaymentsError } = await supabaseClient
        .from('bill_payments')
        .delete()
        .eq('user_id', userData.id)
      
      if (billPaymentsError) {
        console.error('Error deleting bill_payments:', billPaymentsError)
        throw billPaymentsError
      }
      
      // 2. Delete credit card bills
      console.log('Excluindo credit_card_bills...')
      const { error: billsError } = await supabaseClient
        .from('credit_card_bills')
        .delete()
        .eq('user_id', userData.id)
      
      if (billsError) {
        console.error('Error deleting credit_card_bills:', billsError)
        throw billsError
      }
      
      // 3. Delete transactions
      console.log('Excluindo transactions...')
      const { error: transactionsDeleteError } = await supabaseClient
        .from('transactions')
        .delete()
        .eq('user_id', userData.id)
      
      if (transactionsDeleteError) {
        console.error('Error deleting transactions:', transactionsDeleteError)
        throw transactionsDeleteError
      }

      // 4. Clear last_used_credit_card_id reference in users table first
      console.log('Limpando referência de cartão em users...')
      const { error: clearCardRefError } = await supabaseClient
        .from('users')
        .update({ last_used_credit_card_id: null })
        .eq('id', userData.id)
      
      if (clearCardRefError) {
        console.error('Error clearing credit card reference:', clearCardRefError)
        throw clearCardRefError
      }
      
      // 5. Delete credit cards
      console.log('Excluindo credit_cards...')
      const { error: cardsError } = await supabaseClient
        .from('credit_cards')
        .delete()
        .eq('user_id', userData.id)
      
      if (cardsError) {
        console.error('Error deleting credit_cards:', cardsError)
        throw cardsError
      }
      
      // 6. Delete categories
      console.log('Excluindo categories...')
      const { error: categoriesError } = await supabaseClient
        .from('categories')
        .delete()
        .eq('user_id', userData.id)
      
      if (categoriesError) {
        console.error('Error deleting categories:', categoriesError)
        throw categoriesError
      }
      
      // 7. Delete goals
      console.log('Excluindo goals...')
      const { error: goalsError } = await supabaseClient
        .from('goals')
        .delete()
        .eq('user_id', userData.id)
      
      if (goalsError) {
        console.error('Error deleting goals:', goalsError)
        throw goalsError
      }
      
      // 8. Delete alerts
      console.log('Excluindo alerts...')
      const { error: alertsError } = await supabaseClient
        .from('alerts')
        .delete()
        .eq('user_id', userData.id)
      
      if (alertsError) {
        console.error('Error deleting alerts:', alertsError)
        throw alertsError
      }
      
      // 9. Delete subscriptions
      console.log('Excluindo subscriptions...')
      const { error: subscriptionsError } = await supabaseClient
        .from('subscriptions')
        .delete()
        .eq('user_id', userData.id)
      
      if (subscriptionsError) {
        console.error('Error deleting subscriptions:', subscriptionsError)
        throw subscriptionsError
      }
      
      // 10. Delete AI agent settings
      console.log('Excluindo ai_agent_settings...')
      const { error: aiSettingsError } = await supabaseClient
        .from('ai_agent_settings')
        .delete()
        .eq('user_id', user.id)
      
      if (aiSettingsError) {
        console.error('Error deleting ai_agent_settings:', aiSettingsError)
        throw aiSettingsError
      }

      // 11. Delete balances if they exist
      console.log('Excluindo balances...')
      const { error: balancesError } = await supabaseClient
        .from('balances')
        .delete()
        .eq('user_id', userData.id)
      
      if (balancesError) {
        console.error('Error deleting balances:', balancesError)
        throw balancesError
      }
      
      // 12. Delete from users table
      console.log('Excluindo do public.users...')
      const { error: userDeleteError } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', userData.id)

      if (userDeleteError) {
        console.error('Error deleting from users table:', userDeleteError)
        throw userDeleteError
      }

    } catch (deleteError) {
      console.error('Error during data deletion:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir dados do usuário: ' + deleteError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Dados ativos excluídos com sucesso')

    // 13. Finally, delete user from auth.users (this will cascade delete related auth data)
    console.log('Excluindo do auth.users...')
    const { error: deleteAuthError } = await supabaseClient.auth.admin.deleteUser(user.id)

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir usuário da autenticação: ' + deleteAuthError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Usuário excluído completamente com sucesso')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conta excluída com sucesso. Todos os dados foram arquivados.',
        redirect_url: 'https://www.bolsofy.com'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
