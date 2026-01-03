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
      accountability_overrides: {
        Row: {
          created_at: string
          days_since_campaign: number | null
          id: string
          organization_id: string | null
          overridden_by: string | null
          overridden_by_name: string | null
          override_reason: string
          override_type: string
          warning_level: string | null
        }
        Insert: {
          created_at?: string
          days_since_campaign?: number | null
          id?: string
          organization_id?: string | null
          overridden_by?: string | null
          overridden_by_name?: string | null
          override_reason: string
          override_type: string
          warning_level?: string | null
        }
        Update: {
          created_at?: string
          days_since_campaign?: number | null
          id?: string
          organization_id?: string | null
          overridden_by?: string | null
          overridden_by_name?: string | null
          override_reason?: string
          override_type?: string
          warning_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accountability_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_performance: {
        Row: {
          ad_set_name: string | null
          ad_type: string
          ad_vault_id: string | null
          aov: number | null
          campaign_name: string | null
          clicks: number | null
          content_queue_id: string | null
          conversion_rate: number | null
          conversions: number | null
          cost_per_conversion: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          date_range_end: string | null
          date_range_start: string | null
          id: string
          impressions: number | null
          last_synced_at: string | null
          organization_id: string | null
          placement: string | null
          platform: string | null
          revenue: number | null
          roas: number | null
          spend: number | null
          updated_at: string | null
        }
        Insert: {
          ad_set_name?: string | null
          ad_type?: string
          ad_vault_id?: string | null
          aov?: number | null
          campaign_name?: string | null
          clicks?: number | null
          content_queue_id?: string | null
          conversion_rate?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          impressions?: number | null
          last_synced_at?: string | null
          organization_id?: string | null
          placement?: string | null
          platform?: string | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          updated_at?: string | null
        }
        Update: {
          ad_set_name?: string | null
          ad_type?: string
          ad_vault_id?: string | null
          aov?: number | null
          campaign_name?: string | null
          clicks?: number | null
          content_queue_id?: string | null
          conversion_rate?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          impressions?: number | null
          last_synced_at?: string | null
          organization_id?: string | null
          placement?: string | null
          platform?: string | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_performance_ad_vault_id_fkey"
            columns: ["ad_vault_id"]
            isOneToOne: false
            referencedRelation: "ad_vault"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_performance_content_queue_id_fkey"
            columns: ["content_queue_id"]
            isOneToOne: false
            referencedRelation: "content_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_performance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_vault: {
        Row: {
          created_at: string
          cta: string | null
          headline: string | null
          id: string
          layout_json: Json | null
          organization_id: string
          placement: string
          png_url: string
          primary_text: string | null
          template_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          cta?: string | null
          headline?: string | null
          id?: string
          layout_json?: Json | null
          organization_id: string
          placement: string
          png_url: string
          primary_text?: string | null
          template_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          cta?: string | null
          headline?: string | null
          id?: string
          layout_json?: Json | null
          organization_id?: string
          placement?: string
          png_url?: string
          primary_text?: string | null
          template_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_vault_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
          agreed_to_terms: boolean | null
          agreed_to_terms_at: string | null
          avatar_url: string | null
          bio: string | null
          commission_rate: number | null
          company_name: string | null
          content_creator_opted_in: boolean | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          onboarding_step: number | null
          payout_email: string | null
          payout_method: string | null
          phone: string | null
          social_links: Json | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          updated_at: string | null
        }
        Insert: {
          affiliate_code: string
          agreed_to_terms?: boolean | null
          agreed_to_terms_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          commission_rate?: number | null
          company_name?: string | null
          content_creator_opted_in?: boolean | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          onboarding_step?: number | null
          payout_email?: string | null
          payout_method?: string | null
          phone?: string | null
          social_links?: Json | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string | null
        }
        Update: {
          affiliate_code?: string
          agreed_to_terms?: boolean | null
          agreed_to_terms_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          commission_rate?: number | null
          company_name?: string | null
          content_creator_opted_in?: boolean | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          onboarding_step?: number | null
          payout_email?: string | null
          payout_method?: string | null
          phone?: string | null
          social_links?: Json | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
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
      affiliate_media: {
        Row: {
          affiliate_id: string
          brand: string
          created_at: string
          id: string
          notes: string | null
          organization_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          storage_path: string
          tags: string[] | null
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          affiliate_id: string
          brand?: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          storage_path: string
          tags?: string[] | null
          type?: string
          updated_at?: string
          url: string
        }
        Update: {
          affiliate_id?: string
          brand?: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          storage_path?: string
          tags?: string[] | null
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
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
      agent_alerts: {
        Row: {
          agent_id: string
          alert_type: string
          conversation_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          email_sent_at: string | null
          email_sent_to: string[] | null
          id: string
          message_excerpt: string | null
          metadata: Json | null
          order_id: string | null
          order_number: string | null
          organization_id: string | null
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          task_id: string | null
          task_status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string
          alert_type: string
          conversation_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          email_sent_at?: string | null
          email_sent_to?: string[] | null
          id?: string
          message_excerpt?: string | null
          metadata?: Json | null
          order_id?: string | null
          order_number?: string | null
          organization_id?: string | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          task_id?: string | null
          task_status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          alert_type?: string
          conversation_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          email_sent_at?: string | null
          email_sent_to?: string[] | null
          id?: string
          message_excerpt?: string | null
          metadata?: Json | null
          order_id?: string | null
          order_number?: string | null
          organization_id?: string | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          task_id?: string | null
          task_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_alerts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_alerts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "instagram_leads_with_emails"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "agent_alerts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mightychat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_alerts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ops_backlog_needs_response"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_alerts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "website_chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopflow_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_alerts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "migrated_content_audit"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "agent_alerts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_chat_messages: {
        Row: {
          agent_chat_id: string | null
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          sender: string
        }
        Insert: {
          agent_chat_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          sender: string
        }
        Update: {
          agent_chat_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_chat_messages_agent_chat_id_fkey"
            columns: ["agent_chat_id"]
            isOneToOne: false
            referencedRelation: "agent_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_chats: {
        Row: {
          agent_id: string
          context: Json | null
          created_at: string | null
          id: string
          organization_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          context?: Json | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          context?: Json | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_chats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_coaching_memory: {
        Row: {
          active: boolean | null
          agent_id: string
          created_at: string | null
          id: string
          note: string
        }
        Insert: {
          active?: boolean | null
          agent_id: string
          created_at?: string | null
          id?: string
          note: string
        }
        Update: {
          active?: boolean | null
          agent_id?: string
          created_at?: string | null
          id?: string
          note?: string
        }
        Relationships: []
      }
      agent_conversations: {
        Row: {
          agent_name: string
          conversation_id: string
          id: string
          messages: Json
          updated_at: string
        }
        Insert: {
          agent_name: string
          conversation_id: string
          id?: string
          messages?: Json
          updated_at?: string
        }
        Update: {
          agent_name?: string
          conversation_id?: string
          id?: string
          messages?: Json
          updated_at?: string
        }
        Relationships: []
      }
      agent_schedules: {
        Row: {
          active_after: string | null
          active_before: string | null
          active_holidays: boolean | null
          active_weekends: boolean | null
          agent_name: string
          created_at: string | null
          emergency_off: boolean | null
          enabled: boolean | null
          force_on: boolean
          id: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          active_after?: string | null
          active_before?: string | null
          active_holidays?: boolean | null
          active_weekends?: boolean | null
          agent_name: string
          created_at?: string | null
          emergency_off?: boolean | null
          enabled?: boolean | null
          force_on?: boolean
          id?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          active_after?: string | null
          active_before?: string | null
          active_holidays?: boolean | null
          active_weekends?: boolean | null
          agent_name?: string
          created_at?: string | null
          emergency_off?: boolean | null
          enabled?: boolean | null
          force_on?: boolean
          id?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_weekly_directives: {
        Row: {
          active: boolean | null
          agent_id: string
          created_at: string | null
          directive: string
          id: string
          week_of: string
        }
        Insert: {
          active?: boolean | null
          agent_id: string
          created_at?: string | null
          directive: string
          id?: string
          week_of: string
        }
        Update: {
          active?: boolean | null
          agent_id?: string
          created_at?: string | null
          directive?: string
          id?: string
          week_of?: string
        }
        Relationships: []
      }
      ai_actions: {
        Row: {
          action_payload: Json | null
          action_type: string
          approved_at: string | null
          approved_by: string | null
          channel: string | null
          conversation_id: string | null
          created_at: string | null
          executed_at: string | null
          id: string
          organization_id: string | null
          preview: string | null
          priority: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          action_payload?: Json | null
          action_type: string
          approved_at?: string | null
          approved_by?: string | null
          channel?: string | null
          conversation_id?: string | null
          created_at?: string | null
          executed_at?: string | null
          id?: string
          organization_id?: string | null
          preview?: string | null
          priority?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          action_payload?: Json | null
          action_type?: string
          approved_at?: string | null
          approved_by?: string | null
          channel?: string | null
          conversation_id?: string | null
          created_at?: string | null
          executed_at?: string | null
          id?: string
          organization_id?: string | null
          preview?: string | null
          priority?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "instagram_leads_with_emails"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "ai_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mightychat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ops_backlog_needs_response"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "website_chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_corrections: {
        Row: {
          approved_response: string
          category: string | null
          created_at: string | null
          flagged_response: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          trigger_phrase: string
          updated_at: string | null
        }
        Insert: {
          approved_response: string
          category?: string | null
          created_at?: string | null
          flagged_response?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          trigger_phrase: string
          updated_at?: string | null
        }
        Update: {
          approved_response?: string
          category?: string | null
          created_at?: string | null
          flagged_response?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          trigger_phrase?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_corrections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_creatives: {
        Row: {
          blueprint: Json
          blueprint_id: string | null
          brand: string | null
          channel: string | null
          created_at: string
          created_by: string | null
          created_by_agent: string | null
          description: string | null
          download_url: string | null
          finalized_at: string | null
          format_slug: string | null
          id: string
          latest_render_job_id: string | null
          metadata: Json | null
          organization_id: string | null
          output_url: string | null
          platform: string | null
          source_id: string | null
          source_type: string
          status: string
          storage_path: string | null
          thumbnail_url: string | null
          title: string | null
          tool_slug: string | null
          updated_at: string
        }
        Insert: {
          blueprint?: Json
          blueprint_id?: string | null
          brand?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          created_by_agent?: string | null
          description?: string | null
          download_url?: string | null
          finalized_at?: string | null
          format_slug?: string | null
          id?: string
          latest_render_job_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          output_url?: string | null
          platform?: string | null
          source_id?: string | null
          source_type: string
          status?: string
          storage_path?: string | null
          thumbnail_url?: string | null
          title?: string | null
          tool_slug?: string | null
          updated_at?: string
        }
        Update: {
          blueprint?: Json
          blueprint_id?: string | null
          brand?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          created_by_agent?: string | null
          description?: string | null
          download_url?: string | null
          finalized_at?: string | null
          format_slug?: string | null
          id?: string
          latest_render_job_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          output_url?: string | null
          platform?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          storage_path?: string | null
          thumbnail_url?: string | null
          title?: string | null
          tool_slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_creatives_latest_render_job_id_fkey"
            columns: ["latest_render_job_id"]
            isOneToOne: false
            referencedRelation: "video_edit_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_creatives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_status_settings: {
        Row: {
          id: string
          mode: string
          organization_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          mode?: string
          organization_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          mode?: string
          organization_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_status_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          sort_order: number | null
          view_type: string | null
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          project_id: string
          sort_order?: number | null
          view_type?: string | null
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string
          sort_order?: number | null
          view_type?: string | null
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
          current_version: number | null
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
          current_version?: number | null
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
          current_version?: number | null
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
      auto_recovery_campaigns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campaign_type: string
          created_at: string
          email_html: string | null
          expires_at: string | null
          id: string
          meta_ad_copy: string | null
          organization_id: string | null
          preview_text: string | null
          rejected_reason: string | null
          sent_at: string | null
          sms_copy: string | null
          status: string | null
          subject_line: string
          suggested_segments: Json | null
          trigger_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_type?: string
          created_at?: string
          email_html?: string | null
          expires_at?: string | null
          id?: string
          meta_ad_copy?: string | null
          organization_id?: string | null
          preview_text?: string | null
          rejected_reason?: string | null
          sent_at?: string | null
          sms_copy?: string | null
          status?: string | null
          subject_line: string
          suggested_segments?: Json | null
          trigger_type: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_type?: string
          created_at?: string
          email_html?: string | null
          expires_at?: string | null
          id?: string
          meta_ad_copy?: string | null
          organization_id?: string | null
          preview_text?: string | null
          rejected_reason?: string | null
          sent_at?: string | null
          sms_copy?: string | null
          status?: string | null
          subject_line?: string
          suggested_segments?: Json | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_recovery_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_overlay_templates: {
        Row: {
          animation: string
          brand: string
          created_at: string | null
          example: string | null
          id: string
          name: string
          organization_id: string | null
          position: string
          prompt: string
          tone: string | null
        }
        Insert: {
          animation?: string
          brand: string
          created_at?: string | null
          example?: string | null
          id?: string
          name: string
          organization_id?: string | null
          position?: string
          prompt: string
          tone?: string | null
        }
        Update: {
          animation?: string
          brand?: string
          created_at?: string | null
          example?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          position?: string
          prompt?: string
          tone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_overlay_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          brand_ad_examples: Json | null
          brand_id: string
          brand_name: string
          brand_overlays: Json | null
          brand_voice: Json | null
          created_at: string | null
          style_modifiers: Json | null
          subdomain: string
        }
        Insert: {
          brand_ad_examples?: Json | null
          brand_id?: string
          brand_name: string
          brand_overlays?: Json | null
          brand_voice?: Json | null
          created_at?: string | null
          style_modifiers?: Json | null
          subdomain: string
        }
        Update: {
          brand_ad_examples?: Json | null
          brand_id?: string
          brand_name?: string
          brand_overlays?: Json | null
          brand_voice?: Json | null
          created_at?: string | null
          style_modifiers?: Json | null
          subdomain?: string
        }
        Relationships: []
      }
      campaign_heartbeat: {
        Row: {
          audience_size: number | null
          campaign_name: string
          campaign_source: string | null
          campaign_type: string
          clicked_count: number | null
          created_at: string
          id: string
          opened_count: number | null
          organization_id: string | null
          revenue_attributed: number | null
          sent_at: string
        }
        Insert: {
          audience_size?: number | null
          campaign_name: string
          campaign_source?: string | null
          campaign_type: string
          clicked_count?: number | null
          created_at?: string
          id?: string
          opened_count?: number | null
          organization_id?: string | null
          revenue_attributed?: number | null
          sent_at?: string
        }
        Update: {
          audience_size?: number | null
          campaign_name?: string
          campaign_source?: string | null
          campaign_type?: string
          clicked_count?: number | null
          created_at?: string
          id?: string
          opened_count?: number | null
          organization_id?: string | null
          revenue_attributed?: number | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_heartbeat_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      caption_library: {
        Row: {
          agitate: string[]
          audience: string
          created_at: string | null
          cta: string | null
          hook: string[]
          id: string
          intensity: string
          is_system: boolean | null
          organization_id: string | null
          pain_type: string
          resolve: string[]
          updated_at: string | null
          wrap_type_category: string
        }
        Insert: {
          agitate: string[]
          audience: string
          created_at?: string | null
          cta?: string | null
          hook: string[]
          id?: string
          intensity: string
          is_system?: boolean | null
          organization_id?: string | null
          pain_type: string
          resolve: string[]
          updated_at?: string | null
          wrap_type_category: string
        }
        Update: {
          agitate?: string[]
          audience?: string
          created_at?: string | null
          cta?: string | null
          hook?: string[]
          id?: string
          intensity?: string
          is_system?: boolean | null
          organization_id?: string | null
          pain_type?: string
          resolve?: string[]
          updated_at?: string | null
          wrap_type_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "caption_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_scripts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          script_json: Json
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          script_json?: Json
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          script_json?: Json
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_scripts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      contacts: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          last_contacted_at: string | null
          metadata: Json | null
          name: string
          organization_id: string | null
          phone: string | null
          priority: string | null
          source: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          metadata?: Json | null
          name: string
          organization_id?: string | null
          phone?: string | null
          priority?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          priority?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_affiliate_uploads: {
        Row: {
          affiliate_id: string
          brand: string | null
          content_file_id: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          affiliate_id: string
          brand?: string | null
          content_file_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          brand?: string | null
          content_file_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_affiliate_uploads_content_file_id_fkey"
            columns: ["content_file_id"]
            isOneToOne: false
            referencedRelation: "content_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_affiliate_uploads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_atoms: {
        Row: {
          ad_angles: string[] | null
          atom_type: string
          created_at: string | null
          id: string
          is_used: boolean | null
          organization_id: string | null
          original_text: string
          processed_text: string | null
          product_id: string | null
          source_type: string
          suggested_formats: string[] | null
          tags: string[] | null
          use_count: number | null
        }
        Insert: {
          ad_angles?: string[] | null
          atom_type?: string
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          organization_id?: string | null
          original_text: string
          processed_text?: string | null
          product_id?: string | null
          source_type?: string
          suggested_formats?: string[] | null
          tags?: string[] | null
          use_count?: number | null
        }
        Update: {
          ad_angles?: string[] | null
          atom_type?: string
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          organization_id?: string | null
          original_text?: string
          processed_text?: string | null
          product_id?: string | null
          source_type?: string
          suggested_formats?: string[] | null
          tags?: string[] | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_atoms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_atoms_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          brand: string
          caption: string | null
          content_project_id: string | null
          content_type: string
          created_at: string
          directive: string | null
          engagement_stats: Json | null
          google_doc_url: string | null
          hashtags: string[] | null
          id: string
          in_progress_at: string | null
          migrated: boolean | null
          notes: string | null
          organization_id: string | null
          platform: string
          post_url: string | null
          posted_at: string | null
          ready_at: string | null
          scheduled_date: string
          scheduled_time: string
          status: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          brand: string
          caption?: string | null
          content_project_id?: string | null
          content_type: string
          created_at?: string
          directive?: string | null
          engagement_stats?: Json | null
          google_doc_url?: string | null
          hashtags?: string[] | null
          id?: string
          in_progress_at?: string | null
          migrated?: boolean | null
          notes?: string | null
          organization_id?: string | null
          platform: string
          post_url?: string | null
          posted_at?: string | null
          ready_at?: string | null
          scheduled_date: string
          scheduled_time?: string
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          caption?: string | null
          content_project_id?: string | null
          content_type?: string
          created_at?: string
          directive?: string | null
          engagement_stats?: Json | null
          google_doc_url?: string | null
          hashtags?: string[] | null
          id?: string
          in_progress_at?: string | null
          migrated?: boolean | null
          notes?: string | null
          organization_id?: string | null
          platform?: string
          post_url?: string | null
          posted_at?: string | null
          ready_at?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_content_project_id_fkey"
            columns: ["content_project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_drafts: {
        Row: {
          caption: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          created_by_agent: string | null
          hashtags: string[] | null
          id: string
          media_url: string | null
          organization_id: string | null
          platform: string
          platform_post_id: string | null
          publish_error: string | null
          published_at: string | null
          published_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_for: string | null
          status: string
          task_id: string | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          created_by_agent?: string | null
          hashtags?: string[] | null
          id?: string
          media_url?: string | null
          organization_id?: string | null
          platform: string
          platform_post_id?: string | null
          publish_error?: string | null
          published_at?: string | null
          published_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          status?: string
          task_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          created_by_agent?: string | null
          hashtags?: string[] | null
          id?: string
          media_url?: string | null
          organization_id?: string | null
          platform?: string
          platform_post_id?: string | null
          publish_error?: string | null
          published_at?: string | null
          published_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          status?: string
          task_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_drafts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "migrated_content_audit"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "content_drafts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      content_files: {
        Row: {
          ai_labels: Json | null
          brand: string
          content_category: string | null
          created_at: string
          dominant_colors: string[] | null
          duration_seconds: number | null
          file_size_bytes: number | null
          file_type: string
          file_url: string
          height: number | null
          id: string
          metadata: Json | null
          mux_asset_id: string | null
          mux_playback_id: string | null
          organization_id: string | null
          original_filename: string | null
          processing_status: string | null
          source: string
          source_id: string | null
          tags: string[] | null
          thumbnail_generated_at: string | null
          thumbnail_url: string | null
          transcript: string | null
          updated_at: string
          uploader_id: string | null
          vehicle_info: Json | null
          visual_analyzed_at: string | null
          visual_tags: Json | null
          width: number | null
        }
        Insert: {
          ai_labels?: Json | null
          brand?: string
          content_category?: string | null
          created_at?: string
          dominant_colors?: string[] | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_type?: string
          file_url: string
          height?: number | null
          id?: string
          metadata?: Json | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          organization_id?: string | null
          original_filename?: string | null
          processing_status?: string | null
          source?: string
          source_id?: string | null
          tags?: string[] | null
          thumbnail_generated_at?: string | null
          thumbnail_url?: string | null
          transcript?: string | null
          updated_at?: string
          uploader_id?: string | null
          vehicle_info?: Json | null
          visual_analyzed_at?: string | null
          visual_tags?: Json | null
          width?: number | null
        }
        Update: {
          ai_labels?: Json | null
          brand?: string
          content_category?: string | null
          created_at?: string
          dominant_colors?: string[] | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          height?: number | null
          id?: string
          metadata?: Json | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          organization_id?: string | null
          original_filename?: string | null
          processing_status?: string | null
          source?: string
          source_id?: string | null
          tags?: string[] | null
          thumbnail_generated_at?: string | null
          thumbnail_url?: string | null
          transcript?: string | null
          updated_at?: string
          uploader_id?: string | null
          vehicle_info?: Json | null
          visual_analyzed_at?: string | null
          visual_tags?: Json | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_generation_queue: {
        Row: {
          attempts: number | null
          brand: string
          completed_at: string | null
          content_file_id: string | null
          created_at: string
          generation_type: string | null
          id: string
          last_error: string | null
          organization_id: string | null
          priority: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          brand: string
          completed_at?: string | null
          content_file_id?: string | null
          created_at?: string
          generation_type?: string | null
          id?: string
          last_error?: string | null
          organization_id?: string | null
          priority?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          brand?: string
          completed_at?: string | null
          content_file_id?: string | null
          created_at?: string
          generation_type?: string | null
          id?: string
          last_error?: string | null
          organization_id?: string | null
          priority?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_generation_queue_content_file_id_fkey"
            columns: ["content_file_id"]
            isOneToOne: false
            referencedRelation: "content_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_generation_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_intents: {
        Row: {
          angle: string | null
          brand: string | null
          caption_style: string | null
          created_at: string | null
          forbidden_tags: string[] | null
          goal: string | null
          id: string
          is_template: boolean | null
          max_clips: number | null
          min_clips: number | null
          min_motion: number | null
          music_style: string | null
          name: string
          organization_id: string | null
          platform: string
          required_tags: string[] | null
        }
        Insert: {
          angle?: string | null
          brand?: string | null
          caption_style?: string | null
          created_at?: string | null
          forbidden_tags?: string[] | null
          goal?: string | null
          id?: string
          is_template?: boolean | null
          max_clips?: number | null
          min_clips?: number | null
          min_motion?: number | null
          music_style?: string | null
          name: string
          organization_id?: string | null
          platform: string
          required_tags?: string[] | null
        }
        Update: {
          angle?: string | null
          brand?: string | null
          caption_style?: string | null
          created_at?: string | null
          forbidden_tags?: string[] | null
          goal?: string | null
          id?: string
          is_template?: boolean | null
          max_clips?: number | null
          min_clips?: number | null
          min_motion?: number | null
          music_style?: string | null
          name?: string
          organization_id?: string | null
          platform?: string
          required_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "content_intents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_jobs: {
        Row: {
          agent: string
          content_draft_id: string | null
          content_queue_id: string | null
          conversation_id: string | null
          create_content_block: string
          created_at: string
          delegated_task_id: string | null
          error: string | null
          id: string
          mode: string
          organization_id: string | null
          parsed: Json
          requested_by: string
          result: Json
          status: string
          updated_at: string
          video_edit_queue_id: string | null
        }
        Insert: {
          agent?: string
          content_draft_id?: string | null
          content_queue_id?: string | null
          conversation_id?: string | null
          create_content_block: string
          created_at?: string
          delegated_task_id?: string | null
          error?: string | null
          id?: string
          mode?: string
          organization_id?: string | null
          parsed?: Json
          requested_by?: string
          result?: Json
          status?: string
          updated_at?: string
          video_edit_queue_id?: string | null
        }
        Update: {
          agent?: string
          content_draft_id?: string | null
          content_queue_id?: string | null
          conversation_id?: string | null
          create_content_block?: string
          created_at?: string
          delegated_task_id?: string | null
          error?: string | null
          id?: string
          mode?: string
          organization_id?: string | null
          parsed?: Json
          requested_by?: string
          result?: Json
          status?: string
          updated_at?: string
          video_edit_queue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_projects: {
        Row: {
          ai_brief: string | null
          ai_output: Json | null
          brand: string
          canva_export_json: Json | null
          content_file_ids: string[] | null
          created_at: string
          created_by: string | null
          goal: string | null
          id: string
          organization_id: string | null
          platform: string | null
          project_type: string
          published_at: string | null
          published_url: string | null
          scheduled_for: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          ai_brief?: string | null
          ai_output?: Json | null
          brand?: string
          canva_export_json?: Json | null
          content_file_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          goal?: string | null
          id?: string
          organization_id?: string | null
          platform?: string | null
          project_type?: string
          published_at?: string | null
          published_url?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          ai_brief?: string | null
          ai_output?: Json | null
          brand?: string
          canva_export_json?: Json | null
          content_file_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          goal?: string | null
          id?: string
          organization_id?: string | null
          platform?: string | null
          project_type?: string
          published_at?: string | null
          published_url?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_queue: {
        Row: {
          ad_placement: string | null
          ai_metadata: Json | null
          ai_prompt: string | null
          brand: string | null
          caption: string | null
          channel: string | null
          content_purpose: string | null
          content_type: string | null
          created_at: string | null
          created_by: string | null
          cta_text: string | null
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          mode: string | null
          organization_id: string | null
          output_url: string | null
          platform: string | null
          published_at: string | null
          references_urls: string[] | null
          review_notes: string | null
          reviewed_by: string | null
          scheduled_for: string | null
          script: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          ad_placement?: string | null
          ai_metadata?: Json | null
          ai_prompt?: string | null
          brand?: string | null
          caption?: string | null
          channel?: string | null
          content_purpose?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          mode?: string | null
          organization_id?: string | null
          output_url?: string | null
          platform?: string | null
          published_at?: string | null
          references_urls?: string[] | null
          review_notes?: string | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          script?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          ad_placement?: string | null
          ai_metadata?: Json | null
          ai_prompt?: string | null
          brand?: string | null
          caption?: string | null
          channel?: string | null
          content_purpose?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          mode?: string | null
          organization_id?: string | null
          output_url?: string | null
          platform?: string | null
          published_at?: string | null
          references_urls?: string[] | null
          review_notes?: string | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          script?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sync_sources: {
        Row: {
          access_token: string | null
          account_name: string | null
          created_at: string
          folder_path: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          organization_id: string | null
          refresh_token: string | null
          source_type: string
          sync_cursor: string | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_name?: string | null
          created_at?: string
          folder_path?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_id?: string | null
          refresh_token?: string | null
          source_type: string
          sync_cursor?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_name?: string | null
          created_at?: string
          folder_path?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_id?: string | null
          refresh_token?: string | null
          source_type?: string
          sync_cursor?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sync_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contentbox_assets: {
        Row: {
          asset_type: string
          created_at: string | null
          duration_seconds: number | null
          file_url: string
          height: number | null
          id: string
          organization_id: string | null
          original_name: string | null
          scan_status: string | null
          scanned: boolean | null
          source: string
          tags: string[] | null
          width: number | null
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          duration_seconds?: number | null
          file_url: string
          height?: number | null
          id?: string
          organization_id?: string | null
          original_name?: string | null
          scan_status?: string | null
          scanned?: boolean | null
          source: string
          tags?: string[] | null
          width?: number | null
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          duration_seconds?: number | null
          file_url?: string
          height?: number | null
          id?: string
          organization_id?: string | null
          original_name?: string | null
          scan_status?: string | null
          scanned?: boolean | null
          source?: string
          tags?: string[] | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contentbox_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_paused: boolean
          approval_required: boolean
          assigned_to: string | null
          autopilot_allowed: boolean
          channel: string
          chat_state: Json | null
          contact_id: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          metadata: Json | null
          organization_id: string | null
          priority: string | null
          recipient_inbox: string | null
          review_status: string | null
          status: string | null
          subject: string | null
          unread_count: number | null
        }
        Insert: {
          ai_paused?: boolean
          approval_required?: boolean
          assigned_to?: string | null
          autopilot_allowed?: boolean
          channel: string
          chat_state?: Json | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          recipient_inbox?: string | null
          review_status?: string | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
        }
        Update: {
          ai_paused?: boolean
          approval_required?: boolean
          assigned_to?: string | null
          autopilot_allowed?: boolean
          channel?: string
          chat_state?: Json | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          recipient_inbox?: string | null
          review_status?: string | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_tag_map: {
        Row: {
          created_at: string | null
          creative_id: string
          tag_slug: string
        }
        Insert: {
          created_at?: string | null
          creative_id: string
          tag_slug: string
        }
        Update: {
          created_at?: string | null
          creative_id?: string
          tag_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_tag_map_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ai_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_tag_map_tag_slug_fkey"
            columns: ["tag_slug"]
            isOneToOne: false
            referencedRelation: "creative_tags"
            referencedColumns: ["slug"]
          },
        ]
      }
      creative_tags: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          slug: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          slug: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          slug?: string
        }
        Relationships: []
      }
      creative_vault: {
        Row: {
          asset_url: string
          content_type: string | null
          conversation_id: string | null
          created_at: string
          created_by: string | null
          id: string
          job_id: string | null
          meta: Json
          organization_id: string | null
          platform: string | null
          thumbnail_url: string | null
          title: string | null
          type: string
        }
        Insert: {
          asset_url: string
          content_type?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          job_id?: string | null
          meta?: Json
          organization_id?: string | null
          platform?: string | null
          thumbnail_url?: string | null
          title?: string | null
          type: string
        }
        Update: {
          asset_url?: string
          content_type?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          job_id?: string | null
          meta?: Json
          organization_id?: string | null
          platform?: string | null
          thumbnail_url?: string | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_vault_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "content_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_vault_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_voice_profiles: {
        Row: {
          ad_angle_preferences: Json | null
          content_examples: Json | null
          created_at: string | null
          id: string
          organization_id: string | null
          persona: Json | null
          style_preference: string | null
          trade_dna: Json | null
          updated_at: string | null
        }
        Insert: {
          ad_angle_preferences?: Json | null
          content_examples?: Json | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          persona?: Json | null
          style_preference?: string | null
          trade_dna?: Json | null
          updated_at?: string | null
        }
        Update: {
          ad_angle_preferences?: Json | null
          content_examples?: Json | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          persona?: Json | null
          style_preference?: string | null
          trade_dna?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_voice_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      delegation_log: {
        Row: {
          agent_chat_id: string | null
          delegated_at: string | null
          delegated_by: string
          id: string
          summary: string
          task_id: string | null
        }
        Insert: {
          agent_chat_id?: string | null
          delegated_at?: string | null
          delegated_by: string
          id?: string
          summary: string
          task_id?: string | null
        }
        Update: {
          agent_chat_id?: string | null
          delegated_at?: string | null
          delegated_by?: string
          id?: string
          summary?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delegation_log_agent_chat_id_fkey"
            columns: ["agent_chat_id"]
            isOneToOne: false
            referencedRelation: "agent_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegation_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "migrated_content_audit"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "delegation_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
      email_bounces: {
        Row: {
          bounce_type: string
          created_at: string
          email: string
          id: string
          provider_data: Json | null
          reason: string | null
        }
        Insert: {
          bounce_type: string
          created_at?: string
          email: string
          id?: string
          provider_data?: Json | null
          reason?: string | null
        }
        Update: {
          bounce_type?: string
          created_at?: string
          email?: string
          id?: string
          provider_data?: Json | null
          reason?: string | null
        }
        Relationships: []
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
      email_design_tokens: {
        Row: {
          accent_color: string | null
          background_color: string | null
          body_font: string | null
          created_at: string | null
          cta_color: string | null
          footer_html: string | null
          headline_color: string | null
          headline_font: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          organization_id: string | null
          text_color: string | null
          token_name: string
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          body_font?: string | null
          created_at?: string | null
          cta_color?: string | null
          footer_html?: string | null
          headline_color?: string | null
          headline_font?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          organization_id?: string | null
          text_color?: string | null
          token_name: string
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          body_font?: string | null
          created_at?: string | null
          cta_color?: string | null
          footer_html?: string | null
          headline_color?: string | null
          headline_font?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          organization_id?: string | null
          text_color?: string | null
          token_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_design_tokens_organization_id_fkey"
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
      email_flow_steps: {
        Row: {
          ai_generated: boolean | null
          body_html: string
          body_text: string | null
          created_at: string
          delay_hours: number
          flow_id: string
          id: string
          preview_text: string | null
          step_number: number
          subject: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          body_html: string
          body_text?: string | null
          created_at?: string
          delay_hours?: number
          flow_id: string
          id?: string
          preview_text?: string | null
          step_number?: number
          subject: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          body_html?: string
          body_text?: string | null
          created_at?: string
          delay_hours?: number
          flow_id?: string
          id?: string
          preview_text?: string | null
          step_number?: number
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_flow_steps_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "email_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      email_flows: {
        Row: {
          brand: string | null
          created_at: string
          description: string | null
          flow_type: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          stats: Json | null
          trigger: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          description?: string | null
          flow_type?: string
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          stats?: Json | null
          trigger?: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          description?: string | null
          flow_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          stats?: Json | null
          trigger?: string
          updated_at?: string
        }
        Relationships: []
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
      email_sequence_enrollments: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_email: string
          customer_name: string | null
          emails_sent: number | null
          enrolled_at: string
          id: string
          is_active: boolean | null
          last_email_sent_at: string | null
          quote_id: string | null
          sequence_id: string | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_email: string
          customer_name?: string | null
          emails_sent?: number | null
          enrolled_at?: string
          id?: string
          is_active?: boolean | null
          last_email_sent_at?: string | null
          quote_id?: string | null
          sequence_id?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          emails_sent?: number | null
          enrolled_at?: string
          id?: string
          is_active?: boolean | null
          last_email_sent_at?: string | null
          quote_id?: string | null
          sequence_id?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_enrollments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
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
      email_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          design_json: Json
          html: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          design_json?: Json
          html?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          design_json?: Json
          html?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
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
      email_unsubscribes: {
        Row: {
          created_at: string
          email: string
          id: string
          organization_id: string | null
          reason: string | null
          unsubscribed_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          organization_id?: string | null
          reason?: string | null
          unsubscribed_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          organization_id?: string | null
          reason?: string | null
          unsubscribed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_receipts: {
        Row: {
          action_type: string
          channel: string
          conversation_id: string | null
          created_at: string
          error: string | null
          id: string
          organization_id: string | null
          payload_snapshot: Json
          provider: string | null
          provider_receipt_id: string | null
          source_id: string | null
          source_table: string
          status: string
          updated_at: string
        }
        Insert: {
          action_type: string
          channel: string
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          organization_id?: string | null
          payload_snapshot?: Json
          provider?: string | null
          provider_receipt_id?: string | null
          source_id?: string | null
          source_table?: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          channel?: string
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          organization_id?: string | null
          payload_snapshot?: Json
          provider?: string | null
          provider_receipt_id?: string | null
          source_id?: string | null
          source_table?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_receipts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_receipts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "instagram_leads_with_emails"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "execution_receipts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mightychat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_receipts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ops_backlog_needs_response"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_receipts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "website_chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inspo_analyses: {
        Row: {
          analysis_data: Json
          created_at: string
          id: string
          is_saved: boolean | null
          organization_id: string | null
          platform: string
          source_url: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          analysis_data?: Json
          created_at?: string
          id?: string
          is_saved?: boolean | null
          organization_id?: string | null
          platform?: string
          source_url: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          id?: string
          is_saved?: boolean | null
          organization_id?: string | null
          platform?: string
          source_url?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspo_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          instagram_user_id: string | null
          instagram_username: string | null
          last_refreshed_at: string | null
          organization_id: string | null
          page_access_token: string | null
          page_id: string | null
          page_name: string | null
          token_type: string | null
          updated_at: string | null
          user_access_token: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          instagram_user_id?: string | null
          instagram_username?: string | null
          last_refreshed_at?: string | null
          organization_id?: string | null
          page_access_token?: string | null
          page_id?: string | null
          page_name?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_access_token?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          instagram_user_id?: string | null
          instagram_username?: string | null
          last_refreshed_at?: string | null
          organization_id?: string | null
          page_access_token?: string | null
          page_id?: string | null
          page_name?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_access_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      klaviyo_campaigns: {
        Row: {
          ai_generated: boolean | null
          campaign_type: string
          clicked_count: number | null
          created_at: string | null
          error_message: string | null
          html_content: string | null
          id: string
          klaviyo_campaign_id: string | null
          klaviyo_template_id: string | null
          name: string
          offer_type: string | null
          offer_value: number | null
          opened_count: number | null
          organization_id: string | null
          preview_text: string | null
          revenue_attributed: number | null
          scheduled_at: string | null
          segment_type: string | null
          sent_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          campaign_type?: string
          clicked_count?: number | null
          created_at?: string | null
          error_message?: string | null
          html_content?: string | null
          id?: string
          klaviyo_campaign_id?: string | null
          klaviyo_template_id?: string | null
          name: string
          offer_type?: string | null
          offer_value?: number | null
          opened_count?: number | null
          organization_id?: string | null
          preview_text?: string | null
          revenue_attributed?: number | null
          scheduled_at?: string | null
          segment_type?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          campaign_type?: string
          clicked_count?: number | null
          created_at?: string | null
          error_message?: string | null
          html_content?: string | null
          id?: string
          klaviyo_campaign_id?: string | null
          klaviyo_template_id?: string | null
          name?: string
          offer_type?: string | null
          offer_value?: number | null
          opened_count?: number | null
          organization_id?: string | null
          preview_text?: string | null
          revenue_attributed?: number | null
          scheduled_at?: string | null
          segment_type?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "klaviyo_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          answer: string
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          organization_id: string | null
          question: string | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          organization_id?: string | null
          question?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          organization_id?: string | null
          question?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      lead_generators: {
        Row: {
          created_at: string | null
          description: string | null
          embed_code: string | null
          fields: Json
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          qr_code_url: string | null
          redirect_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          embed_code?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          qr_code_url?: string | null
          redirect_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          embed_code?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          qr_code_url?: string | null
          redirect_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_generators_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          source: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          source: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sources_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      media_analysis: {
        Row: {
          analyzed_at: string | null
          asset_id: string
          confidence: number | null
          created_at: string | null
          detected_actions: string[] | null
          detected_objects: string[] | null
          energy_level: string | null
          environment: string | null
          has_before_after: boolean | null
          has_install: boolean | null
          has_motion: boolean | null
          has_people: boolean | null
          has_reveal: boolean | null
          has_vehicle: boolean | null
          id: string
          motion_score: number | null
          text_detected: boolean | null
        }
        Insert: {
          analyzed_at?: string | null
          asset_id: string
          confidence?: number | null
          created_at?: string | null
          detected_actions?: string[] | null
          detected_objects?: string[] | null
          energy_level?: string | null
          environment?: string | null
          has_before_after?: boolean | null
          has_install?: boolean | null
          has_motion?: boolean | null
          has_people?: boolean | null
          has_reveal?: boolean | null
          has_vehicle?: boolean | null
          id?: string
          motion_score?: number | null
          text_detected?: boolean | null
        }
        Update: {
          analyzed_at?: string | null
          asset_id?: string
          confidence?: number | null
          created_at?: string | null
          detected_actions?: string[] | null
          detected_objects?: string[] | null
          energy_level?: string | null
          environment?: string | null
          has_before_after?: boolean | null
          has_install?: boolean | null
          has_motion?: boolean | null
          has_people?: boolean | null
          has_reveal?: boolean | null
          has_vehicle?: boolean | null
          id?: string
          motion_score?: number | null
          text_detected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "media_analysis_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "content_files"
            referencedColumns: ["id"]
          },
        ]
      }
      media_tags: {
        Row: {
          asset_id: string
          confidence: number | null
          created_at: string | null
          id: string
          locked: boolean | null
          source: string
          tag: string
        }
        Insert: {
          asset_id: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          locked?: boolean | null
          source?: string
          tag: string
        }
        Update: {
          asset_id?: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          locked?: boolean | null
          source?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_tags_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "content_files"
            referencedColumns: ["id"]
          },
        ]
      }
      message_ingest_log: {
        Row: {
          created_at: string | null
          id: string
          intent: string | null
          message_text: string | null
          organization_id: string | null
          platform: string
          processed: boolean | null
          raw_payload: Json | null
          sender_id: string | null
          sender_username: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intent?: string | null
          message_text?: string | null
          organization_id?: string | null
          platform: string
          processed?: boolean | null
          raw_payload?: Json | null
          sender_id?: string | null
          sender_username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intent?: string | null
          message_text?: string | null
          organization_id?: string | null
          platform?: string
          processed?: boolean | null
          raw_payload?: Json | null
          sender_id?: string | null
          sender_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_ingest_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel: string
          content: string
          conversation_id: string | null
          created_at: string | null
          direction: string
          id: string
          metadata: Json | null
          provider_message_id: string | null
          raw_payload: Json
          sender_email: string | null
          sender_name: string | null
          sender_phone: string | null
          sender_type: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          channel: string
          content: string
          conversation_id?: string | null
          created_at?: string | null
          direction: string
          id?: string
          metadata?: Json | null
          provider_message_id?: string | null
          raw_payload?: Json
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sender_type?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          channel?: string
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          metadata?: Json | null
          provider_message_id?: string | null
          raw_payload?: Json
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sender_type?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "instagram_leads_with_emails"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mightychat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ops_backlog_needs_response"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "website_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mighty_calendar_items: {
        Row: {
          assigned_agent: string | null
          calendar_id: string | null
          checklist: Json | null
          created_at: string | null
          description: string | null
          franchise_slug: string | null
          id: string
          is_legacy_import: boolean | null
          legacy_content_id: string | null
          organization_id: string | null
          requires_source: boolean | null
          scheduled_date: string
          source_item_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_agent?: string | null
          calendar_id?: string | null
          checklist?: Json | null
          created_at?: string | null
          description?: string | null
          franchise_slug?: string | null
          id?: string
          is_legacy_import?: boolean | null
          legacy_content_id?: string | null
          organization_id?: string | null
          requires_source?: boolean | null
          scheduled_date: string
          source_item_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_agent?: string | null
          calendar_id?: string | null
          checklist?: Json | null
          created_at?: string | null
          description?: string | null
          franchise_slug?: string | null
          id?: string
          is_legacy_import?: boolean | null
          legacy_content_id?: string | null
          organization_id?: string | null
          requires_source?: boolean | null
          scheduled_date?: string
          source_item_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mighty_calendar_items_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "mighty_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mighty_calendar_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mighty_calendar_items_source_item_id_fkey"
            columns: ["source_item_id"]
            isOneToOne: false
            referencedRelation: "mighty_calendar_items"
            referencedColumns: ["id"]
          },
        ]
      }
      mighty_calendars: {
        Row: {
          allowed_agents: string[]
          created_at: string | null
          description: string | null
          gradient_from: string | null
          gradient_to: string | null
          id: string
          is_source: boolean | null
          name: string
          organization_id: string | null
          owner_role: string
          role: string
          slug: string
        }
        Insert: {
          allowed_agents?: string[]
          created_at?: string | null
          description?: string | null
          gradient_from?: string | null
          gradient_to?: string | null
          id?: string
          is_source?: boolean | null
          name: string
          organization_id?: string | null
          owner_role: string
          role: string
          slug: string
        }
        Update: {
          allowed_agents?: string[]
          created_at?: string | null
          description?: string | null
          gradient_from?: string | null
          gradient_to?: string | null
          id?: string
          is_source?: boolean | null
          name?: string
          organization_id?: string | null
          owner_role?: string
          role?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "mighty_calendars_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      music_library: {
        Row: {
          bpm: number | null
          created_at: string
          duration_seconds: number | null
          energy: string | null
          file_url: string
          genre: string | null
          id: string
          is_global: boolean | null
          mood: string | null
          organization_id: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          bpm?: number | null
          created_at?: string
          duration_seconds?: number | null
          energy?: string | null
          file_url: string
          genre?: string | null
          id?: string
          is_global?: boolean | null
          mood?: string | null
          organization_id?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          bpm?: number | null
          created_at?: string
          duration_seconds?: number | null
          energy?: string | null
          file_url?: string
          genre?: string | null
          id?: string
          is_global?: boolean | null
          mood?: string | null
          organization_id?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_corrections: {
        Row: {
          corrected_by: string
          created_at: string | null
          customer: string | null
          description: string
          id: string
          notes: string | null
          organization_id: string | null
          target: string
        }
        Insert: {
          corrected_by: string
          created_at?: string | null
          customer?: string | null
          description: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          target: string
        }
        Update: {
          corrected_by?: string
          created_at?: string | null
          customer?: string | null
          description?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_corrections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_escalations: {
        Row: {
          created_at: string | null
          customer: string | null
          description: string
          escalated_by: string
          escalation_targets: string[]
          id: string
          notes: string | null
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer?: string | null
          description: string
          escalated_by: string
          escalation_targets: string[]
          id?: string
          notes?: string | null
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer?: string | null
          description?: string
          escalated_by?: string
          escalation_targets?: string[]
          id?: string
          notes?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_escalations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      orchestrator_insights: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          insight_text: string
          insight_type: string
          organization_id: string | null
          priority: string | null
          resolved: boolean | null
          resolved_at: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          insight_text: string
          insight_type: string
          organization_id?: string | null
          priority?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          insight_text?: string
          insight_type?: string
          organization_id?: string | null
          priority?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orchestrator_insights_organization_id_fkey"
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
      organization_product_settings: {
        Row: {
          created_at: string | null
          default_margin_percentage: number | null
          id: string
          organization_id: string
          show_wpw_wholesale: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_margin_percentage?: number | null
          id?: string
          organization_id: string
          show_wpw_wholesale?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_margin_percentage?: number | null
          id?: string
          organization_id?: string
          show_wpw_wholesale?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_product_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_style_profiles: {
        Row: {
          accent_color: string | null
          analysis_count: number | null
          body_position: string | null
          created_at: string | null
          cta_position: string | null
          font_body: string | null
          font_headline: string | null
          font_weight: string | null
          hook_position: string | null
          id: string
          last_analyzed_at: string | null
          organization_id: string
          outline_width: number | null
          primary_text_color: string | null
          reveal_style: string | null
          safe_zone_width: string | null
          secondary_text_color: string | null
          shadow_blur: number | null
          shadow_color: string | null
          source_images: Json | null
          style_name: string | null
          text_alignment: string | null
          text_animation: string | null
          text_case: string | null
          text_outline_enabled: boolean | null
          text_shadow_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          analysis_count?: number | null
          body_position?: string | null
          created_at?: string | null
          cta_position?: string | null
          font_body?: string | null
          font_headline?: string | null
          font_weight?: string | null
          hook_position?: string | null
          id?: string
          last_analyzed_at?: string | null
          organization_id: string
          outline_width?: number | null
          primary_text_color?: string | null
          reveal_style?: string | null
          safe_zone_width?: string | null
          secondary_text_color?: string | null
          shadow_blur?: number | null
          shadow_color?: string | null
          source_images?: Json | null
          style_name?: string | null
          text_alignment?: string | null
          text_animation?: string | null
          text_case?: string | null
          text_outline_enabled?: boolean | null
          text_shadow_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          analysis_count?: number | null
          body_position?: string | null
          created_at?: string | null
          cta_position?: string | null
          font_body?: string | null
          font_headline?: string | null
          font_weight?: string | null
          hook_position?: string | null
          id?: string
          last_analyzed_at?: string | null
          organization_id?: string
          outline_width?: number | null
          primary_text_color?: string | null
          reveal_style?: string | null
          safe_zone_width?: string | null
          secondary_text_color?: string | null
          shadow_blur?: number | null
          shadow_color?: string | null
          source_images?: Json | null
          style_name?: string | null
          text_alignment?: string | null
          text_animation?: string | null
          text_case?: string | null
          text_outline_enabled?: boolean | null
          text_shadow_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_style_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_tradedna: {
        Row: {
          business_category: string | null
          business_name: string | null
          created_at: string | null
          facebook_page: string | null
          id: string
          instagram_handle: string | null
          last_analyzed_at: string | null
          organization_id: string | null
          scraped_content: Json | null
          tagline: string | null
          tiktok_handle: string | null
          tradedna_profile: Json | null
          updated_at: string | null
          version: number | null
          website_url: string | null
          youtube_channel: string | null
        }
        Insert: {
          business_category?: string | null
          business_name?: string | null
          created_at?: string | null
          facebook_page?: string | null
          id?: string
          instagram_handle?: string | null
          last_analyzed_at?: string | null
          organization_id?: string | null
          scraped_content?: Json | null
          tagline?: string | null
          tiktok_handle?: string | null
          tradedna_profile?: Json | null
          updated_at?: string | null
          version?: number | null
          website_url?: string | null
          youtube_channel?: string | null
        }
        Update: {
          business_category?: string | null
          business_name?: string | null
          created_at?: string | null
          facebook_page?: string | null
          id?: string
          instagram_handle?: string | null
          last_analyzed_at?: string | null
          organization_id?: string | null
          scraped_content?: Json | null
          tagline?: string | null
          tiktok_handle?: string | null
          tradedna_profile?: Json | null
          updated_at?: string | null
          version?: number | null
          website_url?: string | null
          youtube_channel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_tradedna_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
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
          offers_installation: boolean | null
          owner_id: string | null
          role: Database["public"]["Enums"]["organization_role"] | null
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
          offers_installation?: boolean | null
          owner_id?: string | null
          role?: Database["public"]["Enums"]["organization_role"] | null
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
          offers_installation?: boolean | null
          owner_id?: string | null
          role?: Database["public"]["Enums"]["organization_role"] | null
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
      portfolio_jobs: {
        Row: {
          completion_date: string | null
          created_at: string | null
          customer_acknowledged_at: string | null
          customer_name: string | null
          customer_signature_path: string | null
          finish: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          job_price: number | null
          liability_pdf_path: string | null
          notes: string | null
          order_number: string | null
          organization_id: string | null
          service_type: string | null
          shopflow_order_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          upload_token: string | null
          user_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          vin_number: string | null
          vin_photo_path: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          customer_acknowledged_at?: string | null
          customer_name?: string | null
          customer_signature_path?: string | null
          finish?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          job_price?: number | null
          liability_pdf_path?: string | null
          notes?: string | null
          order_number?: string | null
          organization_id?: string | null
          service_type?: string | null
          shopflow_order_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          upload_token?: string | null
          user_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin_number?: string | null
          vin_photo_path?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          customer_acknowledged_at?: string | null
          customer_name?: string | null
          customer_signature_path?: string | null
          finish?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          job_price?: number | null
          liability_pdf_path?: string | null
          notes?: string | null
          order_number?: string | null
          organization_id?: string | null
          service_type?: string | null
          shopflow_order_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          upload_token?: string | null
          user_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin_number?: string | null
          vin_photo_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_jobs_shopflow_order_id_fkey"
            columns: ["shopflow_order_id"]
            isOneToOne: false
            referencedRelation: "shopflow_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_media: {
        Row: {
          caption: string | null
          condition_notes: string | null
          created_at: string | null
          display_order: number | null
          file_type: string | null
          id: string
          job_id: string
          location_on_vehicle: string | null
          media_type: string | null
          photo_timestamp: string | null
          storage_path: string
        }
        Insert: {
          caption?: string | null
          condition_notes?: string | null
          created_at?: string | null
          display_order?: number | null
          file_type?: string | null
          id?: string
          job_id: string
          location_on_vehicle?: string | null
          media_type?: string | null
          photo_timestamp?: string | null
          storage_path: string
        }
        Update: {
          caption?: string | null
          condition_notes?: string | null
          created_at?: string | null
          display_order?: number | null
          file_type?: string | null
          id?: string
          job_id?: string
          location_on_vehicle?: string | null
          media_type?: string | null
          photo_timestamp?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_media_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "portfolio_jobs"
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
          visibility: string | null
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
          visibility?: string | null
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
          visibility?: string | null
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
      quote_drafts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          confidence: number | null
          conversation_id: string | null
          created_at: string | null
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          material: string | null
          organization_id: string | null
          original_message: string | null
          price_per_sqft: number | null
          rejected_reason: string | null
          sent_at: string | null
          source: string | null
          source_agent: string
          sqft: number | null
          status: string | null
          total_price: number | null
          updated_at: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string | null
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          material?: string | null
          organization_id?: string | null
          original_message?: string | null
          price_per_sqft?: number | null
          rejected_reason?: string | null
          sent_at?: string | null
          source?: string | null
          source_agent: string
          sqft?: number | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          material?: string | null
          organization_id?: string | null
          original_message?: string | null
          price_per_sqft?: number | null
          rejected_reason?: string | null
          sent_at?: string | null
          source?: string | null
          source_agent?: string
          sqft?: number | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_drafts_organization_id_fkey"
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
      quote_retargeting_log: {
        Row: {
          created_at: string | null
          email_type: string
          id: string
          quote_id: string | null
          resend_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          id?: string
          quote_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          id?: string
          quote_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_retargeting_log_quote_id_fkey"
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
          ai_generated: boolean | null
          ai_generated_at: string | null
          ai_high_price: number | null
          ai_labor_hours: number | null
          ai_low_price: number | null
          ai_message: string | null
          ai_sqft_estimate: number | null
          ai_vehicle_class: string | null
          auto_retarget: boolean | null
          category: string | null
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
          dimensions: Json | null
          email_design: string | null
          email_sent: boolean | null
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
          source: string | null
          source_conversation_id: string | null
          source_message: string | null
          sqft: number | null
          status: string | null
          total_price: number
          updated_at: string
          utim_score: number | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          vehicle_details: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
          wc_sync_status: string | null
          wholesale_cost: number | null
          woo_order_id: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          ai_generated_at?: string | null
          ai_high_price?: number | null
          ai_labor_hours?: number | null
          ai_low_price?: number | null
          ai_message?: string | null
          ai_sqft_estimate?: number | null
          ai_vehicle_class?: string | null
          auto_retarget?: boolean | null
          category?: string | null
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
          dimensions?: Json | null
          email_design?: string | null
          email_sent?: boolean | null
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
          source?: string | null
          source_conversation_id?: string | null
          source_message?: string | null
          sqft?: number | null
          status?: string | null
          total_price: number
          updated_at?: string
          utim_score?: number | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicle_details?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          wc_sync_status?: string | null
          wholesale_cost?: number | null
          woo_order_id?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          ai_generated_at?: string | null
          ai_high_price?: number | null
          ai_labor_hours?: number | null
          ai_low_price?: number | null
          ai_message?: string | null
          ai_sqft_estimate?: number | null
          ai_vehicle_class?: string | null
          auto_retarget?: boolean | null
          category?: string | null
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
          dimensions?: Json | null
          email_design?: string | null
          email_sent?: boolean | null
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
          source?: string | null
          source_conversation_id?: string | null
          source_message?: string | null
          sqft?: number | null
          status?: string | null
          total_price?: number
          updated_at?: string
          utim_score?: number | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
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
      recovered_instagram_leads: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          extracted_email: string | null
          extracted_phone: string | null
          followed_up_at: string | null
          followed_up_by: string | null
          id: string
          ig_sender_name: string | null
          intent_keywords: string[] | null
          message_content: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          extracted_email?: string | null
          extracted_phone?: string | null
          followed_up_at?: string | null
          followed_up_by?: string | null
          id?: string
          ig_sender_name?: string | null
          intent_keywords?: string[] | null
          message_content?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          extracted_email?: string | null
          extracted_phone?: string | null
          followed_up_at?: string | null
          followed_up_by?: string | null
          id?: string
          ig_sender_name?: string | null
          intent_keywords?: string[] | null
          message_content?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recovered_instagram_leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovered_instagram_leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "instagram_leads_with_emails"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "recovered_instagram_leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mightychat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovered_instagram_leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ops_backlog_needs_response"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovered_instagram_leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "website_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_health_status: {
        Row: {
          campaign_status: string | null
          created_at: string
          days_since_email: number | null
          days_since_sms: number | null
          id: string
          klaviyo_meta_sync_active: boolean | null
          last_email_campaign_at: string | null
          last_signal_sync_at: string | null
          last_sms_campaign_at: string | null
          organization_id: string | null
          overall_status: string | null
          requires_action: boolean | null
          signal_freshness_score: number | null
          signal_status: string | null
          synced_segments: Json | null
          updated_at: string
        }
        Insert: {
          campaign_status?: string | null
          created_at?: string
          days_since_email?: number | null
          days_since_sms?: number | null
          id?: string
          klaviyo_meta_sync_active?: boolean | null
          last_email_campaign_at?: string | null
          last_signal_sync_at?: string | null
          last_sms_campaign_at?: string | null
          organization_id?: string | null
          overall_status?: string | null
          requires_action?: boolean | null
          signal_freshness_score?: number | null
          signal_status?: string | null
          synced_segments?: Json | null
          updated_at?: string
        }
        Update: {
          campaign_status?: string | null
          created_at?: string
          days_since_email?: number | null
          days_since_sms?: number | null
          id?: string
          klaviyo_meta_sync_active?: boolean | null
          last_email_campaign_at?: string | null
          last_signal_sync_at?: string | null
          last_sms_campaign_at?: string | null
          organization_id?: string | null
          overall_status?: string | null
          requires_action?: boolean | null
          signal_freshness_score?: number | null
          signal_status?: string | null
          synced_segments?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_health_status_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_views: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          filter_json: Json
          id: string
          is_system: boolean
          name: string
          organization_id: string | null
          sort_json: Json
          target_file_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_json?: Json
          id?: string
          is_system?: boolean
          name: string
          organization_id?: string | null
          sort_json?: Json
          target_file_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_json?: Json
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string | null
          sort_json?: Json
          target_file_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_text_overlays: {
        Row: {
          animation: string | null
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          end_time: number
          id: string
          job_id: string
          organization_id: string | null
          position: string
          scene_id: string
          start_time: number
          text: string
        }
        Insert: {
          animation?: string | null
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_time: number
          id?: string
          job_id: string
          organization_id?: string | null
          position?: string
          scene_id: string
          start_time: number
          text: string
        }
        Update: {
          animation?: string | null
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_time?: number
          id?: string
          job_id?: string
          organization_id?: string | null
          position?: string
          scene_id?: string
          start_time?: number
          text?: string
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
          order_source: string | null
          order_total: number | null
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
          order_total?: number | null
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
          order_total?: number | null
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
      signal_sync_log: {
        Row: {
          error_message: string | null
          id: string
          organization_id: string | null
          profiles_synced: number | null
          segments_synced: Json | null
          sync_status: string
          sync_type: string
          synced_at: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          organization_id?: string | null
          profiles_synced?: number | null
          segments_synced?: Json | null
          sync_status: string
          sync_type?: string
          synced_at?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          organization_id?: string | null
          profiles_synced?: number | null
          segments_synced?: Json | null
          sync_status?: string
          sync_type?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_sync_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      story_engagement_log: {
        Row: {
          contact_id: string | null
          conversation_id: string | null
          converted_to_quote: boolean | null
          created_at: string
          dm_received_at: string | null
          id: string
          intent_type: string | null
          message_text: string | null
          organization_id: string | null
          quote_id: string | null
          sender_id: string
          sender_username: string | null
          story_content: string | null
          story_id: string | null
          story_posted_at: string | null
        }
        Insert: {
          contact_id?: string | null
          conversation_id?: string | null
          converted_to_quote?: boolean | null
          created_at?: string
          dm_received_at?: string | null
          id?: string
          intent_type?: string | null
          message_text?: string | null
          organization_id?: string | null
          quote_id?: string | null
          sender_id: string
          sender_username?: string | null
          story_content?: string | null
          story_id?: string | null
          story_posted_at?: string | null
        }
        Update: {
          contact_id?: string | null
          conversation_id?: string | null
          converted_to_quote?: boolean | null
          created_at?: string
          dm_received_at?: string | null
          id?: string
          intent_type?: string | null
          message_text?: string | null
          organization_id?: string | null
          quote_id?: string | null
          sender_id?: string
          sender_username?: string | null
          story_content?: string | null
          story_id?: string | null
          story_posted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_engagement_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_engagement_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_engagement_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "instagram_leads_with_emails"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "story_engagement_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mightychat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_engagement_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ops_backlog_needs_response"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_engagement_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "website_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_issues: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          impact: string
          organization_id: string
          page_url: string | null
          related_task_id: string | null
          reported_by: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
          workaround: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          impact: string
          organization_id: string
          page_url?: string | null
          related_task_id?: string | null
          reported_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
          workaround?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          impact?: string
          organization_id?: string
          page_url?: string | null
          related_task_id?: string | null
          reported_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          workaround?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_issues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_issues_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "migrated_content_audit"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "system_issues_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_agent: string | null
          assigned_to: string | null
          channel: string | null
          completed_at: string | null
          contact_id: string | null
          content_calendar_id: string | null
          content_type: string | null
          conversation_id: string | null
          created_at: string | null
          created_by: string | null
          customer: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          order_id: string | null
          organization_id: string | null
          priority: string | null
          quote_id: string | null
          revenue_impact: string | null
          status: string | null
          task_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_agent?: string | null
          assigned_to?: string | null
          channel?: string | null
          completed_at?: string | null
          contact_id?: string | null
          content_calendar_id?: string | null
          content_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          organization_id?: string | null
          priority?: string | null
          quote_id?: string | null
          revenue_impact?: string | null
          status?: string | null
          task_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_agent?: string | null
          assigned_to?: string | null
          channel?: string | null
          completed_at?: string | null
          contact_id?: string | null
          content_calendar_id?: string | null
          content_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          organization_id?: string | null
          priority?: string | null
          quote_id?: string | null
          revenue_impact?: string | null
          status?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_content_calendar_id_fkey"
            columns: ["content_calendar_id"]
            isOneToOne: false
            referencedRelation: "content_calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_content_calendar_id_fkey"
            columns: ["content_calendar_id"]
            isOneToOne: false
            referencedRelation: "migrated_content_audit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "instagram_leads_with_emails"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mightychat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ops_backlog_needs_response"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "website_chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopflow_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      team_commands: {
        Row: {
          command_payload: Json | null
          command_text: string | null
          command_type: string
          conversation_id: string | null
          created_at: string | null
          executed_at: string | null
          from_user_id: string | null
          id: string
          quote_id: string | null
          status: string | null
          to_agent: string
        }
        Insert: {
          command_payload?: Json | null
          command_text?: string | null
          command_type: string
          conversation_id?: string | null
          created_at?: string | null
          executed_at?: string | null
          from_user_id?: string | null
          id?: string
          quote_id?: string | null
          status?: string | null
          to_agent: string
        }
        Update: {
          command_payload?: Json | null
          command_text?: string | null
          command_type?: string
          conversation_id?: string | null
          created_at?: string | null
          executed_at?: string | null
          from_user_id?: string | null
          id?: string
          quote_id?: string | null
          status?: string | null
          to_agent?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_commands_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_commands_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "instagram_leads_with_emails"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "team_commands_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mightychat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_commands_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ops_backlog_needs_response"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_commands_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "website_chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_commands_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
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
      vehicle_dimensions: {
        Row: {
          back_height: number | null
          back_sqft: number | null
          back_width: number | null
          corrected_sqft: number
          hood_length: number | null
          hood_sqft: number | null
          hood_width: number | null
          id: string
          inserted_at: string | null
          make: string
          model: string
          roof_length: number | null
          roof_sqft: number | null
          roof_width: number | null
          side_height: number | null
          side_sqft: number | null
          side_width: number | null
          total_sqft: number | null
          year_end: number
          year_start: number
        }
        Insert: {
          back_height?: number | null
          back_sqft?: number | null
          back_width?: number | null
          corrected_sqft: number
          hood_length?: number | null
          hood_sqft?: number | null
          hood_width?: number | null
          id?: string
          inserted_at?: string | null
          make: string
          model: string
          roof_length?: number | null
          roof_sqft?: number | null
          roof_width?: number | null
          side_height?: number | null
          side_sqft?: number | null
          side_width?: number | null
          total_sqft?: number | null
          year_end: number
          year_start: number
        }
        Update: {
          back_height?: number | null
          back_sqft?: number | null
          back_width?: number | null
          corrected_sqft?: number
          hood_length?: number | null
          hood_sqft?: number | null
          hood_width?: number | null
          id?: string
          inserted_at?: string | null
          make?: string
          model?: string
          roof_length?: number | null
          roof_sqft?: number | null
          roof_width?: number | null
          side_height?: number | null
          side_sqft?: number | null
          side_width?: number | null
          total_sqft?: number | null
          year_end?: number
          year_start?: number
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
      video_edit_queue: {
        Row: {
          ai_creative_id: string | null
          ai_edit_suggestions: Json
          chapters: Json | null
          content_file_id: string | null
          created_at: string
          debug_payload: Json | null
          download_url: string | null
          duration_seconds: number | null
          error_message: string | null
          final_render_url: string | null
          finalized_at: string | null
          id: string
          organization_id: string | null
          producer_blueprint: Json | null
          producer_locked: boolean
          render_status: string | null
          selected_music_id: string | null
          selected_music_url: string | null
          shorts_extracted: Json | null
          source_url: string
          speed_ramps: Json | null
          status: string | null
          storage_path: string | null
          text_overlays: Json | null
          title: string | null
          transcript: string | null
          updated_at: string
        }
        Insert: {
          ai_creative_id?: string | null
          ai_edit_suggestions?: Json
          chapters?: Json | null
          content_file_id?: string | null
          created_at?: string
          debug_payload?: Json | null
          download_url?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          final_render_url?: string | null
          finalized_at?: string | null
          id?: string
          organization_id?: string | null
          producer_blueprint?: Json | null
          producer_locked?: boolean
          render_status?: string | null
          selected_music_id?: string | null
          selected_music_url?: string | null
          shorts_extracted?: Json | null
          source_url: string
          speed_ramps?: Json | null
          status?: string | null
          storage_path?: string | null
          text_overlays?: Json | null
          title?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          ai_creative_id?: string | null
          ai_edit_suggestions?: Json
          chapters?: Json | null
          content_file_id?: string | null
          created_at?: string
          debug_payload?: Json | null
          download_url?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          final_render_url?: string | null
          finalized_at?: string | null
          id?: string
          organization_id?: string | null
          producer_blueprint?: Json | null
          producer_locked?: boolean
          render_status?: string | null
          selected_music_id?: string | null
          selected_music_url?: string | null
          shorts_extracted?: Json | null
          source_url?: string
          speed_ramps?: Json | null
          status?: string | null
          storage_path?: string | null
          text_overlays?: Json | null
          title?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_edit_queue_ai_creative_id_fkey"
            columns: ["ai_creative_id"]
            isOneToOne: false
            referencedRelation: "ai_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_edit_queue_content_file_id_fkey"
            columns: ["content_file_id"]
            isOneToOne: false
            referencedRelation: "content_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_edit_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      winback_sequences: {
        Row: {
          conversion_rate: number | null
          created_at: string | null
          emails_in_sequence: number | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          organization_id: string | null
          sequence_name: string
          total_revenue: number | null
          trigger_days_inactive: number
          updated_at: string | null
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string | null
          emails_in_sequence?: number | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          organization_id?: string | null
          sequence_name: string
          total_revenue?: number | null
          trigger_days_inactive?: number
          updated_at?: string | null
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string | null
          emails_in_sequence?: number | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          organization_id?: string | null
          sequence_name?: string
          total_revenue?: number | null
          trigger_days_inactive?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "winback_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_ai_memory: {
        Row: {
          ai_state: Json | null
          contact_id: string | null
          created_at: string | null
          id: string
          last_budget: string | null
          last_design_preview_urls: Json | null
          last_design_style: string | null
          last_intent: string | null
          last_message_at: string | null
          last_order_lookup: string | null
          last_vehicle: Json | null
          last_wrap_type: string | null
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_state?: Json | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_budget?: string | null
          last_design_preview_urls?: Json | null
          last_design_style?: string | null
          last_intent?: string | null
          last_message_at?: string | null
          last_order_lookup?: string | null
          last_vehicle?: Json | null
          last_wrap_type?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_state?: Json | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_budget?: string | null
          last_design_preview_urls?: Json | null
          last_design_style?: string | null
          last_intent?: string | null
          last_message_at?: string | null
          last_order_lookup?: string | null
          last_vehicle?: Json | null
          last_wrap_type?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_ai_memory_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_ai_memory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wpw_knowledge_base: {
        Row: {
          applies_to_agents: string[] | null
          approved_at: string | null
          approved_by: string | null
          category: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          organization_id: string | null
          priority: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          applies_to_agents?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          organization_id?: string | null
          priority?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          applies_to_agents?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          organization_id?: string | null
          priority?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wpw_knowledge_base_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      youtube_editor_jobs: {
        Row: {
          analysis_data: Json | null
          created_at: string | null
          duration_seconds: number | null
          enhancement_data: Json | null
          generated_shorts: Json | null
          id: string
          mux_asset_id: string | null
          mux_playback_id: string | null
          organization_id: string | null
          processing_status: string | null
          seo_data: Json | null
          source_file_url: string
          thumbnail_data: Json | null
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          enhancement_data?: Json | null
          generated_shorts?: Json | null
          id?: string
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          organization_id?: string | null
          processing_status?: string | null
          seo_data?: Json | null
          source_file_url: string
          thumbnail_data?: Json | null
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          enhancement_data?: Json | null
          generated_shorts?: Json | null
          id?: string
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          organization_id?: string | null
          processing_status?: string | null
          seo_data?: Json | null
          source_file_url?: string
          thumbnail_data?: Json | null
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "youtube_editor_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      instagram_leads_with_emails: {
        Row: {
          conversation_id: string | null
          direction: string | null
          extracted_email: string | null
          ig_sender_name: string | null
          message_content: string | null
          message_date: string | null
        }
        Relationships: []
      }
      mightychat_conversations: {
        Row: {
          ai_paused: boolean | null
          approval_required: boolean | null
          assigned_to: string | null
          autopilot_allowed: boolean | null
          channel: string | null
          chat_state: Json | null
          contact_id: string | null
          created_at: string | null
          id: string | null
          last_message_at: string | null
          metadata: Json | null
          organization_id: string | null
          priority: string | null
          recipient_inbox: string | null
          review_status: string | null
          status: string | null
          subject: string | null
          unread_count: number | null
        }
        Insert: {
          ai_paused?: boolean | null
          approval_required?: boolean | null
          assigned_to?: string | null
          autopilot_allowed?: boolean | null
          channel?: string | null
          chat_state?: Json | null
          contact_id?: string | null
          created_at?: string | null
          id?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          recipient_inbox?: string | null
          review_status?: string | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
        }
        Update: {
          ai_paused?: boolean | null
          approval_required?: boolean | null
          assigned_to?: string | null
          autopilot_allowed?: boolean | null
          channel?: string | null
          chat_state?: Json | null
          contact_id?: string | null
          created_at?: string | null
          id?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          recipient_inbox?: string | null
          review_status?: string | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      migrated_content_audit: {
        Row: {
          assigned_agent: string | null
          brand: string | null
          id: string | null
          in_progress_at: string | null
          migrated: boolean | null
          posted_at: string | null
          ready_at: string | null
          status: string | null
          task_id: string | null
          task_status: string | null
          task_title: string | null
          title: string | null
        }
        Relationships: []
      }
      ops_backlog_needs_response: {
        Row: {
          channel: string | null
          id: string | null
          last_inbound_at: string | null
          last_outbound_at: string | null
          needs_response: boolean | null
          subject: string | null
        }
        Relationships: []
      }
      website_chat_conversations: {
        Row: {
          ai_paused: boolean | null
          approval_required: boolean | null
          assigned_to: string | null
          autopilot_allowed: boolean | null
          channel: string | null
          chat_state: Json | null
          contact_id: string | null
          created_at: string | null
          id: string | null
          last_message_at: string | null
          metadata: Json | null
          organization_id: string | null
          priority: string | null
          recipient_inbox: string | null
          review_status: string | null
          status: string | null
          subject: string | null
          unread_count: number | null
        }
        Insert: {
          ai_paused?: boolean | null
          approval_required?: boolean | null
          assigned_to?: string | null
          autopilot_allowed?: boolean | null
          channel?: string | null
          chat_state?: Json | null
          contact_id?: string | null
          created_at?: string | null
          id?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          recipient_inbox?: string | null
          review_status?: string | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
        }
        Update: {
          ai_paused?: boolean | null
          approval_required?: boolean | null
          assigned_to?: string | null
          autopilot_allowed?: boolean | null
          channel?: string | null
          chat_state?: Json | null
          contact_id?: string | null
          created_at?: string | null
          id?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          recipient_inbox?: string | null
          review_status?: string | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_content_tag: {
        Args: { file_id: string; tag: string }
        Returns: undefined
      }
      get_quote_stats: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      get_user_organization_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member_of_organization: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_organization_owner: { Args: { _org_id: string }; Returns: boolean }
      remove_content_tag: {
        Args: { file_id: string; tag: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "orchestrator"
      organization_role: "beta_shop" | "affiliate" | "admin"
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
      app_role: ["admin", "moderator", "user", "orchestrator"],
      organization_role: ["beta_shop", "affiliate", "admin"],
    },
  },
} as const
