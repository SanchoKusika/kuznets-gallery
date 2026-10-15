// Generated from the database schema (Supabase MCP `generate_typescript_types` / `supabase gen types`).
// Regenerate after changing supabase/migrations; jsonb columns are typed in the modules that read them.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      admins: {
        Row: { created_at: string; id: string; login: string; name: string };
        Insert: { created_at?: string; id: string; login: string; name: string };
        Update: { created_at?: string; id?: string; login?: string; name?: string };
        Relationships: [];
      };
      products: {
        Row: {
          categories: string[];
          code: string;
          created_at: string;
          custom_sizes: string[];
          description: string;
          hidden: boolean;
          image: string;
          sizes: Json;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          categories?: string[];
          code: string;
          created_at?: string;
          custom_sizes?: string[];
          description?: string;
          hidden?: boolean;
          image?: string;
          sizes?: Json;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Update: {
          categories?: string[];
          code?: string;
          created_at?: string;
          custom_sizes?: string[];
          description?: string;
          hidden?: boolean;
          image?: string;
          sizes?: Json;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      requests: {
        Row: {
          comment: string;
          company: string;
          created_at: string;
          due: string | null;
          id: string;
          items: Json;
          name: string;
          no: number;
          notes: Json;
          phone: string;
          source: Database["public"]["Enums"]["request_source"];
          status: Database["public"]["Enums"]["request_status"];
          updated_at: string;
        };
        Insert: {
          comment?: string;
          company?: string;
          created_at?: string;
          due?: string | null;
          id?: string;
          items?: Json;
          name?: string;
          no?: number;
          notes?: Json;
          phone?: string;
          source?: Database["public"]["Enums"]["request_source"];
          status?: Database["public"]["Enums"]["request_status"];
          updated_at?: string;
        };
        Update: {
          comment?: string;
          company?: string;
          created_at?: string;
          due?: string | null;
          id?: string;
          items?: Json;
          name?: string;
          no?: number;
          notes?: Json;
          phone?: string;
          source?: Database["public"]["Enums"]["request_source"];
          status?: Database["public"]["Enums"]["request_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: { created_at: string; hidden: boolean; id: string; name: string; sort_order: number; text: string };
        Insert: { created_at?: string; hidden?: boolean; id?: string; name?: string; sort_order?: number; text?: string };
        Update: { created_at?: string; hidden?: boolean; id?: string; name?: string; sort_order?: number; text?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      admin_email: { Args: { p_login: string }; Returns: string };
      create_admin: { Args: { p_email: string; p_login: string; p_name: string; p_password: string }; Returns: string };
      is_admin: { Args: never; Returns: boolean };
      submit_request: { Args: { p_comment: string; p_items: Json; p_name: string; p_phone: string }; Returns: number };
    };
    Enums: {
      request_source: "Сайт" | "Instagram" | "Telegram" | "Телефон";
      request_status: "new" | "contact" | "mockup" | "prod" | "ship" | "done" | "cancel";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
