-- 001: configuración inicial de la base de datos.
-- Crea los esquemas y funciones compartidas por otras migraciones.


-- Solo para generar hashes en las semillas; la app los genera en apps/server.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- Organiza las tablas por módulo dentro de la misma base de datos.
CREATE SCHEMA usuarios;      -- usuarios y sus sesiones
CREATE SCHEMA admin;
CREATE SCHEMA clientes;      -- clientes y sus teléfonos
CREATE SCHEMA catalogo;      -- productos
CREATE SCHEMA inventario;    -- registro de mercancía
CREATE SCHEMA pedidos;       -- carritos, líneas del carrito, ofertas, pedidos e historial
CREATE SCHEMA pagos;
CREATE SCHEMA facturacion;   -- facturas
CREATE SCHEMA reportes;      -- solo vistas de lectura

-- Actualiza automáticamente fecha_actualizacion cuando una fila cambia
CREATE FUNCTION public.fijar_fecha_actualizacion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.fecha_actualizacion := now();
    RETURN NEW;
END;
$$;

-- Hace de solo inserción las tablas de historial.
-- Deja pasar los UPDATE que vienen de un ON UPDATE CASCADE.
CREATE FUNCTION public.rechazar_modificacion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'La tabla %.% es de solo inserción: no admite %',
        TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP
        USING ERRCODE = 'restrict_violation';
END;
$$;