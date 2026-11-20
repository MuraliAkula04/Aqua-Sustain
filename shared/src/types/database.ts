export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          role: 'farmer' | 'admin' | 'evaluator';
          preferred_language: 'en' | 'te' | 'hi';
          state: string;
          district: string;
          village: string;
          avatar_url: string | null;
          farm_count: number;
          pond_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          role?: 'farmer' | 'admin' | 'evaluator';
          preferred_language?: 'en' | 'te' | 'hi';
          state?: string;
          district?: string;
          village?: string;
          avatar_url?: string | null;
          farm_count?: number;
          pond_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      farms: {
        Row: {
          id: string;
          farmer_id: string;
          name: string;
          state: string;
          district: string;
          mandal: string;
          village: string;
          total_area_acres: number;
          water_source: 'Borewell' | 'Canal' | 'Creek' | 'River' | 'Reservoir';
          soil_type: 'Clay Loam' | 'Sandy Clay' | 'Alluvial' | 'Saline Soil';
          registration_number: string | null;
          caa_registration_number: string | null;
          established_year: number;
          status: 'Active' | 'Under Preparation' | 'Fallow';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['farms']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['farms']['Insert']>;
      };
      ponds: {
        Row: {
          id: string;
          farm_id: string;
          name: string;
          code: string;
          water_area_acres: number;
          average_depth_meters: number;
          species: string;
          stocking_date: string;
          days_of_culture: number;
          stocking_density_per_sqm: number;
          total_stock_count: number;
          estimated_survival_rate_percent: number;
          current_estimated_biomass_kg: number;
          current_mean_body_weight_grams: number;
          target_harvest_weight_grams: number;
          target_harvest_date: string | null;
          culture_stage: string;
          aerator_hp_total: number;
          status: 'Optimal' | 'Attention' | 'Critical' | 'Fallow';
          last_water_quality_test: string | null;
          last_feeding_recorded: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ponds']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ponds']['Insert']>;
      };
      water_quality_readings: {
        Row: {
          id: string;
          pond_id: string;
          timestamp: string;
          recorded_by: string;
          temperature_c: number;
          ph: number;
          dissolved_oxygen_mg_l: number;
          transparency_cm: number;
          salinity_ppt: number;
          alkalinity_ppm: number;
          ammonia_ppm: number;
          nitrite_ppm: number;
          hardness_ppm: number | null;
          notes: string | null;
          status: 'Normal' | 'Alert' | 'Critical';
          alerts_triggered: string[] | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['water_quality_readings']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['water_quality_readings']['Insert']>;
      };
      pond_assessments: {
        Row: {
          id: string;
          pond_id: string;
          timestamp: string;
          rule_version: string;
          overall_score: number;
          status: 'Optimal' | 'Good' | 'Moderate' | 'Critical';
          parameter_evaluations: Json;
          limiting_factors: string[];
          recommendations: Json;
          suggested_follow_ups: string[];
          missing_parameters: string[];
          disclaimer: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pond_assessments']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['pond_assessments']['Insert']>;
      };
      feed_records: {
        Row: {
          id: string;
          pond_id: string;
          date: string;
          feed_slot: string;
          feed_brand: string;
          feed_type: string;
          quantity_kg: number;
          unit_price_per_kg: number;
          total_cost: number;
          check_tray_observation: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['feed_records']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['feed_records']['Insert']>;
      };
      expense_records: {
        Row: {
          id: string;
          farm_id: string;
          pond_id: string | null;
          date: string;
          category: string;
          amount: number;
          description: string;
          vendor_name: string;
          payment_mode: string;
          invoice_number: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expense_records']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['expense_records']['Insert']>;
      };
      reminders: {
        Row: {
          id: string;
          farmer_id: string;
          pond_id: string | null;
          title: string;
          description: string;
          category: string;
          due_date: string;
          due_time: string;
          priority: 'High' | 'Medium' | 'Low';
          status: 'Pending' | 'Completed';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reminders']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>;
      };
      learning_articles: {
        Row: {
          id: string;
          slug: string;
          category: string;
          reading_time_minutes: number;
          published_date: string;
          author: string;
          author_role: string;
          verified_by_expert: boolean;
          expert_name: string | null;
          title: Json;
          summary: Json;
          content_markdown: Json;
          tags: string[];
          banner_gradient: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['learning_articles']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['learning_articles']['Insert']>;
      };
      support_tickets: {
        Row: {
          id: string;
          farmer_id: string;
          farm_id: string | null;
          subject: string;
          category: string;
          priority: 'Critical' | 'High' | 'Medium' | 'Low';
          status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['support_tickets']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['support_tickets']['Insert']>;
      };
      support_responses: {
        Row: {
          id: string;
          ticket_id: string;
          sender_id: string | null;
          sender_name: string;
          sender_role: 'Farmer' | 'Extension Officer' | 'AquaSustain Support' | 'System';
          message: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['support_responses']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['support_responses']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'alert' | 'info' | 'warning' | 'success';
          read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_name: string;
          actor_role: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
    };
  };
}
