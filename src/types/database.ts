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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bouquets: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          message: string | null
          plant_ids: number[]
          receiver_id: string
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          plant_ids: number[]
          receiver_id: string
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          plant_ids?: number[]
          receiver_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          count: number
          first_discovery_id: string
          plant_id: number
          user_id: string
        }
        Insert: {
          count?: number
          first_discovery_id: string
          plant_id: number
          user_id: string
        }
        Update: {
          count?: number
          first_discovery_id?: string
          plant_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_first_discovery_id_fkey"
            columns: ["first_discovery_id"]
            isOneToOne: false
            referencedRelation: "discoveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      discoveries: {
        Row: {
          city: string | null
          created_at: string
          id: string
          is_public: boolean
          location: unknown
          location_fuzzy: unknown
          photo_url: string
          pixel_url: string | null
          plant_id: number
          user_id: string
          user_note: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          location: unknown
          location_fuzzy: unknown
          photo_url: string
          pixel_url?: string | null
          plant_id: number
          user_id: string
          user_note?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          location?: unknown
          location_fuzzy?: unknown
          photo_url?: string
          pixel_url?: string | null
          plant_id?: number
          user_id?: string
          user_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discoveries_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      plants: {
        Row: {
          available_window: unknown
          bloom_months: number[]
          created_at: string
          flower_meaning: string | null
          hanakotoba: string | null
          id: number
          name_en: string
          name_ja: string
          name_latin: string
          pixel_sprite_url: string | null
          prefectures: string[]
          rarity: number
          region: string
          season: string[]
        }
        Insert: {
          available_window?: unknown
          bloom_months?: number[]
          created_at?: string
          flower_meaning?: string | null
          hanakotoba?: string | null
          id?: number
          name_en: string
          name_ja: string
          name_latin: string
          pixel_sprite_url?: string | null
          prefectures?: string[]
          rarity: number
          region?: string
          season?: string[]
        }
        Update: {
          available_window?: unknown
          bloom_months?: number[]
          created_at?: string
          flower_meaning?: string | null
          hanakotoba?: string | null
          id?: number
          name_en?: string
          name_ja?: string
          name_latin?: string
          pixel_sprite_url?: string | null
          prefectures?: string[]
          rarity?: number
          region?: string
          season?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_seed: string
          deletion_requested_at: string | null
          display_name: string
          id: string
          map_visible: boolean
          updated_at: string | null
        }
        Insert: {
          avatar_seed?: string
          deletion_requested_at?: string | null
          display_name?: string
          id: string
          map_visible?: boolean
          updated_at?: string | null
        }
        Update: {
          avatar_seed?: string
          deletion_requested_at?: string | null
          display_name?: string
          id?: string
          map_visible?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sakura_spots: {
        Row: {
          access_note: string | null
          best_time: string | null
          bloom_early_start: string | null
          bloom_late_end: string | null
          bloom_peak_end: string | null
          bloom_peak_start: string | null
          category: string
          city: string
          custom_sprite_url: string | null
          description: string | null
          facilities: string[] | null
          id: number
          lat: number
          lng: number
          location: unknown
          name_en: string
          name_ja: string
          prefecture: string
          prefecture_code: number
          season_id: string
          sort_order: number | null
          tags: string[]
          tree_count: number | null
        }
        Insert: {
          access_note?: string | null
          best_time?: string | null
          bloom_early_start?: string | null
          bloom_late_end?: string | null
          bloom_peak_end?: string | null
          bloom_peak_start?: string | null
          category: string
          city: string
          custom_sprite_url?: string | null
          description?: string | null
          facilities?: string[] | null
          id: number
          lat: number
          lng: number
          location?: unknown
          name_en: string
          name_ja: string
          prefecture: string
          prefecture_code: number
          season_id?: string
          sort_order?: number | null
          tags?: string[]
          tree_count?: number | null
        }
        Update: {
          access_note?: string | null
          best_time?: string | null
          bloom_early_start?: string | null
          bloom_late_end?: string | null
          bloom_peak_end?: string | null
          bloom_peak_start?: string | null
          category?: string
          city?: string
          custom_sprite_url?: string | null
          description?: string | null
          facilities?: string[] | null
          id?: number
          lat?: number
          lng?: number
          location?: unknown
          name_en?: string
          name_ja?: string
          prefecture?: string
          prefecture_code?: number
          season_id?: string
          sort_order?: number | null
          tags?: string[]
          tree_count?: number | null
        }
        Relationships: []
      }
      scrapling_competitive_matrix: {
        Row: {
          app_name: string
          computed_at: string | null
          id: string
          rating: number | null
          rating_delta: number | null
          review_volume: number | null
          top_signal: string | null
          week_start: string
        }
        Insert: {
          app_name: string
          computed_at?: string | null
          id?: string
          rating?: number | null
          rating_delta?: number | null
          review_volume?: number | null
          top_signal?: string | null
          week_start: string
        }
        Update: {
          app_name?: string
          computed_at?: string | null
          id?: string
          rating?: number | null
          rating_delta?: number | null
          review_volume?: number | null
          top_signal?: string | null
          week_start?: string
        }
        Relationships: []
      }
      scrapling_competitor_profiles: {
        Row: {
          app_id: string
          app_name: string
          id: string
          latest_rating: number | null
          latest_rating_count: number | null
          latest_version: string | null
          platform: string
          updated_at: string | null
        }
        Insert: {
          app_id: string
          app_name: string
          id?: string
          latest_rating?: number | null
          latest_rating_count?: number | null
          latest_version?: string | null
          platform: string
          updated_at?: string | null
        }
        Update: {
          app_id?: string
          app_name?: string
          id?: string
          latest_rating?: number | null
          latest_rating_count?: number | null
          latest_version?: string | null
          platform?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scrapling_crawl_health: {
        Row: {
          crawl_type: string
          crawled_at: string | null
          duration_ms: number | null
          errors: Json | null
          id: string
          platform: string
          project_id: string
          rows_written: number | null
          status: string
        }
        Insert: {
          crawl_type: string
          crawled_at?: string | null
          duration_ms?: number | null
          errors?: Json | null
          id?: string
          platform: string
          project_id?: string
          rows_written?: number | null
          status: string
        }
        Update: {
          crawl_type?: string
          crawled_at?: string | null
          duration_ms?: number | null
          errors?: Json | null
          id?: string
          platform?: string
          project_id?: string
          rows_written?: number | null
          status?: string
        }
        Relationships: []
      }
      scrapling_freshness: {
        Row: {
          id: string
          item_count: number | null
          last_collected: string
          source_name: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_count?: number | null
          last_collected: string
          source_name: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_count?: number | null
          last_collected?: string
          source_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      scrapling_pending_alerts: {
        Row: {
          acknowledged: boolean | null
          created_at: string | null
          detail: string | null
          id: number
          platform: string | null
          project_id: string
          severity: string
          source: string
          title: string
        }
        Insert: {
          acknowledged?: boolean | null
          created_at?: string | null
          detail?: string | null
          id?: number
          platform?: string | null
          project_id?: string
          severity: string
          source?: string
          title: string
        }
        Update: {
          acknowledged?: boolean | null
          created_at?: string | null
          detail?: string | null
          id?: number
          platform?: string | null
          project_id?: string
          severity?: string
          source?: string
          title?: string
        }
        Relationships: []
      }
      scrapling_plant_enrichment: {
        Row: {
          additional_hanakotoba: Json | null
          bloom_months: number[] | null
          colors: string[] | null
          enriched_at: string | null
          id: string
          origin_story: string | null
          plant_name_ja: string
          source_plant_id: string | null
        }
        Insert: {
          additional_hanakotoba?: Json | null
          bloom_months?: number[] | null
          colors?: string[] | null
          enriched_at?: string | null
          id?: string
          origin_story?: string | null
          plant_name_ja: string
          source_plant_id?: string | null
        }
        Update: {
          additional_hanakotoba?: Json | null
          bloom_months?: number[] | null
          colors?: string[] | null
          enriched_at?: string | null
          id?: string
          origin_story?: string | null
          plant_name_ja?: string
          source_plant_id?: string | null
        }
        Relationships: []
      }
      scrapling_ratings: {
        Row: {
          app_identifier: string
          app_name: string
          created_at: string
          id: string
          platform: string
          project_id: string
          rating: number | null
          rating_count: number | null
          snapshot_date: string
        }
        Insert: {
          app_identifier: string
          app_name: string
          created_at?: string
          id?: string
          platform: string
          project_id?: string
          rating?: number | null
          rating_count?: number | null
          snapshot_date: string
        }
        Update: {
          app_identifier?: string
          app_name?: string
          created_at?: string
          id?: string
          platform?: string
          project_id?: string
          rating?: number | null
          rating_count?: number | null
          snapshot_date?: string
        }
        Relationships: []
      }
      scrapling_raw_hanakotoba: {
        Row: {
          bloom_months: number[] | null
          family: string | null
          fetched_at: string | null
          flower_language: Json | null
          id: string
          name_en: string | null
          name_ja: string | null
          plant_id: string
          project_id: string
          scientific_name: string | null
          source_url: string | null
        }
        Insert: {
          bloom_months?: number[] | null
          family?: string | null
          fetched_at?: string | null
          flower_language?: Json | null
          id?: string
          name_en?: string | null
          name_ja?: string | null
          plant_id: string
          project_id?: string
          scientific_name?: string | null
          source_url?: string | null
        }
        Update: {
          bloom_months?: number[] | null
          family?: string | null
          fetched_at?: string | null
          flower_language?: Json | null
          id?: string
          name_en?: string | null
          name_ja?: string | null
          plant_id?: string
          project_id?: string
          scientific_name?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      scrapling_raw_qa: {
        Row: {
          answer_count: number | null
          best_answer: string | null
          content: string | null
          crawled_at: string | null
          id: string
          keyword: string | null
          platform: string
          project_id: string
          question_date: string | null
          question_id: string
          subject: string | null
        }
        Insert: {
          answer_count?: number | null
          best_answer?: string | null
          content?: string | null
          crawled_at?: string | null
          id?: string
          keyword?: string | null
          platform?: string
          project_id?: string
          question_date?: string | null
          question_id: string
          subject?: string | null
        }
        Update: {
          answer_count?: number | null
          best_answer?: string | null
          content?: string | null
          crawled_at?: string | null
          id?: string
          keyword?: string | null
          platform?: string
          project_id?: string
          question_date?: string | null
          question_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      scrapling_raw_reviews: {
        Row: {
          app_id: string
          app_name: string
          author: string | null
          body: string | null
          crawled_at: string | null
          id: string
          platform: string
          project_id: string
          rating: number | null
          review_date: string | null
          review_id: string
          title: string | null
          version: string | null
        }
        Insert: {
          app_id: string
          app_name: string
          author?: string | null
          body?: string | null
          crawled_at?: string | null
          id?: string
          platform: string
          project_id?: string
          rating?: number | null
          review_date?: string | null
          review_id: string
          title?: string | null
          version?: string | null
        }
        Update: {
          app_id?: string
          app_name?: string
          author?: string | null
          body?: string | null
          crawled_at?: string | null
          id?: string
          platform?: string
          project_id?: string
          rating?: number | null
          review_date?: string | null
          review_id?: string
          title?: string | null
          version?: string | null
        }
        Relationships: []
      }
      scrapling_raw_seasonal: {
        Row: {
          crawled_at: string | null
          data: Json
          data_type: string
          id: string
          observation_date: string | null
          platform: string
          project_id: string
          region: string | null
        }
        Insert: {
          crawled_at?: string | null
          data?: Json
          data_type: string
          id?: string
          observation_date?: string | null
          platform: string
          project_id?: string
          region?: string | null
        }
        Update: {
          crawled_at?: string | null
          data?: Json
          data_type?: string
          id?: string
          observation_date?: string | null
          platform?: string
          project_id?: string
          region?: string | null
        }
        Relationships: []
      }
      scrapling_raw_social: {
        Row: {
          author: string | null
          crawled_at: string | null
          hashtags: string[] | null
          id: string
          keyword: string | null
          like_count: number | null
          platform: string
          post_date: string | null
          post_id: string
          project_id: string
          text: string | null
        }
        Insert: {
          author?: string | null
          crawled_at?: string | null
          hashtags?: string[] | null
          id?: string
          keyword?: string | null
          like_count?: number | null
          platform: string
          post_date?: string | null
          post_id: string
          project_id?: string
          text?: string | null
        }
        Update: {
          author?: string | null
          crawled_at?: string | null
          hashtags?: string[] | null
          id?: string
          keyword?: string | null
          like_count?: number | null
          platform?: string
          post_date?: string | null
          post_id?: string
          project_id?: string
          text?: string | null
        }
        Relationships: []
      }
      scrapling_signal_convergence: {
        Row: {
          confidence_avg: number
          created_at: string
          first_seen: string
          id: string
          last_seen: string
          platform_count: number
          platforms: string[]
          priority_score: number | null
          signal_type: string
          status: string
          total_occurrences: number
          updated_at: string
        }
        Insert: {
          confidence_avg?: number
          created_at?: string
          first_seen?: string
          id?: string
          last_seen?: string
          platform_count?: number
          platforms?: string[]
          priority_score?: number | null
          signal_type: string
          status?: string
          total_occurrences?: number
          updated_at?: string
        }
        Update: {
          confidence_avg?: number
          created_at?: string
          first_seen?: string
          id?: string
          last_seen?: string
          platform_count?: number
          platforms?: string[]
          priority_score?: number | null
          signal_type?: string
          status?: string
          total_occurrences?: number
          updated_at?: string
        }
        Relationships: []
      }
      scrapling_signals: {
        Row: {
          app_id: string
          app_name: string
          confidence: number | null
          created_at: string
          id: string
          keywords_matched: Json | null
          platform: string
          project_id: string
          review_text: string | null
          signal_id: string
          signal_timestamp: string
          signal_type: string
        }
        Insert: {
          app_id?: string
          app_name: string
          confidence?: number | null
          created_at?: string
          id?: string
          keywords_matched?: Json | null
          platform: string
          project_id?: string
          review_text?: string | null
          signal_id: string
          signal_timestamp: string
          signal_type: string
        }
        Update: {
          app_id?: string
          app_name?: string
          confidence?: number | null
          created_at?: string
          id?: string
          keywords_matched?: Json | null
          platform?: string
          project_id?: string
          review_text?: string | null
          signal_id?: string
          signal_timestamp?: string
          signal_type?: string
        }
        Relationships: []
      }
      scrapling_trends: {
        Row: {
          created_at: string
          fetched_at: string
          geo: string | null
          id: string
          interest_score: number | null
          keyword: string
          project_id: string
          related_queries: Json | null
          suggestions: Json | null
        }
        Insert: {
          created_at?: string
          fetched_at: string
          geo?: string | null
          id?: string
          interest_score?: number | null
          keyword: string
          project_id?: string
          related_queries?: Json | null
          suggestions?: Json | null
        }
        Update: {
          created_at?: string
          fetched_at?: string
          geo?: string | null
          id?: string
          interest_score?: number | null
          keyword?: string
          project_id?: string
          related_queries?: Json | null
          suggestions?: Json | null
        }
        Relationships: []
      }
      scrapling_weekly_signals: {
        Row: {
          app_name: string
          avg_confidence: number | null
          computed_at: string | null
          count: number | null
          id: string
          signal_type: string
          week_start: string
        }
        Insert: {
          app_name: string
          avg_confidence?: number | null
          computed_at?: string | null
          count?: number | null
          id?: string
          signal_type: string
          week_start: string
        }
        Update: {
          app_name?: string
          avg_confidence?: number | null
          computed_at?: string | null
          count?: number | null
          id?: string
          signal_type?: string
          week_start?: string
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      spot_checkins: {
        Row: {
          bloom_status_at_checkin: string | null
          checked_in_at: string
          id: string
          is_mankai: boolean
          spot_id: number
          stamp_variant: string
          user_id: string
        }
        Insert: {
          bloom_status_at_checkin?: string | null
          checked_in_at?: string
          id?: string
          is_mankai?: boolean
          spot_id: number
          stamp_variant?: string
          user_id: string
        }
        Update: {
          bloom_status_at_checkin?: string | null
          checked_in_at?: string
          id?: string
          is_mankai?: boolean
          spot_id?: number
          stamp_variant?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_checkins_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "sakura_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quotas: {
        Row: {
          limit: number
          month: string
          used: number
          user_id: string
        }
        Insert: {
          limit?: number
          month: string
          used?: number
          user_id: string
        }
        Update: {
          limit?: number
          month?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      check_cooldown_nearby: {
        Args: {
          p_cutoff: string
          p_lat: number
          p_lon: number
          p_radius: number
          p_user_id: string
        }
        Returns: {
          created_at: string
        }[]
      }
      checkin_spot: {
        Args: { p_bloom_status?: string; p_is_peak: boolean; p_spot_id: number }
        Returns: Json
      }
      deduct_quota: {
        Args: { p_month: string; p_user_id: string }
        Returns: boolean
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_nearby_discoveries: {
        Args: { lat: number; lon: number; radius: number }
        Returns: {
          city: string
          created_at: string
          id: string
          is_public: boolean
          location_fuzzy: unknown
          pixel_url: string
          plant_id: number
          user_id: string
          user_note: string
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      refund_quota: {
        Args: { p_month: string; p_user_id: string }
        Returns: undefined
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
    Enums: {},
  },
} as const
