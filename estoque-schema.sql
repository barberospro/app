-- BarberOS — Módulo de Estoque
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard/project/seyadufuohsbpcqaguig/sql

-- ==========================================
-- 1. PRODUTOS (venda ao cliente)
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  cost_price numeric DEFAULT 0,          -- preço de custo (entrada)
  category text DEFAULT 'Geral',
  quantity int NOT NULL DEFAULT 0,       -- estoque atual
  min_quantity int DEFAULT 0,            -- estoque mínimo (alerta)
  unit text DEFAULT 'un',                -- unidade: un, ml, g, etc.
  image_url text DEFAULT '',             -- URL da foto (Supabase Storage)
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 2. MOVIMENTAÇÕES DE PRODUTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS product_movements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('entrada','saida')),
  quantity int NOT NULL,
  unit_price numeric DEFAULT 0,          -- preço unitário na movimentação
  total_price numeric DEFAULT 0,         -- quantity * unit_price
  notes text DEFAULT '',
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 3. INSUMOS (uso interno / custo operacional)
-- ==========================================
CREATE TABLE IF NOT EXISTS supplies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text DEFAULT 'Geral',
  unit text DEFAULT 'un',                -- un, ml, g, caixa, etc.
  quantity numeric NOT NULL DEFAULT 0,   -- estoque atual
  min_quantity numeric DEFAULT 0,        -- mínimo para alerta
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 4. MOVIMENTAÇÕES DE INSUMOS
-- ==========================================
CREATE TABLE IF NOT EXISTS supply_movements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  supply_id uuid REFERENCES supplies(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('entrada','consumo')),
  quantity numeric NOT NULL,
  unit_cost numeric DEFAULT 0,           -- custo unitário
  total_cost numeric DEFAULT 0,          -- quantity * unit_cost
  notes text DEFAULT '',
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 5. RLS — Row Level Security
-- ==========================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_movements ENABLE ROW LEVEL SECURITY;

-- Produtos: leitura pública (clientes podem ver a vitrine)
CREATE POLICY "public_read_products" ON products
  FOR SELECT USING (active = true);

-- Produtos: admin pode fazer tudo (autenticado)
CREATE POLICY "admin_all_products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- Movimentações de produtos: somente admin
CREATE POLICY "admin_all_product_movements" ON product_movements
  FOR ALL USING (auth.role() = 'authenticated');

-- Insumos: somente admin
CREATE POLICY "admin_all_supplies" ON supplies
  FOR ALL USING (auth.role() = 'authenticated');

-- Movimentações de insumos: somente admin
CREATE POLICY "admin_all_supply_movements" ON supply_movements
  FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 6. SUPABASE STORAGE — bucket para fotos
-- ==========================================
-- Execute no SQL Editor do Supabase:
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

-- Política: qualquer um pode ler (imagens públicas)
CREATE POLICY "public_read_product_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Política: autenticado pode fazer upload/delete
CREATE POLICY "admin_upload_product_images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "admin_delete_product_images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
