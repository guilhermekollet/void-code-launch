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
      analytics: {
        Row: {
          created_at: string
          id: number
          started_bot_no_register: boolean | null
          user_canceled: boolean | null
          user_id: string | null
          user_pending: boolean | null
        }
        Insert: {
          created_at?: string
          id?: number
          started_bot_no_register?: boolean | null
          user_canceled?: boolean | null
          user_id?: string | null
          user_pending?: boolean | null
        }
        Update: {
          created_at?: string
          id?: number
          started_bot_no_register?: boolean | null
          user_canceled?: boolean | null
          user_id?: string | null
          user_pending?: boolean | null
        }
        Relationships: []
      }
      balances: {
        Row: {
          created_at: string
          user_id: string
          value: number
          valueOld: number
        }
        Insert: {
          created_at?: string
          user_id: string
          value: number
          valueOld: number
        }
        Update: {
          created_at?: string
          user_id?: string
          value?: number
          valueOld?: number
        }
        Relationships: []
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
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          user_id: string
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          user_id: string
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
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
          birth_date: string | null
          city: string | null
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
          sended_email: boolean | null
          stripe_session_id: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle: string
          birth_date?: string | null
          city?: string | null
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
          sended_email?: boolean | null
          stripe_session_id?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          birth_date?: string | null
          city?: string | null
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
          sended_email?: boolean | null
          stripe_session_id?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          is_agent: boolean | null
          is_credit_card_expense: boolean | null
          is_installment: boolean | null
          is_recurring: boolean | null
          parent_transaction_id: number | null
          recurring_date: number | null
          registered_at: string
          total_installments: number | null
          tx_date: string
          type: string | null
          user_id: string
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
          is_agent?: boolean | null
          is_credit_card_expense?: boolean | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          parent_transaction_id?: number | null
          recurring_date?: number | null
          registered_at: string
          total_installments?: number | null
          tx_date: string
          type?: string | null
          user_id: string
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
          is_agent?: boolean | null
          is_credit_card_expense?: boolean | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          parent_transaction_id?: number | null
          recurring_date?: number | null
          registered_at?: string
          total_installments?: number | null
          tx_date?: string
          type?: string | null
          user_id?: string
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
          billing_cycle: string | null
          birth_date: string | null
          city: string | null
          completed_onboarding: boolean | null
          created_at: string
          email: string | null
          id: number
          inactive_alerts: boolean | null
          insights_alerts: boolean | null
          name: string | null
          phone_number: string
          plan_status: string | null
          plan_type: string | null
          stripe_session_id: string | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          birth_date?: string | null
          city?: string | null
          completed_onboarding?: boolean | null
          created_at?: string
          email?: string | null
          id?: number
          inactive_alerts?: boolean | null
          insights_alerts?: boolean | null
          name?: string | null
          phone_number: string
          plan_status?: string | null
          plan_type?: string | null
          stripe_session_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          birth_date?: string | null
          city?: string | null
          completed_onboarding?: boolean | null
          created_at?: string
          email?: string | null
          id?: number
          inactive_alerts?: boolean | null
          insights_alerts?: boolean | null
          name?: string | null
          phone_number?: string
          plan_status?: string | null
          plan_type?: string | null
          stripe_session_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: []
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      generate_credit_card_bill: {
        Args: { card_id: number; due_date_param: string }
        Returns: number
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
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
