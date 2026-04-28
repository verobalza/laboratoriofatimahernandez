/**
 * SETUP_UNIDADES_TIPOS_MUESTRA.sql
 * 
 * Script para crear las tablas unidades_medida y tipos_muestra en Supabase.
 * 
 * INSTRUCCIONES:
 * 1. Abre Supabase Console: https://app.supabase.com
 * 2. Ve a SQL Editor
 * 3. Crea una nueva consulta (New Query)
 * 4. Copia y pega este contenido completo
 * 5. Ejecuta (Run) 
 * 
 * Si necesitas revertir, ejecuta el script CLEANUP al final de este archivo.
 */

-- ========================================================
-- 1. TABLA: unidades_medida
-- ========================================================
CREATE TABLE IF NOT EXISTS public.unidades_medida (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unidades_medida_pkey PRIMARY KEY (id),
  CONSTRAINT unidades_medida_nombre_key UNIQUE (nombre)
) TABLESPACE pg_default;

-- Comentarios de tabla
COMMENT ON TABLE public.unidades_medida IS 'Unidades de medida para pruebas de laboratorio (ej: mg/dL, U/L, g/dL)';
COMMENT ON COLUMN public.unidades_medida.id IS 'ID único de la unidad';
COMMENT ON COLUMN public.unidades_medida.nombre IS 'Nombre de la unidad (ej: mg/dL)';
COMMENT ON COLUMN public.unidades_medida.creado_en IS 'Fecha de creación';
COMMENT ON COLUMN public.unidades_medida.actualizado_en IS 'Fecha de última actualización';

-- Índices
CREATE INDEX IF NOT EXISTS idx_unidades_medida_nombre 
ON public.unidades_medida(nombre);

-- Row Level Security (RLS)
ALTER TABLE public.unidades_medida ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer unidades de medida
CREATE POLICY "Lectura pública de unidades_medida"
ON public.unidades_medida
FOR SELECT
USING (true);

-- Política: Solo usuarios autenticados pueden crear
CREATE POLICY "Crear unidades_medida si está autenticado"
ON public.unidades_medida
FOR INSERT
WITH CHECK (
  auth.role() IS NOT NULL
);

-- Política: Solo usuarios autenticados pueden actualizar
CREATE POLICY "Actualizar unidades_medida si está autenticado"
ON public.unidades_medida
FOR UPDATE
USING (
  auth.role() IS NOT NULL
);

-- Política: Solo usuarios autenticados pueden eliminar
CREATE POLICY "Eliminar unidades_medida si está autenticado"
ON public.unidades_medida
FOR DELETE
USING (
  auth.role() IS NOT NULL
);


-- ========================================================
-- 2. TABLA: tipos_muestra
-- ========================================================
CREATE TABLE IF NOT EXISTS public.tipos_muestra (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT tipos_muestra_pkey PRIMARY KEY (id),
  CONSTRAINT tipos_muestra_nombre_key UNIQUE (nombre)
) TABLESPACE pg_default;

-- Comentarios de tabla
COMMENT ON TABLE public.tipos_muestra IS 'Tipos de muestras para pruebas de laboratorio (ej: Sangre, Orina, Heces, LCR)';
COMMENT ON COLUMN public.tipos_muestra.id IS 'ID único del tipo de muestra';
COMMENT ON COLUMN public.tipos_muestra.nombre IS 'Nombre del tipo (ej: Sangre, Orina)';
COMMENT ON COLUMN public.tipos_muestra.creado_en IS 'Fecha de creación';
COMMENT ON COLUMN public.tipos_muestra.actualizado_en IS 'Fecha de última actualización';

-- Índices
CREATE INDEX IF NOT EXISTS idx_tipos_muestra_nombre 
ON public.tipos_muestra(nombre);

-- Row Level Security (RLS)
ALTER TABLE public.tipos_muestra ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer tipos de muestra
CREATE POLICY "Lectura pública de tipos_muestra"
ON public.tipos_muestra
FOR SELECT
USING (true);

-- Política: Solo usuarios autenticados pueden crear
CREATE POLICY "Crear tipos_muestra si está autenticado"
ON public.tipos_muestra
FOR INSERT
WITH CHECK (
  auth.role() IS NOT NULL
);

-- Política: Solo usuarios autenticados pueden actualizar
CREATE POLICY "Actualizar tipos_muestra si está autenticado"
ON public.tipos_muestra
FOR UPDATE
USING (
  auth.role() IS NOT NULL
);

-- Política: Solo usuarios autenticados pueden eliminar
CREATE POLICY "Eliminar tipos_muestra si está autenticado"
ON public.tipos_muestra
FOR DELETE
USING (
  auth.role() IS NOT NULL
);


-- ========================================================
-- 3. DATOS INICIALES (OPCIONAL)
-- ========================================================
-- Descomenta esta sección si deseas cargar datos iniciales

-- Unidades de medida iniciales
INSERT INTO public.unidades_medida (nombre) VALUES
  ('g/dL'),
  ('mg/dL'),
  ('U/L'),
  ('mmol/L'),
  ('µIU/mL'),
  ('ng/dL'),
  ('pg/mL'),
  ('nmol/L'),
  ('%'),
  ('células/µL'),
  ('K/µL'),
  ('mg/24h'),
  ('segundos')
ON CONFLICT (nombre) DO NOTHING;

-- Tipos de muestra iniciales
INSERT INTO public.tipos_muestra (nombre) VALUES
  ('Sangre'),
  ('Orina'),
  ('Heces'),
  ('LCR'),
  ('Saliva'),
  ('Plasma'),
  ('Suero'),
  ('Cabello')
ON CONFLICT (nombre) DO NOTHING;


-- ========================================================
-- 4. SCRIPT DE LIMPIEZA (DESCOMENTA SI NECESITAS REVERTIR)
-- ========================================================
/*
DROP TABLE IF EXISTS public.tipos_muestra CASCADE;
DROP TABLE IF EXISTS public.unidades_medida CASCADE;

-- Verificar que se eliminaron
SELECT COUNT(*) as unidades FROM public.unidades_medida;
SELECT COUNT(*) as tipos FROM public.tipos_muestra;
*/
