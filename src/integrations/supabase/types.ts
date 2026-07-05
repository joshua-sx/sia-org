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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      employees: {
        Row: {
          created_at: string
          email: string
          employee_code: string | null
          employment_status: Database["public"]["Enums"]["employment_status"]
          employment_type: Database["public"]["Enums"]["employment_type"]
          end_date: string | null
          first_name: string
          id: string
          job_title: string | null
          last_name: string
          location: string | null
          manager_id: string | null
          notes: string | null
          org_unit_id: string | null
          organization_id: string
          phone: string | null
          profile_id: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          employee_code?: string | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          employment_type?: Database["public"]["Enums"]["employment_type"]
          end_date?: string | null
          first_name: string
          id?: string
          job_title?: string | null
          last_name: string
          location?: string | null
          manager_id?: string | null
          notes?: string | null
          org_unit_id?: string | null
          organization_id: string
          phone?: string | null
          profile_id?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          employee_code?: string | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          employment_type?: Database["public"]["Enums"]["employment_type"]
          end_date?: string | null
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string
          location?: string | null
          manager_id?: string | null
          notes?: string | null
          org_unit_id?: string | null
          organization_id?: string
          phone?: string | null
          profile_id?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "org_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_unit_types: {
        Row: {
          created_at: string | null
          id: string
          level: number
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: number
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_unit_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_units: {
        Row: {
          created_at: string | null
          depth: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          parent_id: string | null
          path: unknown
          unit_type_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          depth?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          parent_id?: string | null
          path?: unknown
          unit_type_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          depth?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          parent_id?: string | null
          path?: unknown
          unit_type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_units_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "org_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_units_unit_type_id_fkey"
            columns: ["unit_type_id"]
            isOneToOne: false
            referencedRelation: "org_unit_types"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country: string
          created_at: string | null
          cycle_complete: boolean
          cycle_skipped: boolean
          id: string
          industry: string
          name: string
          people_complete: boolean
          people_skipped: boolean
          setup_complete: boolean | null
          structure_complete: boolean
          structure_skipped: boolean
        }
        Insert: {
          country: string
          created_at?: string | null
          cycle_complete?: boolean
          cycle_skipped?: boolean
          id?: string
          industry: string
          name: string
          people_complete?: boolean
          people_skipped?: boolean
          setup_complete?: boolean | null
          structure_complete?: boolean
          structure_skipped?: boolean
        }
        Update: {
          country?: string
          created_at?: string | null
          cycle_complete?: boolean
          cycle_skipped?: boolean
          id?: string
          industry?: string
          name?: string
          people_complete?: boolean
          people_skipped?: boolean
          setup_complete?: boolean | null
          structure_complete?: boolean
          structure_skipped?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          organization_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          organization_id: string
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          organization_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_org_id: { Args: never; Returns: string }
      custom_jwt_claims: { Args: { event: Json }; Returns: Json }
      text2ltree: { Args: { "": string }; Returns: unknown }
    }
    Enums: {
      employment_status: "active" | "on_leave" | "terminated"
      employment_type: "full_time" | "part_time" | "contractor" | "intern"
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
      employment_status: ["active", "on_leave", "terminated"],
      employment_type: ["full_time", "part_time", "contractor", "intern"],
    },
  },
} as const
