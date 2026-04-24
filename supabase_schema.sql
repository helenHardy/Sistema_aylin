-- SQL Schema for Aylin Wool Shop System

-- 1. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  categoria TEXT,
  marca TEXT,
  imagen_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Variants (Optional)
CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL, -- e.g., "Rojo", "Grueso"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Warehouses (Deposits)
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Movements (Kardex)
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES variants(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('entrada', 'salida')) NOT NULL,
  cantidad INTEGER NOT NULL,
  responsable TEXT NOT NULL,
  destino TEXT, -- Libre (e.g., "Compra", "Venta", "Transferencia")
  fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  guia TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  responsable TEXT NOT NULL,
  tipo_pago TEXT CHECK (tipo_pago IN ('efectivo', 'qr', 'mixto', 'deuda')) NOT NULL,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  monto NUMERIC(10, 2) NOT NULL DEFAULT 0,
  metodo TEXT CHECK (metodo IN ('efectivo', 'qr')) NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Settings (Social Media & Contact)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whatsapp_number TEXT,
  tiktok_url TEXT,
  facebook_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read for all" ON products FOR SELECT USING (true);
CREATE POLICY "Enable manage for all" ON products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for all" ON variants FOR SELECT USING (true);
CREATE POLICY "Enable manage for all" ON variants FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for all" ON warehouses FOR SELECT USING (true);
CREATE POLICY "Enable manage for all" ON warehouses FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for all" ON movements FOR SELECT USING (true);
CREATE POLICY "Enable manage for all" ON movements FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable manage for all" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable manage for all" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable manage for all" ON payments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for all" ON settings FOR SELECT USING (true);
CREATE POLICY "Enable manage for all" ON settings FOR ALL USING (true) WITH CHECK (true);
