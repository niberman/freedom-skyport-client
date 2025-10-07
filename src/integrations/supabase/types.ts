export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          aircraft_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          aircraft_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          aircraft_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      aircraft: {
        Row: {
          base_location: string | null
          created_at: string | null
          id: string
          model: string
          owner_id: string | null
          status: string | null
          tail_number: string
          updated_at: string | null
        }
        Insert: {
          base_location?: string | null
          created_at?: string | null
          id?: string
          model: string
          owner_id?: string | null
          status?: string | null
          tail_number: string
          updated_at?: string | null
        }
        Update: {
          base_location?: string | null
          created_at?: string | null
          id?: string
          model?: string
          owner_id?: string | null
          status?: string | null
          tail_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      flight_hours: {
        Row: {
          aircraft_id: string
          arrival_airport: string | null
          created_at: string | null
          departure_airport: string | null
          flight_date: string
          hours_flown: number
          id: string
          notes: string | null
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          aircraft_id: string
          arrival_airport?: string | null
          created_at?: string | null
          departure_airport?: string | null
          flight_date: string
          hours_flown: number
          id?: string
          notes?: string | null
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          aircraft_id?: string
          arrival_airport?: string | null
          created_at?: string | null
          departure_airport?: string | null
          flight_date?: string
          hours_flown?: number
          id?: string
          notes?: string | null
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_hours_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_cents: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_cents: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          aircraft_id: string
          created_at: string | null
          hosted_invoice_url: string | null
          id: string
          owner_id: string
          period_end: string
          period_start: string
          status: string
          total_cents: number
          updated_at: string | null
        }
        Insert: {
          aircraft_id: string
          created_at?: string | null
          hosted_invoice_url?: string | null
          id?: string
          owner_id: string
          period_end: string
          period_start: string
          status?: string
          total_cents?: number
          updated_at?: string | null
        }
        Update: {
          aircraft_id?: string
          created_at?: string | null
          hosted_invoice_url?: string | null
          id?: string
          owner_id?: string
          period_end?: string
          period_start?: string
          status?: string
          total_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_tiers: {
        Row: {
          base_price: number | null
          created_at: string | null
          credit_multiplier: number | null
          description: string | null
          id: string
          is_active: boolean | null
          max_hours_per_month: number | null
          min_hours_per_month: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          created_at?: string | null
          credit_multiplier?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_hours_per_month?: number | null
          min_hours_per_month?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          created_at?: string | null
          credit_multiplier?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_hours_per_month?: number | null
          min_hours_per_month?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          active: boolean | null
          created_at: string | null
          end_date: string | null
          id: string
          owner_id: string
          start_date: string
          tier: string
          tier_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          owner_id: string
          start_date?: string
          tier: string
          tier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          owner_id?: string
          start_date?: string
          tier?: string
          tier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_credits: {
        Row: {
          created_at: string | null
          credits_available: number | null
          credits_used_this_period: number | null
          id: string
          last_reset_date: string | null
          owner_id: string
          service_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_available?: number | null
          credits_used_this_period?: number | null
          id?: string
          last_reset_date?: string | null
          owner_id: string
          service_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_available?: number | null
          credits_used_this_period?: number | null
          id?: string
          last_reset_date?: string | null
          owner_id?: string
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_credits_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          aircraft_id: string
          airport: string | null
          cabin_provisioning: Json | null
          created_at: string
          credits_used: number | null
          description: string
          fuel_grade: string | null
          fuel_quantity: number | null
          gpu_required: boolean | null
          hangar_pullout: boolean | null
          id: string
          is_extra_charge: boolean | null
          o2_topoff: boolean | null
          priority: string
          requested_departure: string | null
          service_id: string | null
          service_type: string
          status: string
          tks_topoff: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aircraft_id: string
          airport?: string | null
          cabin_provisioning?: Json | null
          created_at?: string
          credits_used?: number | null
          description: string
          fuel_grade?: string | null
          fuel_quantity?: number | null
          gpu_required?: boolean | null
          hangar_pullout?: boolean | null
          id?: string
          is_extra_charge?: boolean | null
          o2_topoff?: boolean | null
          priority?: string
          requested_departure?: string | null
          service_id?: string | null
          service_type: string
          status?: string
          tks_topoff?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aircraft_id?: string
          airport?: string | null
          cabin_provisioning?: Json | null
          created_at?: string
          credits_used?: number | null
          description?: string
          fuel_grade?: string | null
          fuel_quantity?: number | null
          gpu_required?: boolean | null
          hangar_pullout?: boolean | null
          id?: string
          is_extra_charge?: boolean | null
          o2_topoff?: boolean | null
          priority?: string
          requested_departure?: string | null
          service_id?: string | null
          service_type?: string
          status?: string
          tks_topoff?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tasks: {
        Row: {
          aircraft_id: string
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          photos: Json | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          aircraft_id: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photos?: Json | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          aircraft_id?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photos?: Json | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_tasks_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_credits_high_activity: number | null
          base_credits_low_activity: number | null
          can_rollover: boolean | null
          category: string
          created_at: string | null
          credits_per_period: number | null
          credits_required: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          base_credits_high_activity?: number | null
          base_credits_low_activity?: number | null
          can_rollover?: boolean | null
          category: string
          created_at?: string | null
          credits_per_period?: number | null
          credits_required?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          base_credits_high_activity?: number | null
          base_credits_low_activity?: number | null
          can_rollover?: boolean | null
          category?: string
          created_at?: string | null
          credits_per_period?: number | null
          credits_required?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin"
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
    Enums: {
      app_role: ["owner", "admin"],
    },
  },
} as const
