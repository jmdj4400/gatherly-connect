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
      community_followers: {
        Row: {
          created_at: string
          id: string
          notify_new_events: boolean | null
          org_id: string
          public_display: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_new_events?: boolean | null
          org_id: string
          public_display?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_new_events?: boolean | null
          org_id?: string
          public_display?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_followers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_assets: {
        Row: {
          asset_type: string
          created_at: string
          event_id: string
          id: string
          image_url: string
          updated_at: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          event_id: string
          id?: string
          image_url: string
          updated_at?: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          event_id?: string
          id?: string
          image_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_assets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          event_id: string
          feedback: Json | null
          id: string
          joined_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          feedback?: Json | null
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          feedback?: Json | null
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          allow_come_alone: boolean | null
          category: string | null
          city: string | null
          created_at: string | null
          description: string | null
          embedding_updated_at: string | null
          ends_at: string | null
          event_embedding: Json | null
          host_org_id: string | null
          id: string
          image_url: string | null
          import_batch_id: string | null
          lat: number | null
          lng: number | null
          max_group_size: number | null
          organizer_logo_url: string | null
          parent_event_id: string | null
          recurrence_day: number | null
          recurrence_time: string | null
          recurrence_type: string | null
          source: string | null
          source_id: string | null
          starts_at: string
          ticket_price: number | null
          title: string
          venue_name: string | null
        }
        Insert: {
          address?: string | null
          allow_come_alone?: boolean | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          embedding_updated_at?: string | null
          ends_at?: string | null
          event_embedding?: Json | null
          host_org_id?: string | null
          id?: string
          image_url?: string | null
          import_batch_id?: string | null
          lat?: number | null
          lng?: number | null
          max_group_size?: number | null
          organizer_logo_url?: string | null
          parent_event_id?: string | null
          recurrence_day?: number | null
          recurrence_time?: string | null
          recurrence_type?: string | null
          source?: string | null
          source_id?: string | null
          starts_at: string
          ticket_price?: number | null
          title: string
          venue_name?: string | null
        }
        Update: {
          address?: string | null
          allow_come_alone?: boolean | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          embedding_updated_at?: string | null
          ends_at?: string | null
          event_embedding?: Json | null
          host_org_id?: string | null
          id?: string
          image_url?: string | null
          import_batch_id?: string | null
          lat?: number | null
          lng?: number | null
          max_group_size?: number | null
          organizer_logo_url?: string | null
          parent_event_id?: string | null
          recurrence_day?: number | null
          recurrence_time?: string | null
          recurrence_type?: string | null
          source?: string | null
          source_id?: string | null
          starts_at?: string
          ticket_price?: number | null
          title?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_host_org_id_fkey"
            columns: ["host_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_at: string | null
          error_count: number | null
          filename: string | null
          id: string
          org_id: string
          row_count: number | null
          status: string | null
          success_count: number | null
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          filename?: string | null
          id?: string
          org_id: string
          row_count?: number | null
          status?: string | null
          success_count?: number | null
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          filename?: string | null
          id?: string
          org_id?: string
          row_count?: number | null
          status?: string | null
          success_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          moderated: boolean | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          moderated?: boolean | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          moderated?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "micro_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "micro_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "micro_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "micro_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_groups: {
        Row: {
          created_at: string | null
          event_id: string
          frozen: boolean | null
          frozen_at: string | null
          frozen_by: string | null
          id: string
          meet_spot: string | null
          meet_time: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          frozen?: boolean | null
          frozen_at?: string | null
          frozen_by?: string | null
          id?: string
          meet_spot?: string | null
          meet_time?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          frozen?: boolean | null
          frozen_at?: string | null
          frozen_by?: string | null
          id?: string
          meet_spot?: string | null
          meet_time?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "micro_groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      org_activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          org_id: string
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id: string
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id?: string
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_activity_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          community_tags: string[] | null
          contact_email: string | null
          cover_image_url: string | null
          created_at: string | null
          id: string
          name: string
          org_handle: string | null
          short_bio: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          community_tags?: string[] | null
          contact_email?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          name: string
          org_handle?: string | null
          short_bio?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          community_tags?: string[] | null
          contact_email?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          name?: string
          org_handle?: string | null
          short_bio?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          embedding_updated_at: string | null
          id: string
          interests: string[] | null
          language: string | null
          onboarding_completed: boolean | null
          profile_embedding: Json | null
          radius_km: number | null
          social_energy: number | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          embedding_updated_at?: string | null
          id: string
          interests?: string[] | null
          language?: string | null
          onboarding_completed?: boolean | null
          profile_embedding?: Json | null
          radius_km?: number | null
          social_energy?: number | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          embedding_updated_at?: string | null
          id?: string
          interests?: string[] | null
          language?: string | null
          onboarding_completed?: boolean | null
          profile_embedding?: Json | null
          radius_km?: number | null
          social_energy?: number | null
          verified?: boolean | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          message_id: string | null
          moderation_flags: Json | null
          reason: string
          reported_user_id: string
          reporter_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          message_id?: string | null
          moderation_flags?: Json | null
          reason: string
          reported_user_id: string
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          message_id?: string | null
          moderation_flags?: Json | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "micro_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          banned_by: string | null
          banned_until: string | null
          created_at: string | null
          id: string
          permanent: boolean | null
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_by?: string | null
          banned_until?: string | null
          created_at?: string | null
          id?: string
          permanent?: boolean | null
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string | null
          banned_until?: string | null
          created_at?: string | null
          id?: string
          permanent?: boolean | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_mutes: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          muted_by: string | null
          muted_until: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          muted_by?: string | null
          muted_until: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          muted_by?: string | null
          muted_until?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mutes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "micro_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          org_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vibe_scores: {
        Row: {
          computed_at: string
          id: string
          score: number
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          computed_at?: string
          id?: string
          score: number
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          computed_at?: string
          id?: string
          score?: number
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _org_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "org_admin" | "user" | "org_owner" | "org_helper"
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
      app_role: ["admin", "org_admin", "user", "org_owner", "org_helper"],
    },
  },
} as const
