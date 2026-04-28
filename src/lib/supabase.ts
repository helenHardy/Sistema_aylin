import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types from schema
export type Product = {
  id: string;
  nombre: string;
  categoria: string;
  marca: string;
  imagen_url?: string;
  created_at: string;
};

export type Variant = {
  id: string;
  product_id: string;
  nombre: string;
};

export type Warehouse = {
  id: string;
  nombre: string;
};

export type Movement = {
  id: string;
  product_id: string;
  variant_id?: string;
  warehouse_id: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  responsable: string;
  destino?: string;
  fecha: string;
};

export type Client = {
  id: string;
  nombre: string;
  telefono?: string;
  created_at: string;
};

export type Sale = {
  id: string;
  client_id: string;
  guia?: string;
  descripcion?: string;
  fecha: string;
  responsable: string;
  tipo_pago: 'efectivo' | 'qr' | 'mixto' | 'deuda';
  total: number;
};

export type Payment = {
  id: string;
  client_id: string;
  monto: number;
  metodo: 'efectivo' | 'qr';
  fecha: string;
};

export type Staff = {
  id: string;
  nombre: string;
  created_at?: string;
};

export type Supplier = {
  id: string;
  nombre: string;
  telefono?: string;
  created_at: string;
};

export type SupplierDebt = {
  id: string;
  supplier_id: string;
  monto_total: number;
  descuento: number;
  nota?: string;
  items: any[];
  fecha: string;
  created_at: string;
};

export type SupplierPayment = {
  id: string;
  supplier_id: string;
  monto_total: number;
  monto_efectivo: number;
  monto_qr: number;
  metodo: 'efectivo' | 'qr' | 'mixto';
  fecha: string;
  created_at: string;
};
