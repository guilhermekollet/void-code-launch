export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      auth_codes: {
        Row: {
          created_at: string
          expires_at: string
          id: number
          phone_number: string | null
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: number
          phone_number?: string | null
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: number
          phone_number?: string | null
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_codes_phone_number_fkey"
            columns: ["phone_number"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["phone_number"]
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
          user_id: number
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: number
          name: string
          user_id: number
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: number
          name?: string
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
          amount: number
          category: string
          created_at: string
          credit_card_id: number | null
          description: string
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
          total_installments: number | null
          tx_date: string
          type: string | null
          user_id: number
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          credit_card_id?: number | null
          description: string
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
          total_installments?: number | null
          tx_date: string
          type?: string | null
          user_id: number
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          credit_card_id?: number | null
          description?: string
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
          total_installments?: number | null
          tx_date?: string
          type?: string | null
          user_id?: number
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
