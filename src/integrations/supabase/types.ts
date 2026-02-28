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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          company_id: string | null
          created_at: string
          division: Database["public"]["Enums"]["app_division"]
          email: string
          id: string
          name: string
          position: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          company_id?: string | null
          created_at?: string
          division?: Database["public"]["Enums"]["app_division"]
          email: string
          id: string
          name: string
          position?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          company_id?: string | null
          created_at?: string
          division?: Database["public"]["Enums"]["app_division"]
          email?: string
          id?: string
          name?: string
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          division: Database["public"]["Enums"]["app_division"]
          end_date: string | null
          id: string
          name: string
          priority: Database["public"]["Enums"]["task_priority"]
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          division?: Database["public"]["Enums"]["app_division"]
          end_date?: string | null
          id?: string
          name: string
          priority?: Database["public"]["Enums"]["task_priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          division?: Database["public"]["Enums"]["app_division"]
          end_date?: string | null
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          assignee_id: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          assignee_id: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          assignee_id?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived: boolean
          aspect_ratio: string | null
          assignee_id: string | null
          brand_guidelines: string | null
          bug_severity: string | null
          content_asset_link: string | null
          created_at: string
          description: string | null
          due_date: string | null
          environment: string | null
          id: string
          moodboard_link: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          repo_link: string | null
          request_date: string | null
          result_link: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          aspect_ratio?: string | null
          assignee_id?: string | null
          brand_guidelines?: string | null
          bug_severity?: string | null
          content_asset_link?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          environment?: string | null
          id?: string
          moodboard_link?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          repo_link?: string | null
          request_date?: string | null
          result_link?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          aspect_ratio?: string | null
          assignee_id?: string | null
          brand_guidelines?: string | null
          bug_severity?: string | null
          content_asset_link?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          environment?: string | null
          id?: string
          moodboard_link?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          repo_link?: string | null
          request_date?: string | null
          result_link?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_user_company: { Args: { _user_id: string }; Returns: string }
      get_user_division: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_division"]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_admin_or_above: { Args: { _user_id: string }; Returns: boolean }
      is_in_user_company_group: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      project_in_user_scope: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_task_in_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_division: "creative" | "developer"
      app_role: "super_admin" | "admin" | "member"
      project_status: "planning" | "ongoing" | "completed" | "archived"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "doing" | "review" | "done"
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
      app_division: ["creative", "developer"],
      app_role: ["super_admin", "admin", "member"],
      project_status: ["planning", "ongoing", "completed", "archived"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "doing", "review", "done"],
    },
  },
} as const
