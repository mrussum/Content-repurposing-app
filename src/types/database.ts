// Hand-authored from schema. Run `pnpm supabase:types` to regenerate once
// local Supabase is running.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:                     string
          email:                  string
          full_name:              string | null
          avatar_url:             string | null
          plan:                   'free' | 'pro' | 'agency'
          stripe_customer_id:     string | null
          stripe_subscription_id: string | null
          generations_used:       number
          generations_reset_at:   string
          has_onboarded:          boolean
          buffer_access_token:    string | null
          created_at:             string
          updated_at:             string
        }
        Insert: {
          id:                     string
          email:                  string
          full_name?:             string | null
          avatar_url?:            string | null
          plan?:                  'free' | 'pro' | 'agency'
          stripe_customer_id?:    string | null
          stripe_subscription_id?:string | null
          generations_used?:      number
          generations_reset_at?:  string
          has_onboarded?:         boolean
          buffer_access_token?:   string | null
          created_at?:            string
          updated_at?:            string
        }
        Update: {
          id?:                    string
          email?:                 string
          full_name?:             string | null
          avatar_url?:            string | null
          plan?:                  'free' | 'pro' | 'agency'
          stripe_customer_id?:    string | null
          stripe_subscription_id?:string | null
          generations_used?:      number
          generations_reset_at?:  string
          has_onboarded?:         boolean
          buffer_access_token?:   string | null
          created_at?:            string
          updated_at?:            string
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
    }
    Enums:          Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile       = Database['public']['Tables']['profiles']['Row']
export type GenerationRow = Database['public']['Tables']['generations']['Row']
export type BrandVoiceRow = Database['public']['Tables']['brand_voices']['Row']
export type PublishedPost = Database['public']['Tables']['published_posts']['Row']
