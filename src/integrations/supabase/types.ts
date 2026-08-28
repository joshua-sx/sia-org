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
      appraisal_cycles: {
        Row: {
          acknowledgement_due: string
          close_note: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          final_window_end: string
          final_window_start: string
          goal_window_end: string
          goal_window_start: string
          id: string
          interim_window_end: string
          interim_window_start: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          acknowledgement_due: string
          close_note?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          final_window_end: string
          final_window_start: string
          goal_window_end: string
          goal_window_start: string
          id?: string
          interim_window_end: string
          interim_window_start: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledgement_due?: string
          close_note?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          final_window_end?: string
          final_window_start?: string
          goal_window_end?: string
          goal_window_start?: string
          id?: string
          interim_window_end?: string
          interim_window_start?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_cycles_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_cycles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_email: string | null
          actor_profile_id: string | null
          actor_role: string | null
          created_at: string
          cycle_id: string | null
          employee_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organization_id: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_profile_id?: string | null
          actor_role?: string | null
          created_at?: string
          cycle_id?: string | null
          employee_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organization_id: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_profile_id?: string | null
          actor_role?: string | null
          created_at?: string
          cycle_id?: string | null
          employee_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "appraisal_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_participants: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          cycle_id: string
          employee_id: string
          extra_reviewer_id: string | null
          final_score: number | null
          final_submitted_at: string | null
          id: string
          interim_score: number | null
          interim_submitted_at: string | null
          manager_id: string
          overall_score: number | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          cycle_id: string
          employee_id: string
          extra_reviewer_id?: string | null
          final_score?: number | null
          final_submitted_at?: string | null
          id?: string
          interim_score?: number | null
          interim_submitted_at?: string | null
          manager_id: string
          overall_score?: number | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          cycle_id?: string
          employee_id?: string
          extra_reviewer_id?: string | null
          final_score?: number | null
          final_submitted_at?: string | null
          id?: string
          interim_score?: number | null
          interim_submitted_at?: string | null
          manager_id?: string
          overall_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycle_participants_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "appraisal_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_participants_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_participants_extra_reviewer_id_fkey"
            columns: ["extra_reviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_participants_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
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
      goal_ratings: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          manager_comment: string | null
          rating: number | null
          reviewer_comment: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          manager_comment?: string | null
          rating?: number | null
          reviewer_comment?: string | null
          stage: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          manager_comment?: string | null
          rating?: number | null
          reviewer_comment?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_ratings_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          participant_id: string
          title: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          participant_id: string
          title: string
          updated_at?: string
          weight: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          participant_id?: string
          title?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "cycle_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          cycle_id: string | null
          id: string
          kind: string
          link: string | null
          organization_id: string
          participant_id: string | null
          read_at: string | null
          recipient_profile_id: string
          sender_name: string | null
          sender_profile_id: string | null
          task_kind: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          cycle_id?: string | null
          id?: string
          kind?: string
          link?: string | null
          organization_id: string
          participant_id?: string | null
          read_at?: string | null
          recipient_profile_id: string
          sender_name?: string | null
          sender_profile_id?: string | null
          task_kind?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          cycle_id?: string | null
          id?: string
          kind?: string
          link?: string | null
          organization_id?: string
          participant_id?: string | null
          read_at?: string | null
          recipient_profile_id?: string
          sender_name?: string | null
          sender_profile_id?: string | null
          task_kind?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "appraisal_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "cycle_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
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
          final_weight_pct: number
          id: string
          industry: string
          interim_weight_pct: number
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
          final_weight_pct?: number
          id?: string
          industry: string
          interim_weight_pct?: number
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
          final_weight_pct?: number
          id?: string
          industry?: string
          interim_weight_pct?: number
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
      _seed_submit_and_ack: {
        Args: { p_ack?: boolean; p_participant_id: string; p_stage: string }
        Returns: undefined
      }
      bulk_import_employees: {
        Args: { p_rows: Json }
        Returns: Json
      }
      create_org_structure: {
        Args: { p_levels: Json; p_units: Json }
        Returns: undefined
      }
      close_cycle: {
        Args: { p_cycle_id: string; p_force?: boolean; p_note?: string }
        Returns: {
          acknowledgement_due: string
          close_note: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          final_window_end: string
          final_window_start: string
          goal_window_end: string
          goal_window_start: string
          id: string
          interim_window_end: string
          interim_window_start: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appraisal_cycles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_employee_id: { Args: never; Returns: string }
      current_user_org_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      custom_jwt_claims: { Args: { event: Json }; Returns: Json }
      cycle_close_readiness: { Args: { p_cycle_id: string }; Returns: Json }
      cycle_nudge_history: {
        Args: { p_cycle_id: string }
        Returns: {
          last_sent_at: string
          participant_id: string
          task_kind: string
          times_sent: number
        }[]
      }
      cycle_org: { Args: { p_cycle_id: string }; Returns: string }
      goal_participant: { Args: { p_goal_id: string }; Returns: string }
      is_employee_of_participant: {
        Args: { p_participant_id: string }
        Returns: boolean
      }
      is_extra_reviewer_of_participant: {
        Args: { p_participant_id: string }
        Returns: boolean
      }
      is_manager_of_participant: {
        Args: { p_participant_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_cycle_id?: string
          p_employee_id?: string
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
          p_organization_id: string
          p_summary?: string
        }
        Returns: string
      }
      participant_final_submitted: {
        Args: { p_participant_id: string }
        Returns: boolean
      }
      participant_org: { Args: { p_participant_id: string }; Returns: string }
      send_cycle_nudge: {
        Args: { p_participant_id: string; p_task_kind: string }
        Returns: {
          body: string | null
          created_at: string
          cycle_id: string | null
          id: string
          kind: string
          link: string | null
          organization_id: string
          participant_id: string | null
          read_at: string | null
          recipient_profile_id: string
          sender_name: string | null
          sender_profile_id: string | null
          task_kind: string | null
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_assessment_stage: {
        Args: { p_participant_id: string; p_stage: string }
        Returns: {
          acknowledged_at: string | null
          created_at: string
          cycle_id: string
          employee_id: string
          extra_reviewer_id: string | null
          final_score: number | null
          final_submitted_at: string | null
          id: string
          interim_score: number | null
          interim_submitted_at: string | null
          manager_id: string
          overall_score: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cycle_participants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
