-- BarberOS — Schema Supabase
-- Execute este SQL no Supabase SQL Editor: https://supabase.com/dashboard/project/ukopdedjfzxtclwgtqln/sql

-- 1. SERVIÇOS
CREATE TABLE IF NOT EXISTS services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  icon text DEFAULT '✂️',
  category text DEFAULT 'Cortes',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. BARBEIROS
CREATE TABLE IF NOT EXISTS barbers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  specialty text DEFAULT '',
  rating numeric DEFAULT 5.0,
  reviews_count int DEFAULT 0,
  avatar_emoji text DEFAULT '🧑',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. AGENDAMENTOS
CREATE TABLE IF NOT EXISTS appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  client_phone text DEFAULT '',
  barber_id uuid REFERENCES barbers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  barber_name text NOT NULL,
  service_price numeric NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text DEFAULT 'pending',
  payment_method text DEFAULT 'local',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 4. CONFIGURAÇÕES DA BARBEARIA
CREATE TABLE IF NOT EXISTS settings (
  id int DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  shop_name text DEFAULT 'Dom Pedro Barbearia',
  address text DEFAULT 'Rua das Tesouras, 42 — Pinheiros, SP',
  phone text DEFAULT '(11) 99999-9999',
  instagram text DEFAULT '@dompedrobarbearia',
  facebook text DEFAULT '',
  pix_key text DEFAULT 'barbearia.dompedro@pix.com',
  working_days text DEFAULT 'Seg,Ter,Qua,Qui,Sex,Sab',
  opening_time text DEFAULT '09:00',
  closing_time text DEFAULT '20:00',
  whatsapp text DEFAULT '5511999999999'
);

-- 5. PROMOÇÕES
CREATE TABLE IF NOT EXISTS promotions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  emoji text DEFAULT '🔥',
  original_price numeric,
  promo_price numeric NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ==================
-- DADOS PADRÃO
-- ==================

INSERT INTO services (name, price, duration_minutes, icon, category) VALUES
  ('Corte Degradê', 45, 40, '✂️', 'Cortes'),
  ('Corte Clássico', 40, 35, '💇', 'Cortes'),
  ('Navalhado', 55, 50, '🪒', 'Cortes'),
  ('Pezinho / Acabamento', 20, 15, '✨', 'Cortes'),
  ('Barba Completa', 35, 30, '🧔', 'Barba'),
  ('Barba Navalha', 45, 40, '💈', 'Barba'),
  ('Corte + Barba', 70, 60, '💈', 'Combos'),
  ('Corte + Sobrancelha', 55, 50, '🌟', 'Combos'),
  ('Hidratação Capilar', 30, 30, '🧴', 'Tratamentos'),
  ('Design Sobrancelha', 15, 15, '👁', 'Tratamentos')
ON CONFLICT DO NOTHING;

INSERT INTO barbers (name, specialty, rating, reviews_count, avatar_emoji) VALUES
  ('Marcos', 'Degradê & Barba', 4.9, 142, '🧑‍🦱'),
  ('Rafael', 'Clássico & Social', 4.8, 89, '👨‍🦲'),
  ('João', 'Navalhado & Barba', 4.7, 56, '👨‍🦰')
ON CONFLICT DO NOTHING;

INSERT INTO settings (id, shop_name) VALUES (1, 'Dom Pedro Barbearia')
ON CONFLICT (id) DO NOTHING;

INSERT INTO promotions (name, description, emoji, original_price, promo_price) VALUES
  ('Combo Degradê + Barba', 'Promoção de segunda e terça', '🔥', 75, 55),
  ('Corte + Hidratação', 'Todo dia até as 12h', '💇', 60, 45)
ON CONFLICT DO NOTHING;

-- ==================
-- ROW LEVEL SECURITY
-- ==================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Leitura pública (clientes podem ver serviços, barbeiros, configurações)
CREATE POLICY "public_read_services" ON services FOR SELECT USING (true);
CREATE POLICY "public_read_barbers" ON barbers FOR SELECT USING (true);
CREATE POLICY "public_read_settings" ON settings FOR SELECT USING (true);
CREATE POLICY "public_read_promotions" ON promotions FOR SELECT USING (true);

-- Clientes podem criar agendamentos sem conta
CREATE POLICY "public_insert_appointments" ON appointments FOR INSERT WITH CHECK (true);

-- Clientes podem ver agendamentos (para checar disponibilidade)
CREATE POLICY "public_read_appointments" ON appointments FOR SELECT USING (true);

-- Admin (autenticado) pode fazer tudo
CREATE POLICY "admin_all_services" ON services FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_barbers" ON barbers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_appointments" ON appointments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_settings" ON settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_promotions" ON promotions FOR ALL USING (auth.role() = 'authenticated');
