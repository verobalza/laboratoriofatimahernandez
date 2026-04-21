-- ========================================
-- ⚠️ IMPORTANTE: INSTRUCCIONES
-- ========================================
--
-- 1. Copia TODO este SQL (sin comentarios si lo prefieres)
-- 2. Ve a tu proyecto Supabase
-- 3. Abre: SQL Editor (en el menú lateral izquierdo)
-- 4. Pega TODO el código aquí
-- 5. Haz clic en "Run" (botón azul)
-- 6. Espera a que diga "Success" ✅
--
-- Si hay errores, revisa que:
-- - Las tablas pacientes, pruebas y facturas existan
-- - No tengas duplicados de estas tablas
-- - Los tipos de datos sean exactos
--
-- ========================================
-- PASO 1: Agregar campo "tipo" a tabla pruebas
-- ========================================
-- Si la columna ya existe, este comando fallará (es normal)

ALTER TABLE pruebas 
ADD COLUMN tipo TEXT DEFAULT 'normal' CHECK (tipo IN ('normal', 'orina', 'heces'));

CREATE INDEX IF NOT EXISTS idx_pruebas_tipo ON pruebas(tipo);

-- ========================================
-- PASO 2: Crear tabla EXAMENES_ORINA
-- ========================================

CREATE TABLE IF NOT EXISTS examenes_orina (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias a otras tablas
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  prueba_id BIGINT REFERENCES pruebas(id) ON DELETE SET NULL,
  factura_id BIGINT REFERENCES facturas(id) ON DELETE SET NULL,
  
  -- Fecha del examen
  fecha DATE NOT NULL,
  
  -- ========== PROPIEDADES MACROSCÓPICAS ==========
  aspecto TEXT,                    -- Claro, Turbio, Lechoso, Gelatinoso
  color TEXT,                      -- Incoloro, Amarillo pálido, Amarillo oscuro, Marrón, Rojo
  olor TEXT,                       -- Normal, Fragrante, Nauseabundo, Acetonémico
  densidad NUMERIC(5,3),           -- Rango típico: 1.005 - 1.030
  ph NUMERIC(3,1),                 -- Rango típico: 4.5 - 8.0
  
  -- ========== PROPIEDADES QUÍMICAS ==========
  reaccion TEXT,                   -- Ácida, Neutral, Alcalina
  albumina TEXT,                   -- Negativo, +, ++, +++, ++++
  glucosa TEXT,                    -- Negativo, +, ++, +++, ++++
  nitritos TEXT,                   -- Positivo, Negativo
  bilirrubina TEXT,                -- Negativo, +, ++, +++, ++++
  urobilinogenos TEXT,             -- Normal, Elevado, Muy elevado
  cetonas TEXT,                    -- Negativo, +, ++, +++, ++++
  hemoglobina TEXT,                -- Negativo, +, ++, +++, ++++
  
  -- ========== ANÁLISIS MICROSCÓPICO ==========
  celulas_epiteliales INTEGER DEFAULT 0,   -- Cantidad (normal: 0-5)
  leucocitos INTEGER DEFAULT 0,            -- Cantidad (normal: 0-5)
  hematíes INTEGER DEFAULT 0,              -- Cantidad (normal: 0-3)
  cristales TEXT,                          -- Descripción cualitativa
  bacterias TEXT,                          -- Ausentes, Pocas, Moderadas, Abundantes
  cilindros TEXT,                          -- Descripción cualitativa
  particulas_varias TEXT,                  -- Descripción cualitativa
  
  -- ========== OBSERVACIONES ==========
  observaciones TEXT,
  notas_tecnico TEXT,
  
  -- ========== AUDITORÍA ==========
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  creado_por TEXT
);

-- Índices para búsqueda y performance
CREATE INDEX IF NOT EXISTS idx_examenes_orina_paciente ON examenes_orina(paciente_id);
CREATE INDEX IF NOT EXISTS idx_examenes_orina_fecha ON examenes_orina(fecha);
CREATE INDEX IF NOT EXISTS idx_examenes_orina_prueba ON examenes_orina(prueba_id);
CREATE INDEX IF NOT EXISTS idx_examenes_orina_factura ON examenes_orina(factura_id);

-- Habilitar RLS
ALTER TABLE examenes_orina ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASO 3: Crear tabla EXAMENES_HECES
-- ========================================

CREATE TABLE IF NOT EXISTS examenes_heces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias a otras tablas
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  prueba_id BIGINT REFERENCES pruebas(id) ON DELETE SET NULL,
  factura_id BIGINT REFERENCES facturas(id) ON DELETE SET NULL,
  
  -- Fecha del examen
  fecha DATE NOT NULL,
  
  -- ========== PROPIEDADES MACROSCÓPICAS ==========
  color TEXT,                          -- Café, Café oscuro, Gris-arcilla, Claro
  consistencia TEXT,                   -- Dura, Normal, Blanda, Diarreica
  forma TEXT,                          -- Cilíndrica, Fecaloide, Líquida
  presencia_moco TEXT,                 -- Ausente, Presente, Abundante
  presencia_sangre TEXT,               -- Ausente, Presente, Abundante
  presencia_restos_alimenticios TEXT,  -- Ausente, Presente, Abundante
  
  -- ========== PROPIEDADES QUÍMICAS ==========
  ph NUMERIC(3,1),                     -- Rango típico: 5.5 - 7.5
  
  -- ========== ANÁLISIS MICROSCÓPICO ==========
  leucocitos INTEGER DEFAULT 0,        -- Cantidad (normal: 0-5)
  hematíes INTEGER DEFAULT 0,          -- Cantidad (normal: 0-3)
  celulas_epiteliales INTEGER DEFAULT 0,
  grasa INTEGER DEFAULT 0,             -- Cantidad (normal: 0-2)
  almidón INTEGER DEFAULT 0,           -- Cantidad (normal: 0-2)
  fibras_musculares INTEGER DEFAULT 0,
  cristales_colesterol INTEGER DEFAULT 0,
  cristales_otros TEXT,
  
  -- ========== PARASITOLOGÍA ==========
  parasitos TEXT,                      -- Descripción cualitativa
  huevos_parasitos TEXT,               -- Descripción cualitativa
  quistes_parasitos TEXT,              -- Descripción cualitativa
  bacterias TEXT,                      -- Ausentes, Pocas, Moderadas, Abundantes
  levaduras TEXT,                      -- Ausentes, Pocas, Moderadas, Abundantes
  
  -- ========== CULTIVO (OPCIONAL) ==========
  cultivo_resultado TEXT,
  microorganismos_aislados TEXT,
  
  -- ========== OBSERVACIONES ==========
  observaciones TEXT,
  notas_tecnico TEXT,
  
  -- ========== AUDITORÍA ==========
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  creado_por TEXT
);

-- Índices para búsqueda y performance
CREATE INDEX IF NOT EXISTS idx_examenes_heces_paciente ON examenes_heces(paciente_id);
CREATE INDEX IF NOT EXISTS idx_examenes_heces_fecha ON examenes_heces(fecha);
CREATE INDEX IF NOT EXISTS idx_examenes_heces_prueba ON examenes_heces(prueba_id);
CREATE INDEX IF NOT EXISTS idx_examenes_heces_factura ON examenes_heces(factura_id);

-- Habilitar RLS
ALTER TABLE examenes_heces ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASO 4: Actualizar ejemplos de pruebas (IMPORTANTE)
-- ========================================
-- Este paso es OPCIONAL si ya tienes las pruebas.
-- Si quieres que funcione correctamente, ejecuta esto:

-- Asegúrate de que las pruebas de orina y heces tengan tipo = 'orina' y 'heces'
UPDATE pruebas SET tipo = 'orina' WHERE nombre_prueba = 'Orina Completa';
UPDATE pruebas SET tipo = 'heces' WHERE nombre_prueba = 'Heces Completo';

-- Si NO EXISTEN estas pruebas, créalas ahora:
INSERT INTO pruebas (nombre_prueba, unidad_medida, tipo_muestra, tipo, descripcion, precio_bs)
VALUES 
  ('Orina Completa', 'Análisis completo', 'Orina', 'orina', 'Examen completo de orina con análisis macroscópico, químico y microscópico', 25.00),
  ('Heces Completo', 'Análisis completo', 'Heces', 'heces', 'Examen completo de heces con análisis macroscópico, microscópico y parasitología', 30.00)
ON CONFLICT DO NOTHING;

-- ========================================
-- ✅ LISTO
-- ========================================
-- 
-- Si todo ejecutó sin errores ("Success"), ahora tienes:
-- ✅ Tabla examenes_orina (para exámenes de orina)
-- ✅ Tabla examenes_heces (para exámenes de heces)
-- ✅ Campo tipo en pruebas (puede ser: normal, orina, heces)
-- ✅ Pruebas de ejemplo creadas
--
-- NEXT STEPS:
-- 1. El backend (FastAPI) ya está listo en: backend/app/routes/orina_heces.py
-- 2. El frontend necesita: OrinaForm.jsx ✅ y HecesForm.jsx (próximo)
-- 3. Lógica de detección de tipo en Examenes.jsx
-- 4. PDFs especiales para orina y heces
--
