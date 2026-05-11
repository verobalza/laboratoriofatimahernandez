-- Agrega la columna posicion a la tabla pruebas para preservar el orden de selección de un grupo
ALTER TABLE pruebas ADD COLUMN posicion INTEGER DEFAULT NULL;

-- Índice para optimizar consultas ordenadas por grupo y posición
CREATE INDEX IF NOT EXISTS idx_pruebas_grupo_posicion ON pruebas(grupo_id, posicion);
