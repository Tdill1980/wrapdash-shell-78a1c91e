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
      affiliate_card_views: {
        Row: {
          created_at: string | null
          founder_id: string
          id: string
          referrer_url: string | null
          viewer_country: string | null
          viewer_ip: string | null
        }
        Insert: {
          created_at?: string | null
          founder_id: string
          id?: string
          referrer_url?: string | null
          viewer_country?: string | null
          viewer_ip?: string | null
        }
        Update: {
          created_at?: string | null
          founder_id?: string
          id?: string
          referrer_url?: string | null
          viewer_country?: string | null
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_card_views_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "affiliate_founders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          commission_amount: number
          created_at: string | null
          customer_email: string
          founder_id: string
          id: string
          notes: string | null
          order_number: string
          order_total: number
          paid_at: string | null
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          commission_amount: number
          created_at?: string | null
          customer_email: string
          founder_id: string
          id?: string
          notes?: string | null
          order_number: string
          order_total: number
          paid_at?: string | null
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          commission_amount?: number
          created_at?: string | null
          customer_email?: string
          founder_id?: string
          id?: string
          notes?: string | null
          order_number?: string
          order_total?: number
          paid_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "affiliate_founders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_founders: {
        Row: {
          affiliate_code: string
          avatar_url: string | null
          bio: string | null
          commission_rate: number | null
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          social_links: Json | null
          updated_at: string | null
        }
        Insert: {
          affiliate_code: string
          avatar_url?: string | null
          bio?: string | null
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Update: {
          affiliate_code?: string
          avatar_url?: string | null
          bio?: string | null
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_login_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          founder_id: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          founder_id: string
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          founder_id?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_login_tokens_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "affiliate_founders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          conversion_date: string | null
          converted: boolean | null
          created_at: string | null
          founder_id: string
          id: string
          referred_email: string
        }
        Insert: {
          conversion_date?: string | null
          converted?: boolean | null
          created_at?: string | null
          founder_id: string
          id?: string
          referred_email: string
        }
        Update: {
          conversion_date?: string | null
          converted?: boolean | null
          created_at?: string | null
          founder_id?: string
          id?: string
          referred_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "affiliate_founders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_signup_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          ref_code: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          ref_code: string
          token: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          ref_code?: string
          token?: string
          used?: boolean | null
        }
        Relationships: []
      }
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
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number | null
          flat_price: number | null
          id: string
          is_active: boolean
          price_per_sqft: number | null
          pricing_type: string
          product_name: string
          updated_at: string
          woo_product_id: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          flat_price?: number | null
          id?: string
          is_active?: boolean
          price_per_sqft?: number | null
          pricing_type: string
          product_name: string
          updated_at?: string
          woo_product_id: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          flat_price?: number | null
          id?: string
          is_active?: boolean
          price_per_sqft?: number | null
          pricing_type?: string
          product_name?: string
          updated_at?: string
          woo_product_id?: number
        }
        Relationships: []
      }
      quote_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: number
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: number
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string
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
          affiliate_ref_code: string | null
          approveflow_project_id: string | null
          assigned_to: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_stage: string | null
          estimated_completion_date: string | null
          file_error_details: Json | null
          files: Json | null
          id: string
          missing_file_list: Json | null
          notes: string | null
          order_number: string
          preflight_status: string | null
          priority: string | null
          product_type: string
          shipped_at: string | null
          status: string
          timeline: Json | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          vehicle_info: Json | null
        }
        Insert: {
          affiliate_ref_code?: string | null
          approveflow_project_id?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_stage?: string | null
          estimated_completion_date?: string | null
          file_error_details?: Json | null
          files?: Json | null
          id?: string
          missing_file_list?: Json | null
          notes?: string | null
          order_number: string
          preflight_status?: string | null
          priority?: string | null
          product_type: string
          shipped_at?: string | null
          status?: string
          timeline?: Json | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          vehicle_info?: Json | null
        }
        Update: {
          affiliate_ref_code?: string | null
          approveflow_project_id?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_stage?: string | null
          estimated_completion_date?: string | null
          file_error_details?: Json | null
          files?: Json | null
          id?: string
          missing_file_list?: Json | null
          notes?: string | null
          order_number?: string
          preflight_status?: string | null
          priority?: string | null
          product_type?: string
          shipped_at?: string | null
          status?: string
          timeline?: Json | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          vehicle_info?: Json | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
