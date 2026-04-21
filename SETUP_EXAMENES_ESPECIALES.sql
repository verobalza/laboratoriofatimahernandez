-- ===========================================
-- SQL PARA EXÁMENES ESPECIALIZADOS: ORINA Y HECES
-- Ejecutar manualmente en Supabase SQL Editor
-- ===========================================

-- 1. Agregar columna tipo a pruebas si no existe
ALTER TABLE pruebas ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'normal' CHECK (tipo IN ('normal', 'orina', 'heces'));

-- 2. Crear tabla para exámenes de orina
CREATE TABLE IF NOT EXISTS examenes_orina (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examen_id UUID NOT NULL REFERENCES examenes(id) ON DELETE CASCADE,
  aspecto text,
  color text,
  olor text,
  densidad text,
  ph text,
  reaccion text,
  albumina text,
  cuerpos_cetonicos text,
  hemoglobina text,
  glucosa text,
  nitritos text,
  pigmentos_biliares text,
  bilirrubina text,
  urobilinogenos text,
  celulas_epiteliales text,
  leucocitos text,
  piocitos text,
  cristales text,
  cilindros text,
  levaduras text,
  protozoarios text,
  mucina text,
  bacterias text,
  hematies text,
  creado_en timestamp DEFAULT now()
);

-- 3. Crear tabla para exámenes de heces
CREATE TABLE IF NOT EXISTS examenes_heces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examen_id UUID NOT NULL REFERENCES examenes(id) ON DELETE CASCADE,
  color text,
  consistencia text,
  moco text,
  sangre_oculta text,
  restos_alimenticios text,
  ph text,
  leucocitos text,
  hematies text,
  parasitos text,
  huevos text,
  quistes text,
  bacterias text,
  observaciones text,
  creado_en timestamp DEFAULT now()
);

-- 4. Crear índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_examenes_orina_examen_id ON examenes_orina(examen_id);
CREATE INDEX IF NOT EXISTS idx_examenes_heces_examen_id ON examenes_heces(examen_id);

-- 5. Habilitar RLS
ALTER TABLE examenes_orina ENABLE ROW LEVEL SECURITY;
ALTER TABLE examenes_heces ENABLE ROW LEVEL SECURITY;

-- 6. Insertar pruebas de ejemplo (solo si no existen)
INSERT INTO pruebas (nombre_prueba, unidad_medida, tipo, valor_referencia_min, valor_referencia_max, grupo_id)
VALUES
  ('Orina Completa', '', 'orina', NULL, NULL, (SELECT id FROM grupos WHERE nombre = 'Urología' LIMIT 1)),
  ('Heces Seriada', '', 'heces', NULL, NULL, (SELECT id FROM grupos WHERE nombre = 'Gastroenterología' LIMIT 1))
ON CONFLICT (nombre_prueba) DO NOTHING;

-- ===========================================
-- FIN DEL SQL - Copiar y ejecutar en Supabase
-- ===========================================