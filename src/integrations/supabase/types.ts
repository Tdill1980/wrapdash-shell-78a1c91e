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
          product_name: string | null
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
          product_name?: string | null
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
          product_name?: string | null
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
      affiliate_payout_invoices: {
        Row: {
          commission_ids: string[]
          created_at: string | null
          founder_id: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          pdf_url: string | null
          period_end: string
          period_start: string
          sent_at: string | null
          sent_to_email: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          commission_ids: string[]
          created_at?: string | null
          founder_id: string
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          pdf_url?: string | null
          period_end: string
          period_start: string
          sent_at?: string | null
          sent_to_email?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          commission_ids?: string[]
          created_at?: string | null
          founder_id?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          pdf_url?: string | null
          period_end?: string
          period_start?: string
          sent_at?: string | null
          sent_to_email?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payout_invoices_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "affiliate_founders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_products: {
        Row: {
          commission_rate: number
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          product_name: string
          updated_at: string | null
        }
        Insert: {
          commission_rate: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          product_name: string
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          product_name?: string
          updated_at?: string | null
        }
        Relationships: []
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
      approveflow_email_logs: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          project_id: string
          provider: string | null
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          project_id: string
          provider?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          project_id?: string
          provider?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "approveflow_email_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "approveflow_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      approveflow_projects: {
        Row: {
          color_info: Json | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          design_instructions: string | null
          designer_id: string | null
          id: string
          order_number: string
          order_total: number | null
          organization_id: string | null
          product_type: string
          status: string
          updated_at: string | null
          vehicle_info: Json | null
        }
        Insert: {
          color_info?: Json | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          design_instructions?: string | null
          designer_id?: string | null
          id?: string
          order_number: string
          order_total?: number | null
          organization_id?: string | null
          product_type: string
          status?: string
          updated_at?: string | null
          vehicle_info?: Json | null
        }
        Update: {
          color_info?: Json | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          design_instructions?: string | null
          designer_id?: string | null
          id?: string
          order_number?: string
          order_total?: number | null
          organization_id?: string | null
          product_type?: string
          status?: string
          updated_at?: string | null
          vehicle_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "approveflow_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      dashboard_hero_images: {
        Row: {
          background_position_desktop: string | null
          background_position_mobile: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          subtitle: string | null
          time_of_day: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          background_position_desktop?: string | null
          background_position_mobile?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          subtitle?: string | null
          time_of_day?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          background_position_desktop?: string | null
          background_position_mobile?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          subtitle?: string | null
          time_of_day?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      design_panel_folders: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          parent_folder_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          parent_folder_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          parent_folder_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_panel_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_panel_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "design_panel_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      design_panel_versions: {
        Row: {
          changes_description: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          panel_3d_url: string | null
          panel_id: string
          panel_preview_url: string
          tiff_url: string | null
          version_number: number
        }
        Insert: {
          changes_description?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          panel_3d_url?: string | null
          panel_id: string
          panel_preview_url: string
          tiff_url?: string | null
          version_number: number
        }
        Update: {
          changes_description?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          panel_3d_url?: string | null
          panel_id?: string
          panel_preview_url?: string
          tiff_url?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_panel_versions_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "design_panels"
            referencedColumns: ["id"]
          },
        ]
      }
      design_panels: {
        Row: {
          created_at: string | null
          folder_id: string | null
          height_inches: number
          id: string
          intensity: string | null
          is_shared: boolean | null
          is_template: boolean | null
          metadata: Json | null
          organization_id: string | null
          panel_3d_url: string | null
          panel_preview_url: string
          style: string
          substyle: string | null
          tags: string[] | null
          thumbnail_url: string | null
          tiff_url: string | null
          updated_at: string | null
          user_id: string
          vehicle_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
          width_inches: number
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          height_inches: number
          id?: string
          intensity?: string | null
          is_shared?: boolean | null
          is_template?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          panel_3d_url?: string | null
          panel_preview_url: string
          style: string
          substyle?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          tiff_url?: string | null
          updated_at?: string | null
          user_id: string
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          width_inches: number
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          height_inches?: number
          id?: string
          intensity?: string | null
          is_shared?: boolean | null
          is_template?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          panel_3d_url?: string | null
          panel_preview_url?: string
          style?: string
          substyle?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          tiff_url?: string | null
          updated_at?: string | null
          user_id?: string
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          width_inches?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_panels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_panels_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_models"
            referencedColumns: ["id"]
          },
        ]
      }
      email_branding: {
        Row: {
          created_at: string | null
          footer_text: string | null
          id: string
          logo_url: string | null
          organization_id: string | null
          primary_color: string | null
          secondary_color: string | null
          sender_email: string | null
          sender_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          organization_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          sender_email?: string | null
          sender_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          organization_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          sender_email?: string | null
          sender_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_branding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string | null
          customer_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          quote_id: string | null
          utim_data: Json
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          quote_id?: string | null
          utim_data?: Json
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          quote_id?: string | null
          utim_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "email_retarget_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      email_retarget_customers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          last_quote_amount: number | null
          last_quote_date: string | null
          name: string
          organization_id: string | null
          phone: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          last_quote_amount?: number | null
          last_quote_date?: string | null
          name: string
          organization_id?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          last_quote_amount?: number | null
          last_quote_date?: string | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_retarget_customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string | null
          description: string | null
          design_style: string | null
          emails: Json | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          send_delay_days: number | null
          updated_at: string | null
          writing_tone: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          design_style?: string | null
          emails?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          send_delay_days?: number | null
          updated_at?: string | null
          writing_tone?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          design_style?: string | null
          emails?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          send_delay_days?: number | null
          updated_at?: string | null
          writing_tone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_tracking: {
        Row: {
          clicked_at: string | null
          customer_id: string | null
          email_subject: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          sent_at: string | null
          sequence_id: string | null
          status: string | null
        }
        Insert: {
          clicked_at?: string | null
          customer_id?: string | null
          email_subject?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          sequence_id?: string | null
          status?: string | null
        }
        Update: {
          clicked_at?: string | null
          customer_id?: string | null
          email_subject?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          sequence_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "email_retarget_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracking_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_signups: {
        Row: {
          created_at: string | null
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      margin_settings: {
        Row: {
          created_at: string | null
          id: string
          margin_percentage: number
          organization_id: string | null
          scope: string
          scope_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          margin_percentage?: number
          organization_id?: string | null
          scope: string
          scope_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          margin_percentage?: number
          organization_id?: string | null
          scope?: string
          scope_value?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margin_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          organization_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          affiliate_founder_id: string | null
          branding: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          owner_id: string | null
          subdomain: string
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_founder_id?: string | null
          branding?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          owner_id?: string | null
          subdomain: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_founder_id?: string | null
          branding?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          owner_id?: string | null
          subdomain?: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_affiliate_founder_id_fkey"
            columns: ["affiliate_founder_id"]
            isOneToOne: false
            referencedRelation: "affiliate_founders"
            referencedColumns: ["id"]
          },
        ]
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
          is_locked: boolean
          organization_id: string | null
          price_per_sqft: number | null
          pricing_type: string
          product_name: string
          product_type: string
          updated_at: string
          woo_product_id: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          flat_price?: number | null
          id?: string
          is_active?: boolean
          is_locked?: boolean
          organization_id?: string | null
          price_per_sqft?: number | null
          pricing_type: string
          product_name: string
          product_type?: string
          updated_at?: string
          woo_product_id?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          flat_price?: number | null
          id?: string
          is_active?: boolean
          is_locked?: boolean
          organization_id?: string | null
          price_per_sqft?: number | null
          pricing_type?: string
          product_name?: string
          product_type?: string
          updated_at?: string
          woo_product_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          line_total: number
          notes: string | null
          panel_selections: Json | null
          product_id: string | null
          product_name: string
          quantity: number | null
          quote_id: string
          sqft: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          line_total: number
          notes?: string | null
          panel_selections?: Json | null
          product_id?: string | null
          product_name: string
          quantity?: number | null
          quote_id: string
          sqft?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          line_total?: number
          notes?: string | null
          panel_selections?: Json | null
          product_id?: string | null
          product_name?: string
          quantity?: number | null
          quote_id?: string
          sqft?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
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
      quotes: {
        Row: {
          auto_retarget: boolean | null
          click_count: number | null
          conversion_date: string | null
          conversion_revenue: number | null
          converted_to_order: boolean | null
          created_at: string
          customer_company: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          customer_price: number | null
          email_design: string | null
          email_tone: string | null
          engagement_level: string | null
          expires_at: string | null
          follow_up_count: number | null
          id: string
          installation_cost: number | null
          installation_description: string | null
          installation_hours: number | null
          installation_included: boolean | null
          installation_rate: number | null
          labor_cost: number | null
          last_activity: string | null
          last_follow_up_sent: string | null
          margin: number | null
          material_cost: number | null
          open_count: number | null
          organization_id: string | null
          product_name: string | null
          quote_number: string
          reseller_profit: number | null
          sqft: number | null
          status: string | null
          total_price: number
          updated_at: string
          utim_score: number | null
          vehicle_details: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
          wc_sync_status: string | null
          wholesale_cost: number | null
          woo_order_id: string | null
        }
        Insert: {
          auto_retarget?: boolean | null
          click_count?: number | null
          conversion_date?: string | null
          conversion_revenue?: number | null
          converted_to_order?: boolean | null
          created_at?: string
          customer_company?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          customer_price?: number | null
          email_design?: string | null
          email_tone?: string | null
          engagement_level?: string | null
          expires_at?: string | null
          follow_up_count?: number | null
          id?: string
          installation_cost?: number | null
          installation_description?: string | null
          installation_hours?: number | null
          installation_included?: boolean | null
          installation_rate?: number | null
          labor_cost?: number | null
          last_activity?: string | null
          last_follow_up_sent?: string | null
          margin?: number | null
          material_cost?: number | null
          open_count?: number | null
          organization_id?: string | null
          product_name?: string | null
          quote_number: string
          reseller_profit?: number | null
          sqft?: number | null
          status?: string | null
          total_price: number
          updated_at?: string
          utim_score?: number | null
          vehicle_details?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          wc_sync_status?: string | null
          wholesale_cost?: number | null
          woo_order_id?: string | null
        }
        Update: {
          auto_retarget?: boolean | null
          click_count?: number | null
          conversion_date?: string | null
          conversion_revenue?: number | null
          converted_to_order?: boolean | null
          created_at?: string
          customer_company?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          customer_price?: number | null
          email_design?: string | null
          email_tone?: string | null
          engagement_level?: string | null
          expires_at?: string | null
          follow_up_count?: number | null
          id?: string
          installation_cost?: number | null
          installation_description?: string | null
          installation_hours?: number | null
          installation_included?: boolean | null
          installation_rate?: number | null
          labor_cost?: number | null
          last_activity?: string | null
          last_follow_up_sent?: string | null
          margin?: number | null
          material_cost?: number | null
          open_count?: number | null
          organization_id?: string | null
          product_name?: string | null
          quote_number?: string
          reseller_profit?: number | null
          sqft?: number | null
          status?: string | null
          total_price?: number
          updated_at?: string
          utim_score?: number | null
          vehicle_details?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          wc_sync_status?: string | null
          wholesale_cost?: number | null
          woo_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          order_source: string | null
          organization_id: string | null
          preflight_status: string | null
          priority: string | null
          product_image_url: string | null
          product_type: string
          shipped_at: string | null
          source_organization_id: string | null
          status: string
          timeline: Json | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          vehicle_info: Json | null
          woo_order_id: number | null
          woo_order_number: number | null
          wpw_production_order_id: string | null
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
          order_source?: string | null
          organization_id?: string | null
          preflight_status?: string | null
          priority?: string | null
          product_image_url?: string | null
          product_type: string
          shipped_at?: string | null
          source_organization_id?: string | null
          status?: string
          timeline?: Json | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          vehicle_info?: Json | null
          woo_order_id?: number | null
          woo_order_number?: number | null
          wpw_production_order_id?: string | null
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
          order_source?: string | null
          organization_id?: string | null
          preflight_status?: string | null
          priority?: string | null
          product_image_url?: string | null
          product_type?: string
          shipped_at?: string | null
          source_organization_id?: string | null
          status?: string
          timeline?: Json | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          vehicle_info?: Json | null
          woo_order_id?: number | null
          woo_order_number?: number | null
          wpw_production_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopflow_orders_approveflow_project_id_fkey"
            columns: ["approveflow_project_id"]
            isOneToOne: false
            referencedRelation: "approveflow_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopflow_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopflow_orders_source_organization_id_fkey"
            columns: ["source_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopflow_orders_wpw_production_order_id_fkey"
            columns: ["wpw_production_order_id"]
            isOneToOne: false
            referencedRelation: "shopflow_orders"
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
      vehicle_models: {
        Row: {
          angle_front: string | null
          angle_front_close: string | null
          angle_rear: string | null
          angle_side: string | null
          body_type: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          default_environment: string | null
          default_finish: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_hidden: boolean | null
          is_oem: boolean | null
          make: string
          model: string
          panel_geometry: Json | null
          render_prompt: string | null
          sort_order: number | null
          thumbnail_url: string | null
          updated_at: string | null
          year: string
        }
        Insert: {
          angle_front?: string | null
          angle_front_close?: string | null
          angle_rear?: string | null
          angle_side?: string | null
          body_type?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_environment?: string | null
          default_finish?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_hidden?: boolean | null
          is_oem?: boolean | null
          make: string
          model: string
          panel_geometry?: Json | null
          render_prompt?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          year: string
        }
        Update: {
          angle_front?: string | null
          angle_front_close?: string | null
          angle_rear?: string | null
          angle_side?: string | null
          body_type?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_environment?: string | null
          default_finish?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_hidden?: boolean | null
          is_oem?: boolean | null
          make?: string
          model?: string
          panel_geometry?: Json | null
          render_prompt?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          year?: string
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
      get_user_organization_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_organization_owner: { Args: { _org_id: string }; Returns: boolean }
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
