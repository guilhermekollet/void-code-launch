export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_agent_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          category: string
          id: number
          is_active: boolean
          label: string
          limit_value: number
          user_id: number
        }
        Insert: {
          category: string
          id?: number
          is_active?: boolean
          label: string
          limit_value: number
          user_id: number
        }
        Update: {
          category?: string
          id?: number
          is_active?: boolean
          label?: string
          limit_value?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "alerts_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      balances: {
        Row: {
          created_at: string
          id: number
          user_id: number
          value: number
        }
        Insert: {
          created_at?: string
          id?: number
          user_id: number
          value: number
        }
        Update: {
          created_at?: string
          id?: number
          user_id?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_payments: {
        Row: {
          amount: number
          bill_id: number
          created_at: string | null
          id: number
          payment_date: string | null
          user_id: number
        }
        Insert: {
          amount: number
          bill_id: number
          created_at?: string | null
          id?: number
          payment_date?: string | null
          user_id: number
        }
        Update: {
          amount?: number
          bill_id?: number
          created_at?: string | null
          id?: number
          payment_date?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "credit_card_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: number
          name: string
          type: string
          user_id: number
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: number
          name: string
          type?: string
          user_id: number
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: number
          name?: string
          type?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_bills: {
        Row: {
          archived: boolean | null
          bill_amount: number
          close_date: string | null
          created_at: string
          credit_card_id: number
          due_date: string
          id: number
          paid_amount: number
          remaining_amount: number
          status: string
          updated_at: string
          user_id: number
        }
        Insert: {
          archived?: boolean | null
          bill_amount?: number
          close_date?: string | null
          created_at?: string
          credit_card_id: number
          due_date: string
          id?: number
          paid_amount?: number
          remaining_amount?: number
          status?: string
          updated_at?: string
          user_id: number
        }
        Update: {
          archived?: boolean | null
          bill_amount?: number
          close_date?: string | null
          created_at?: string
          credit_card_id?: number
          due_date?: string
          id?: number
          paid_amount?: number
          remaining_amount?: number
          status?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_bills_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_bills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          bank_name: string
          card_name: string | null
          card_type: string
          close_date: number | null
          color: string
          created_at: string
          due_date: number
          id: number
          updated_at: string
          user_id: number
        }
        Insert: {
          bank_name: string
          card_name?: string | null
          card_type?: string
          close_date?: number | null
          color?: string
          created_at?: string
          due_date: number
          id?: number
          updated_at?: string
          user_id: number
        }
        Update: {
          bank_name?: string
          card_name?: string | null
          card_type?: string
          close_date?: number | null
          color?: string
          created_at?: string
          due_date?: number
          id?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          id: number
          progress: number
          target: number
          target_date: string
          title: string
          user_id: number
        }
        Insert: {
          id?: number
          progress?: number
          target: number
          target_date: string
          title: string
          user_id: number
        }
        Update: {
          id?: number
          progress?: number
          target?: number
          target_date?: string
          title?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      onboarding: {
        Row: {
          billing_cycle: string
          created_at: string | null
          email: string
          id: string
          last_updated_date: string | null
          name: string
          onboarding_start_date: string | null
          payment_confirmed: boolean | null
          phone: string
          registration_stage: string
          selected_plan: string
          stripe_session_id: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle: string
          created_at?: string | null
          email: string
          id?: string
          last_updated_date?: string | null
          name: string
          onboarding_start_date?: string | null
          payment_confirmed?: boolean | null
          phone: string
          registration_stage?: string
          selected_plan: string
          stripe_session_id?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          email?: string
          id?: string
          last_updated_date?: string | null
          name?: string
          onboarding_start_date?: string | null
          payment_confirmed?: boolean | null
          phone?: string
          registration_stage?: string
          selected_plan?: string
          stripe_session_id?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: number
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: number
          plan_type: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: number
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          category: string
          credit_card_id: number | null
          description: string | null
          id: number
          installment_billing_date: string | null
          installment_number: number | null
          installment_start_date: string | null
          installment_value: number | null
          installments: number | null
          is_credit_card_expense: boolean | null
          is_installment: boolean | null
          is_recurring: boolean | null
          parent_transaction_id: number | null
          recurring_date: number | null
          registered_at: string
          total_installments: number | null
          tx_date: string
          type: string | null
          user_id: number
          value: number
        }
        Insert: {
          category: string
          credit_card_id?: number | null
          description?: string | null
          id?: number
          installment_billing_date?: string | null
          installment_number?: number | null
          installment_start_date?: string | null
          installment_value?: number | null
          installments?: number | null
          is_credit_card_expense?: boolean | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          parent_transaction_id?: number | null
          recurring_date?: number | null
          registered_at: string
          total_installments?: number | null
          tx_date: string
          type?: string | null
          user_id: number
          value: number
        }
        Update: {
          category?: string
          credit_card_id?: number | null
          description?: string | null
          id?: number
          installment_billing_date?: string | null
          installment_number?: number | null
          installment_start_date?: string | null
          installment_value?: number | null
          installments?: number | null
          is_credit_card_expense?: boolean | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          parent_transaction_id?: number | null
          recurring_date?: number | null
          registered_at?: string
          total_installments?: number | null
          tx_date?: string
          type?: string | null
          user_id?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_archive: {
        Row: {
          archived_at: string
          category: string
          credit_card_info: Json | null
          description: string | null
          id: string
          installment_number: number | null
          installments: number | null
          is_installment: boolean | null
          is_recurring: boolean | null
          original_transaction_id: number
          original_user_id: number
          registered_at: string
          total_installments: number | null
          tx_date: string
          type: string | null
          value: number
        }
        Insert: {
          archived_at?: string
          category: string
          credit_card_info?: Json | null
          description?: string | null
          id?: string
          installment_number?: number | null
          installments?: number | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          original_transaction_id: number
          original_user_id: number
          registered_at: string
          total_installments?: number | null
          tx_date: string
          type?: string | null
          value: number
        }
        Update: {
          archived_at?: string
          category?: string
          credit_card_info?: Json | null
          description?: string | null
          id?: string
          installment_number?: number | null
          installments?: number | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          original_transaction_id?: number
          original_user_id?: number
          registered_at?: string
          total_installments?: number | null
          tx_date?: string
          type?: string | null
          value?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          completed_onboarding: boolean | null
          created_at: string
          email: string | null
          id: number
          last_used_credit_card_id: number | null
          name: string | null
          phone_number: string
          plan_type: string | null
          stripe_session_id: string | null
          trial_end: string | null
          trial_start: string | null
          user_id: string | null
        }
        Insert: {
          completed_onboarding?: boolean | null
          created_at?: string
          email?: string | null
          id?: number
          last_used_credit_card_id?: number | null
          name?: string | null
          phone_number: string
          plan_type?: string | null
          stripe_session_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string | null
        }
        Update: {
          completed_onboarding?: boolean | null
          created_at?: string
          email?: string | null
          id?: number
          last_used_credit_card_id?: number | null
          name?: string | null
          phone_number?: string
          plan_type?: string | null
          stripe_session_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_last_used_credit_card_id_fkey"
            columns: ["last_used_credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      users_archive: {
        Row: {
          account_created_at: string | null
          archived_at: string
          auth_user_id: string | null
          email: string | null
          full_name: string | null
          id: string
          original_user_id: number
          phone_number: string
          plan_type: string | null
        }
        Insert: {
          account_created_at?: string | null
          archived_at?: string
          auth_user_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          original_user_id: number
          phone_number: string
          plan_type?: string | null
        }
        Update: {
          account_created_at?: string | null
          archived_at?: string
          auth_user_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          original_user_id?: number
          phone_number?: string
          plan_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
