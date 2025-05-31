import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pmegrknwfnntlosiwfcp.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZWdya253Zm5udGxvc2l3ZmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MDY0NjcsImV4cCI6MjA2NDE4MjQ2N30.siXPlVkWfNpK64jyKHvrAOmNpCeLWRMgdHVn9s6e6tQ'

// Check if we're in placeholder mode
const isPlaceholderMode = supabaseUrl === 'https://placeholder.supabase.co' || !process.env.NEXT_PUBLIC_SUPABASE_URL

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Client component Supabase client
export const createSupabaseClient = () => {
  if (isPlaceholderMode) {
    // Return the basic client for placeholder mode
    return supabase
  }
  return createClientComponentClient<Database>()
}

// Database types generated from Supabase
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
      ai_prompt_logs: {
        Row: {
          created_at: string | null
          generated_content: string
          id: string
          input_data: Json
          model_used: string
          prompt_type: string
          tokens_used: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          generated_content: string
          id?: string
          input_data?: Json
          model_used: string
          prompt_type: string
          tokens_used: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          generated_content?: string
          id?: string
          input_data?: Json
          model_used?: string
          prompt_type?: string
          tokens_used?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          company_name: string
          company_size: string | null
          created_at: string | null
          description: string | null
          id: string
          industry: string
          location: string | null
          logo_url: string | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          company_name: string
          company_size?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry: string
          location?: string | null
          logo_url?: string | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          company_name?: string
          company_size?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string
          location?: string | null
          logo_url?: string | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          applications_count: number | null
          brand_id: string
          budget_max: number
          budget_min: number
          created_at: string | null
          deliverables: string[] | null
          description: string
          id: string
          objective: string
          requirements: Json
          selected_creators: string[] | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          target_audience: Json
          timeline_end: string
          timeline_start: string
          title: string
          updated_at: string | null
        }
        Insert: {
          applications_count?: number | null
          brand_id: string
          budget_max: number
          budget_min: number
          created_at?: string | null
          deliverables?: string[] | null
          description: string
          id?: string
          objective: string
          requirements?: Json
          selected_creators?: string[] | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          target_audience?: Json
          timeline_end: string
          timeline_start: string
          title: string
          updated_at?: string | null
        }
        Update: {
          applications_count?: number | null
          brand_id?: string
          budget_max?: number
          budget_min?: number
          created_at?: string | null
          deliverables?: string[] | null
          description?: string
          id?: string
          objective?: string
          requirements?: Json
          selected_creators?: string[] | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          target_audience?: Json
          timeline_end?: string
          timeline_start?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      // ... other tables would be here but truncated for brevity
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      application_status: "pending" | "accepted" | "rejected" | "withdrawn"
      campaign_status: "draft" | "active" | "paused" | "completed" | "cancelled"
      collaboration_status:
        | "negotiating"
        | "active"
        | "content_submitted"
        | "revision_requested"
        | "completed"
        | "cancelled"
      message_type: "text" | "voice" | "file" | "system"
      milestone_status: "pending" | "submitted" | "approved" | "paid"
      notification_type:
        | "campaign"
        | "collaboration"
        | "payment"
        | "message"
        | "system"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      upload_purpose:
        | "contract"
        | "deliverable"
        | "portfolio"
        | "avatar"
        | "logo"
        | "other"
      user_type: "brand" | "creator" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 