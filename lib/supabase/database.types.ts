export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      economic_events: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          event_type: string
          id: number
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          description?: string | null
          event_type: string
          id?: number
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          event_type?: string
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "economic_events_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          active_flask: string | null
          active_flask_expires_at: string | null
          base_raw_nilk_generation_rate: number | null
          cow_inventory: Json | null
          flask_inventory: string[] | null
          has_alien_farmer_boost: boolean | null
          has_flask_blueprint: boolean | null
          has_moofi_badge: boolean | null
          hype_balance: number | null
          id: string
          is_profile_complete: boolean | null
          last_active_timestamp: string | null
          nilk_balance: number | null
          owned_machines: Json | null
          raw_nilk_balance: number | null
          raw_nilk_generation_rate: number | null
          updated_at: string | null
          username: string | null
          wallet_address: string | null
          x_handle: string | null
          yield_booster_level: number | null
        }
        Insert: {
          active_flask?: string | null
          active_flask_expires_at?: string | null
          base_raw_nilk_generation_rate?: number | null
          cow_inventory?: Json | null
          flask_inventory?: string[] | null
          has_alien_farmer_boost?: boolean | null
          has_flask_blueprint?: boolean | null
          has_moofi_badge?: boolean | null
          hype_balance?: number | null
          id: string
          is_profile_complete?: boolean | null
          last_active_timestamp?: string | null
          nilk_balance?: number | null
          owned_machines?: Json | null
          raw_nilk_balance?: number | null
          raw_nilk_generation_rate?: number | null
          updated_at?: string | null
          username?: string | null
          wallet_address?: string | null
          x_handle?: string | null
          yield_booster_level?: number | null
        }
        Update: {
          active_flask?: string | null
          active_flask_expires_at?: string | null
          base_raw_nilk_generation_rate?: number | null
          cow_inventory?: Json | null
          flask_inventory?: string[] | null
          has_alien_farmer_boost?: boolean | null
          has_flask_blueprint?: boolean | null
          has_moofi_badge?: boolean | null
          hype_balance?: number | null
          id?: string
          is_profile_complete?: boolean | null
          last_active_timestamp?: string | null
          nilk_balance?: number | null
          owned_machines?: Json | null
          raw_nilk_balance?: number | null
          raw_nilk_generation_rate?: number | null
          updated_at?: string | null
          username?: string | null
          wallet_address?: string | null
          x_handle?: string | null
          yield_booster_level?: number | null
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          fusions: number
          hype_earned: number
          nilk_balance: number
          raw_nilk_processed: number
          user_id: string
        }
        Insert: {
          fusions?: number
          hype_earned?: number
          nilk_balance?: number
          raw_nilk_processed?: number
          user_id: string
        }
        Update: {
          fusions?: number
          hype_earned?: number
          nilk_balance?: number
          raw_nilk_processed?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      craft_and_log_item: {
        Args: {
          p_user_id: string
          p_nilk_cost: number
          p_raw_nilk_cost: number
          p_item_to_add: string
          p_description: string
        }
        Returns: undefined
      }
      earn_hype_and_log: {
        Args: {
          p_user_id: string
          p_amount: number
          p_description: string
        }
        Returns: undefined
      }
      fuse_and_log: {
        Args: {
          p_user_id: string
          p_nilk_to_burn: number
          p_description: string
        }
        Returns: undefined
      }
      get_economic_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          rank: number
          username: string
          raw_nilk_processed: number
          fusions: number
          hype_earned: number
        }[]
      }
      process_and_log_nilk: {
        Args: {
          p_user_id: string
          p_raw_nilk_to_spend: number
          p_nilk_to_mint: number
          p_description: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
