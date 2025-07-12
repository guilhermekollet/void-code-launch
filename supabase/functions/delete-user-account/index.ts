
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

    // Get all user transactions
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

    // Delete user data in specific order (due to foreign keys)
    console.log('Iniciando exclusão dos dados ativos')

    // Delete bill payments
    await supabaseClient.from('bill_payments').delete().eq('user_id', userData.id)
    
    // Delete credit card bills
    await supabaseClient.from('credit_card_bills').delete().eq('user_id', userData.id)
    
    // Delete transactions
    await supabaseClient.from('transactions').delete().eq('user_id', userData.id)
    
    // Delete credit cards
    await supabaseClient.from('credit_cards').delete().eq('user_id', userData.id)
    
    // Delete categories
    await supabaseClient.from('categories').delete().eq('user_id', userData.id)
    
    // Delete goals
    await supabaseClient.from('goals').delete().eq('user_id', userData.id)
    
    // Delete alerts
    await supabaseClient.from('alerts').delete().eq('user_id', userData.id)
    
    // Delete subscriptions
    await supabaseClient.from('subscriptions').delete().eq('user_id', userData.id)
    
    // Delete AI agent settings
    await supabaseClient.from('ai_agent_settings').delete().eq('user_id', user.id)
    
    // Delete from users table
    await supabaseClient.from('users').delete().eq('id', userData.id)

    console.log('Dados ativos excluídos com sucesso')

    // Delete user from auth.users (this will cascade delete related auth data)
    const { error: deleteAuthError } = await supabaseClient.auth.admin.deleteUser(user.id)

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir usuário da autenticação' }),
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
        message: 'Conta excluída com sucesso. Todos os dados foram arquivados.' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
