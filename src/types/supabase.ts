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
      categories: {
        Row: {
          id: number
          name: string
          color: string
          icon: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: number
          name: string
          color: string
          icon: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: number
          name?: string
          color?: string
          icon?: string
          created_at?: string
          user_id?: string
        }
      }
      transactions: {
        Row: {
          id: number
          amount: number
          date: string
          description: string
          category_id: number
          type: 'income' | 'expense'
          created_at: string
          user_id: string
        }
        Insert: {
          id?: number
          amount: number
          date: string
          description: string
          category_id: number
          type: 'income' | 'expense'
          created_at?: string
          user_id: string
        }
        Update: {
          id?: number
          amount?: number
          date?: string
          description?: string
          category_id?: number
          type?: 'income' | 'expense'
          created_at?: string
          user_id?: string
        }
      }
      budgets: {
        Row: {
          id: number
          amount: number
          month: string
          category_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          amount: number
          month: string
          category_id: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: number
          amount?: number
          month?: string
          category_id?: number
          user_id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}