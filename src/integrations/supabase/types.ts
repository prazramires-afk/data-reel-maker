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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          username: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          username: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          username?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      project_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          owner_id: string
          project_id: string
          referrer: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          owner_id: string
          project_id: string
          referrer?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          owner_id?: string
          project_id?: string
          referrer?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          allow_download: boolean
          allow_embed: boolean
          allow_remix: boolean
          author_name: string | null
          category: string | null
          created_at: string
          data: Json
          description: string | null
          download_count: number
          faqs: Json | null
          id: string
          insights: Json | null
          is_public: boolean
          label_images: Json
          like_count: number
          meta_description: string | null
          name: string
          published_at: string | null
          seo_generated_at: string | null
          seo_title: string | null
          settings: Json
          share_count: number
          slug: string | null
          summary: string | null
          thumbnail_url: string | null
          type: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          allow_download?: boolean
          allow_embed?: boolean
          allow_remix?: boolean
          author_name?: string | null
          category?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          download_count?: number
          faqs?: Json | null
          id?: string
          insights?: Json | null
          is_public?: boolean
          label_images?: Json
          like_count?: number
          meta_description?: string | null
          name?: string
          published_at?: string | null
          seo_generated_at?: string | null
          seo_title?: string | null
          settings?: Json
          share_count?: number
          slug?: string | null
          summary?: string | null
          thumbnail_url?: string | null
          type: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          allow_download?: boolean
          allow_embed?: boolean
          allow_remix?: boolean
          author_name?: string | null
          category?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          download_count?: number
          faqs?: Json | null
          id?: string
          insights?: Json | null
          is_public?: boolean
          label_images?: Json
          like_count?: number
          meta_description?: string | null
          name?: string
          published_at?: string | null
          seo_generated_at?: string | null
          seo_title?: string | null
          settings?: Json
          share_count?: number
          slug?: string | null
          summary?: string | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          is_premium: boolean
          last_reset: string
          premium_until: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tokens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_premium?: boolean
          last_reset?: string
          premium_until?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tokens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_premium?: boolean
          last_reset?: string
          premium_until?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tokens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          is_premium: boolean
          premium_until: string
          project_count: number
          tokens: number
          user_id: string
        }[]
      }
      admin_set_premium: {
        Args: { months?: number; premium: boolean; target_user: string }
        Returns: undefined
      }
      admin_set_tokens: {
        Args: { new_tokens: number; target_user: string }
        Returns: undefined
      }
      consume_tokens: {
        Args: { cost: number }
        Returns: {
          is_premium: boolean
          success: boolean
          tokens_remaining: number
        }[]
      }
      generate_project_slug: {
        Args: { _id: string; _title: string }
        Returns: string
      }
      generate_username: { Args: { _email: string }; Returns: string }
      get_profile_by_username: {
        Args: { _username: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          id: string
          tiktok_url: string
          total_likes: number
          total_shares: number
          total_videos: number
          total_views: number
          twitter_url: string
          username: string
          website_url: string
          youtube_url: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      record_project_event: {
        Args: {
          _event_type: string
          _project_id: string
          _referrer?: string
          _visitor_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
