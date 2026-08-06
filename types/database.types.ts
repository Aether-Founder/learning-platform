/**
 * Database Types for Supabase
 * 
 * These types are derived from the database schema and provide
 * full type safety when working with Supabase queries.
 * 
 * To regenerate these types from your Supabase schema:
 * npx supabase gen types typescript --project-id zbppznuwwcjdbdbkexyq > types/database.types.ts
 */

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
      users: {
        Row: {
          id: string
          username: string
          full_name: string | null
          grade_level: string | null
          track: string | null
          grade_confirmed_year: string | null
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          grade_level?: string | null
          track?: string | null
          grade_confirmed_year?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          grade_level?: string | null
          track?: string | null
          grade_confirmed_year?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_weeks: {
        Row: {
          id: string
          user_id: string
          name: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_week_subjects: {
        Row: {
          id: string
          test_week_id: string
          subject_id: string
          subject_name: string
          created_at: string
        }
        Insert: {
          id?: string
          test_week_id: string
          subject_id: string
          subject_name: string
          created_at?: string
        }
        Update: {
          id?: string
          test_week_id?: string
          subject_id?: string
          subject_name?: string
          created_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          level: string | null
          color: string | null
          icon: string | null
          mastery: number
          topics: number
          topics_done: number
          due_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          level?: string | null
          color?: string | null
          icon?: string | null
          mastery?: number
          topics?: number
          topics_done?: number
          due_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          level?: string | null
          color?: string | null
          icon?: string | null
          mastery?: number
          topics?: number
          topics_done?: number
          due_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subjects_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      study_sets: {
        Row: {
          id: string
          user_id: string
          subject_id: string | null
          title: string
          description: string | null
          slug: string
          content_json: Json
          is_public: boolean
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id?: string | null
          title: string
          description?: string | null
          slug: string
          content_json?: Json
          is_public?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string | null
          title?: string
          description?: string | null
          slug?: string
          content_json?: Json
          is_public?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'study_sets_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'study_sets_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      flashcards: {
        Row: {
          id: string
          study_set_id: string
          question: string
          answer: string
          number: string
          difficulty: 'easy' | 'medium' | 'hard' | null
          order_index: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          study_set_id: string
          question: string
          answer: string
          number: string
          difficulty?: 'easy' | 'medium' | 'hard' | null
          order_index?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          study_set_id?: string
          question?: string
          answer?: string
          number?: string
          difficulty?: 'easy' | 'medium' | 'hard' | null
          order_index?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flashcards_study_set_id_fkey'
            columns: ['study_set_id']
            isOneToOne: false
            referencedRelation: 'study_sets'
            referencedColumns: ['id']
          },
        ]
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          study_set_id: string | null
          subject_id: string | null
          started_at: string
          ended_at: string | null
          duration_minutes: number | null
          cards_studied: number
          cards_correct: number
          cards_incorrect: number
          session_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          study_set_id?: string | null
          subject_id?: string | null
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number | null
          cards_studied?: number
          cards_correct?: number
          cards_incorrect?: number
          session_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          study_set_id?: string | null
          subject_id?: string | null
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number | null
          cards_studied?: number
          cards_correct?: number
          cards_incorrect?: number
          session_data?: Json
          created_at?: string
        }
        Relationships: []
      }
      card_reviews: {
        Row: {
          id: string
          user_id: string
          flashcard_id: string
          session_id: string | null
          was_correct: boolean
          time_spent_seconds: number | null
          confidence_level: number | null
          reviewed_at: string
          next_review_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          flashcard_id: string
          session_id?: string | null
          was_correct: boolean
          time_spent_seconds?: number | null
          confidence_level?: number | null
          reviewed_at?: string
          next_review_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          flashcard_id?: string
          session_id?: string | null
          was_correct?: boolean
          time_spent_seconds?: number | null
          confidence_level?: number | null
          reviewed_at?: string
          next_review_date?: string | null
        }
        Relationships: []
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          title: string
          description: string | null
          icon: string | null
          metadata: Json
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          title: string
          description?: string | null
          icon?: string | null
          metadata?: Json
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          title?: string
          description?: string | null
          icon?: string | null
          metadata?: Json
          unlocked_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          subject_id: string | null
          title: string
          description: string | null
          event_type: 'toets' | 'examen' | 'huiswerk' | 'les' | 'project' | 'other'
          event_date: string
          event_time: string | null
          end_time: string | null
          location: string | null
          is_completed: boolean
          reminder_minutes: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id?: string | null
          title: string
          description?: string | null
          event_type: 'toets' | 'examen' | 'huiswerk' | 'les' | 'project' | 'other'
          event_date: string
          event_time?: string | null
          end_time?: string | null
          location?: string | null
          is_completed?: boolean
          reminder_minutes?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string | null
          title?: string
          description?: string | null
          event_type?: 'toets' | 'examen' | 'huiswerk' | 'les' | 'project' | 'other'
          event_date?: string
          event_time?: string | null
          end_time?: string | null
          location?: string | null
          is_completed?: boolean
          reminder_minutes?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          study_set_id: string
          paragraph_id: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          study_set_id: string
          paragraph_id: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          study_set_id?: string
          paragraph_id?: string
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          id: string
          user_id: string
          study_set_id: string
          paragraph_id: string
          percentage: number
          last_position: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          study_set_id: string
          paragraph_id: string
          percentage?: number
          last_position?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          study_set_id?: string
          paragraph_id?: string
          percentage?: number
          last_position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_data: Json
          session_id: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          event_data?: Json
          session_id?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          event_data?: Json
          session_id?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      subject_analytics: {
        Row: {
          subject_id: string | null
          user_id: string | null
          name: string | null
          slug: string | null
          total_sets: number | null
          total_cards: number | null
          total_sessions: number | null
          total_study_minutes: number | null
          average_accuracy: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_study_stats: {
        Args: {
          user_uuid: string
        }
        Returns: {
          total_sets: number
          total_cards: number
          cards_studied_today: number
          study_streak_days: number
        }[]
      }
      increment: {
        Args: {
          table_name: string
          row_id: string
          column_name: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
