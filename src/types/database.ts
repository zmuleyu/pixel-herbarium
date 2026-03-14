// Auto-generated types from Supabase schema
// Run: npx supabase gen types typescript --project-id <ref> > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      plants: {
        Row: {
          id: number;
          name_ja: string;
          name_en: string;
          name_latin: string;
          rarity: number;
          season: string[];
          region: string;
          prefectures: string[];
          hanakotoba: string | null;
          flower_meaning: string | null;
          bloom_months: number[];
          available_window: string | null;
          pixel_sprite_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['plants']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['plants']['Insert']>;
      };
      discoveries: {
        Row: {
          id: string;
          user_id: string;
          plant_id: number;
          photo_url: string;
          pixel_url: string | null;
          city: string | null;
          user_note: string | null;
          is_public: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['discoveries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['discoveries']['Insert']>;
      };
      collections: {
        Row: {
          user_id: string;
          plant_id: number;
          first_discovery_id: string;
          count: number;
        };
        Insert: Database['public']['Tables']['collections']['Row'];
        Update: Partial<Database['public']['Tables']['collections']['Row']>;
      };
      user_quotas: {
        Row: {
          user_id: string;
          month: string;
          used: number;
          limit: number;
        };
        Insert: Database['public']['Tables']['user_quotas']['Row'];
        Update: Partial<Database['public']['Tables']['user_quotas']['Row']>;
      };
    };
    Functions: {
      deduct_quota: {
        Args: { p_user_id: string; p_month: string };
        Returns: void;
      };
      refund_quota: {
        Args: { p_user_id: string; p_month: string };
        Returns: void;
      };
      get_nearby_discoveries: {
        Args: { lat: number; lon: number; radius: number };
        Returns: Database['public']['Tables']['discoveries']['Row'][];
      };
    };
  };
}
