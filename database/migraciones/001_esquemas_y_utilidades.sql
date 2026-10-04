-- 001: configuración inicial de la base de datos.
-- Crea los esquemas y funciones compartidas por otras migraciones.


-- Permite generar hashes en las semillas de desarrollo.
-- La aplicación genera los hashes normalmente desde apps/server.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- Organiza las tablas por módulo dentro de la misma base de datos.
CREATE SCHEMA admin;         -- usuarios y administrador
CREATE SCHEMA clientes;      -- clientes y sus teléfonos
CREATE SCHEMA catalogo;      -- productos
CREATE SCHEMA inventario;    -- registro de mercancía que administra el administrador
CREATE SCHEMA pedidos;       -- carritos, líneas del carrito, ofertas, pedidos e historial
CREATE SCHEMA pagos;         -- pagos
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

-- Impide modificar o eliminar registros de tablas usadas como historial.
-- Los cambios producidos automáticamente por ON UPDATE CASCADE sí se permiten.
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