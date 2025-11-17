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
      approveflow_3d: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          render_urls: Json
          version_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          render_urls: Json
          version_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          render_urls?: Json
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approveflow_3d_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "approveflow_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approveflow_3d_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "approveflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      approveflow_actions: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          payload: Json | null
          project_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          payload?: Json | null
          project_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          payload?: Json | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approveflow_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "approveflow_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      approveflow_assets: {
        Row: {
          created_at: string | null
          file_type: string | null
          file_url: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approveflow_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "approveflow_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      approveflow_chat: {
        Row: {
          created_at: string | null
          id: string
          message: string
          project_id: string
          sender: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          project_id: string
          sender: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          project_id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "approveflow_chat_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "approveflow_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      approveflow_projects: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          design_instructions: string | null
          designer_id: string | null
          id: string
          order_number: string
          order_total: number | null
          product_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          design_instructions?: string | null
          designer_id?: string | null
          id?: string
          order_number: string
          order_total?: number | null
          product_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          design_instructions?: string | null
          designer_id?: string | null
          id?: string
          order_number?: string
          order_total?: number | null
          product_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      approveflow_versions: {
        Row: {
          created_at: string | null
          file_url: string
          id: string
          notes: string | null
          project_id: string
          submitted_by: string
          thumbnail_url: string | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          file_url: string
          id?: string
          notes?: string | null
          project_id: string
          submitted_by: string
          thumbnail_url?: string | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          file_url?: string
          id?: string
          notes?: string | null
          project_id?: string
          submitted_by?: string
          thumbnail_url?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "approveflow_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "approveflow_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      color_visualizations: {
        Row: {
          color_hex: string | null
          color_name: string | null
          created_at: string
          custom_design_url: string | null
          custom_swatch_url: string | null
          customer_email: string | null
          design_file_name: string | null
          finish_type: string
          has_metallic_flakes: boolean | null
          id: string
          infusion_color_id: string | null
          organization_id: string | null
          render_urls: Json | null
          subscription_tier: string | null
          tags: string[] | null
          updated_at: string
          uses_custom_design: boolean | null
          vehicle_make: string
          vehicle_model: string
          vehicle_type: string
          vehicle_year: number | null
        }
        Insert: {
          color_hex?: string | null
          color_name?: string | null
          created_at?: string
          custom_design_url?: string | null
          custom_swatch_url?: string | null
          customer_email?: string | null
          design_file_name?: string | null
          finish_type: string
          has_metallic_flakes?: boolean | null
          id?: string
          infusion_color_id?: string | null
          organization_id?: string | null
          render_urls?: Json | null
          subscription_tier?: string | null
          tags?: string[] | null
          updated_at?: string
          uses_custom_design?: boolean | null
          vehicle_make: string
          vehicle_model: string
          vehicle_type: string
          vehicle_year?: number | null
        }
        Update: {
          color_hex?: string | null
          color_name?: string | null
          created_at?: string
          custom_design_url?: string | null
          custom_swatch_url?: string | null
          customer_email?: string | null
          design_file_name?: string | null
          finish_type?: string
          has_metallic_flakes?: boolean | null
          id?: string
          infusion_color_id?: string | null
          organization_id?: string | null
          render_urls?: Json | null
          subscription_tier?: string | null
          tags?: string[] | null
          updated_at?: string
          uses_custom_design?: boolean | null
          vehicle_make?: string
          vehicle_model?: string
          vehicle_type?: string
          vehicle_year?: number | null
        }
        Relationships: []
      }
      shopflow_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          order_id: string | null
          payload: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          order_id?: string | null
          payload?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          order_id?: string | null
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "shopflow_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopflow_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shopflow_orders: {
        Row: {
          approveflow_project_id: string | null
          assigned_to: string | null
          created_at: string
          customer_name: string
          estimated_completion_date: string | null
          id: string
          notes: string | null
          order_number: string
          priority: string | null
          product_type: string
          status: string
          updated_at: string
        }
        Insert: {
          approveflow_project_id?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_name: string
          estimated_completion_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          priority?: string | null
          product_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          approveflow_project_id?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_name?: string
          estimated_completion_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          priority?: string | null
          product_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopflow_orders_approveflow_project_id_fkey"
            columns: ["approveflow_project_id"]
            isOneToOne: false
            referencedRelation: "approveflow_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      wrapbox_kits: {
        Row: {
          created_at: string | null
          design_vault_id: string | null
          id: string
          organization_id: string | null
          panels: Json | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          vehicle_json: Json
        }
        Insert: {
          created_at?: string | null
          design_vault_id?: string | null
          id?: string
          organization_id?: string | null
          panels?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vehicle_json: Json
        }
        Update: {
          created_at?: string | null
          design_vault_id?: string | null
          id?: string
          organization_id?: string | null
          panels?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vehicle_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "wrapbox_kits_design_vault_id_fkey"
            columns: ["design_vault_id"]
            isOneToOne: false
            referencedRelation: "color_visualizations"
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
