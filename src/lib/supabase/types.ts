/**
 * Database type definitions matching the Supabase schema exactly.
 * These mirror the DB column names (snake_case) as returned from Supabase queries.
 */

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface DbOrderItem {
  menuItemId: string;
  quantity: number;
  priceAtOrder: number; // in paise
  customizations?: Record<string, unknown>;
}

export interface DbOrder {
  id: string;
  table_number: string;
  items: DbOrderItem[];
  total_amount: number; // in paise
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_id: string | null;
  created_at: string; // ISO string from Supabase
}

export interface DbMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number; // in paise
  image: string;
  category: string;
  is_available: boolean;
  is_veg: boolean;
  attributes: Record<string, unknown> | null;
  created_at: string;
}

// Supabase Database type helper (used with createClient generic)
export type Database = {
  public: {
    Tables: {
      orders: {
        Row: DbOrder;
        Insert: Omit<DbOrder, 'id' | 'created_at'>;
        Update: Partial<Omit<DbOrder, 'id' | 'created_at'>>;
      };
      menu_items: {
        Row: DbMenuItem;
        Insert: Omit<DbMenuItem, 'id' | 'created_at'>;
        Update: Partial<Omit<DbMenuItem, 'id' | 'created_at'>>;
      };
    };
  };
};
