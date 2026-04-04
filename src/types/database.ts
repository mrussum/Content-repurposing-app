// Hand-authored from schema. Run `pnpm supabase:types` to regenerate once
// local Supabase is running.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:                       string
          email:                    string
          full_name:                string | null
          avatar_url:               string | null
          plan:                     'free' | 'pro' | 'agency'
          stripe_customer_id:       string | null
          stripe_subscription_id:   string | null
          generations_used:         number
          generations_reset_at:     string
          has_onboarded:            boolean
          buffer_access_token:      string | null
          twitter_access_token:     string | null
          twitter_refresh_token:    string | null
          twitter_token_expires_at: string | null
          linkedin_access_token:    string | null
          linkedin_token_expires_at:string | null
          notion_access_token:      string | null
          notion_workspace_id:      string | null
          created_at:               string
          updated_at:               string
        }
        Insert: {
          id:                       string
          email:                    string
          full_name?:               string | null
          avatar_url?:              string | null
          plan?:                    'free' | 'pro' | 'agency'
          stripe_customer_id?:      string | null
          stripe_subscription_id?:  string | null
          generations_used?:        number
          generations_reset_at?:    string
          has_onboarded?:           boolean
          buffer_access_token?:     string | null
          twitter_access_token?:    string | null
          twitter_refresh_token?:   string | null
          twitter_token_expires_at?:string | null
          linkedin_access_token?:   string | null
          linkedin_token_expires_at?:string | null
          notion_access_token?:     string | null
          notion_workspace_id?:     string | null
          created_at?:              string
          updated_at?:              string
        }
        Update: {
          id?:                       string
          email?:                    string
          full_name?:                string | null
          avatar_url?:               string | null
          plan?:                     'free' | 'pro' | 'agency'
          stripe_customer_id?:       string | null
          stripe_subscription_id?:   string | null
          generations_used?:         number
          generations_reset_at?:     string
          has_onboarded?:            boolean
          buffer_access_token?:      string | null
          twitter_access_token?:     string | null
          twitter_refresh_token?:    string | null
          twitter_token_expires_at?: string | null
          linkedin_access_token?:    string | null
          linkedin_token_expires_at?:string | null
          notion_access_token?:      string | null
          notion_workspace_id?:      string | null
          created_at?:               string
          updated_at?:               string
        }
        Relationships: []
      }
      generations: {
        Row: {
          id:             string
          user_id:        string
          content_input:  string
          result:         Record<string, unknown>
          tone:           string
          audience:       string
          brand_voice_id: string | null
          template_id:    string | null
          word_count:     number | null
          created_at:     string
        }
        Insert: {
          id?:            string
          user_id:        string
          content_input:  string
          result:         Record<string, unknown>
          tone:           string
          audience:       string
          brand_voice_id?:string | null
          template_id?:   string | null
          word_count?:    number | null
          created_at?:    string
        }
        Update: {
          id?:            string
          user_id?:       string
          content_input?: string
          result?:        Record<string, unknown>
          tone?:          string
          audience?:      string
          brand_voice_id?:string | null
          template_id?:   string | null
          word_count?:    number | null
          created_at?:    string
        }
        Relationships: []
      }
      brand_voices: {
        Row: {
          id:         string
          user_id:    string
          name:       string
          samples:    string[]
          summary:    string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?:        string
          user_id:    string
          name?:      string
          samples:    string[]
          summary?:   string | null
          created_at?:string
          updated_at?:string
        }
        Update: {
          id?:        string
          user_id?:   string
          name?:      string
          samples?:   string[]
          summary?:   string | null
          created_at?:string
          updated_at?:string
        }
        Relationships: []
      }
      published_posts: {
        Row: {
          id:             string
          user_id:        string
          generation_id:  string | null
          platform:       string
          content:        string
          buffer_post_id: string | null
          status:         'draft' | 'scheduled' | 'published' | 'failed'
          scheduled_at:   string | null
          published_at:   string | null
          created_at:     string
        }
        Insert: {
          id?:            string
          user_id:        string
          generation_id?: string | null
          platform:       string
          content:        string
          buffer_post_id?:string | null
          status?:        'draft' | 'scheduled' | 'published' | 'failed'
          scheduled_at?:  string | null
          published_at?:  string | null
          created_at?:    string
        }
        Update: {
          id?:            string
          user_id?:       string
          generation_id?: string | null
          platform?:      string
          content?:       string
          buffer_post_id?:string | null
          status?:        'draft' | 'scheduled' | 'published' | 'failed'
          scheduled_at?:  string | null
          published_at?:  string | null
          created_at?:    string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          id:           string
          user_id:      string
          name:         string
          key_hash:     string
          key_prefix:   string
          last_used_at: string | null
          created_at:   string
        }
        Insert: {
          id?:          string
          user_id:      string
          name:         string
          key_hash:     string
          key_prefix:   string
          last_used_at?:string | null
          created_at?:  string
        }
        Update: {
          id?:          string
          user_id?:     string
          name?:        string
          key_hash?:    string
          key_prefix?:  string
          last_used_at?:string | null
          created_at?:  string
        }
        Relationships: []
      }
      templates: {
        Row: {
          id:                 string
          user_id:            string | null
          name:               string
          description:        string
          system_prompt_addon:string
          is_public:          boolean
          use_count:          number
          created_at:         string
          updated_at:         string
        }
        Insert: {
          id?:                string
          user_id?:           string | null
          name:               string
          description?:       string
          system_prompt_addon?:string
          is_public?:         boolean
          use_count?:         number
          created_at?:        string
          updated_at?:        string
        }
        Update: {
          id?:                string
          user_id?:           string | null
          name?:              string
          description?:       string
          system_prompt_addon?:string
          is_public?:         boolean
          use_count?:         number
          created_at?:        string
          updated_at?:        string
        }
        Relationships: []
      }
    }
    Views:          Record<string, never>
    Functions: {
      update_generation_format: {
        Args: {
          p_generation_id: string
          p_format_key:    string
          p_new_value:     string
        }
        Returns: undefined
      }
      increment_template_use_count: {
        Args: { p_template_id: string }
        Returns: undefined
      }
    }
    Enums:          Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile       = Database['public']['Tables']['profiles']['Row']
export type GenerationRow = Database['public']['Tables']['generations']['Row']
export type BrandVoiceRow = Database['public']['Tables']['brand_voices']['Row']
export type PublishedPost = Database['public']['Tables']['published_posts']['Row']
export type ApiKey        = Database['public']['Tables']['api_keys']['Row']
export type Template      = Database['public']['Tables']['templates']['Row']
