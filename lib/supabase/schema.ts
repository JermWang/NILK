import { Cow, Machine, CowTier } from "@/app/store/useGameStore";

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
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      user_balances: {
        Row: {
          user_id: string
          nilk_balance: number
          raw_nilk_balance: number
        }
        Insert: {
          user_id: string
          nilk_balance?: number
          raw_nilk_balance?: number
        }
        Update: {
          user_id?: string
          nilk_balance?: number
          raw_nilk_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_balances_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      user_cows: {
        Row: {
          id: string
          user_id: string
          tier: CowTier
          level: number
          last_harvest_time: string
        }
        Insert: {
          id?: string
          user_id: string
          tier: CowTier
          level?: number
          last_harvest_time?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: CowTier
          level?: number
          last_harvest_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cows_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      user_machines: {
        Row: {
          user_id: string
          standard_machines: number
          pro_machines: number
        }
        Insert: {
          user_id: string
          standard_machines?: number
          pro_machines?: number
        }
        Update: {
          user_id?: string
          standard_machines?: number
          pro_machines?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_machines_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      user_upgrades: {
        Row: {
          user_id: string
          yield_booster_level: number
          has_moofi_badge: boolean
          has_alien_farmer_boost: boolean
        }
        Insert: {
          user_id: string
          yield_booster_level?: number
          has_moofi_badge?: boolean
          has_alien_farmer_boost?: boolean
        }
        Update: {
          user_id?: string
          yield_booster_level?: number
          has_moofi_badge?: boolean
          has_alien_farmer_boost?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_upgrades_user_id_fkey"
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