// src/types/database.ts
// Tipos para Supabase

// Tipos auxiliares
export interface AlertFilters {
  keyword?: string;
  departamento?: string;
  municipio?: string;
  modalidad?: string;
  tipo_contrato?: string;
  fase?: string;
  precio_min?: number;
  precio_max?: number;
}

// Tipos de las tablas
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Preferences {
  id: string;
  user_id: string;
  theme: "light" | "dark" | "system";
  notifications_enabled: boolean;
  onboarding_completed: boolean;
  favorite_contract_types: string[];
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  process_id: string;
  process_data: any;
  notes: string | null;
  created_at: string;
}

export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  filters: any;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  name: string;
  filters: AlertFilters;
  frequency_hours: number;
  is_active: boolean;
  last_check: string | null;
  last_results_count: number;
  last_results_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface AlertHistory {
  id: string;
  alert_id: string;
  user_id: string;
  new_processes_count: number;
  new_processes_ids: string[];
  notification_sent: boolean;
  created_at: string;
}

// ============================================
// OBLIGACIONES TRIBUTARIAS
// ============================================
export type ObligationType = "estampilla" | "retencion" | "seguridad_social" | "informe";
export type ObligationStatus = "pending" | "completed" | "overdue";

export interface ContractObligation {
  id: string;
  user_id: string;
  process_id: string;
  process_name: string | null;
  obligation_type: ObligationType;
  title: string;
  description: string | null;
  due_date: string;
  estimated_amount: number | null;
  status: ObligationStatus;
  reminder_days: number[];
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Tipo Database simplificado (sin generics complejos)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      preferences: {
        Row: Preferences;
        Insert: Partial<Preferences> & { user_id: string };
        Update: Partial<Preferences>;
      };
      favorites: {
        Row: Favorite;
        Insert: Partial<Favorite> & {
          user_id: string;
          process_id: string;
          process_data: any;
        };
        Update: Partial<Favorite>;
      };
      saved_filters: {
        Row: SavedFilter;
        Insert: Partial<SavedFilter> & {
          user_id: string;
          name: string;
          filters: any;
        };
        Update: Partial<SavedFilter>;
      };
      alerts: {
        Row: Alert;
        Insert: Partial<Alert> & {
          user_id: string;
          name: string;
          filters: AlertFilters;
        };
        Update: Partial<Alert>;
      };
      alert_history: {
        Row: AlertHistory;
        Insert: Partial<AlertHistory> & {
          alert_id: string;
          user_id: string;
          new_processes_count: number;
          new_processes_ids: string[];
        };
        Update: Partial<AlertHistory>;
      };
      contract_obligations: {
        Row: ContractObligation;
        Insert: Partial<ContractObligation> & {
          user_id: string;
          process_id: string;
          obligation_type: ObligationType;
          title: string;
          due_date: string;
        };
        Update: Partial<ContractObligation>;
      };
    };
  };
}
