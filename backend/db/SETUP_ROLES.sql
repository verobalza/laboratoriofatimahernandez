-- Tabla de permisos para el panel de roles
-- Ejecuta este script en la base de datos de Supabase.

create table if not exists roles_usuarios (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null references auth.users(id) on delete cascade,
    apartado text not null,
    permiso boolean not null default false,
    unique (usuario_id, apartado)
);
