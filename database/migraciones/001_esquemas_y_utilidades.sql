-- =====================================================================
-- 001 — Esquemas por módulo y funciones técnicas compartidas
--
-- Esta versión de la base de datos sigue al pie de la letra el EER y el
-- mapeo del equipo (EER 21 CoPilots.drawio): llaves naturales (correo, SKU,
-- número de referencia, número de factura) y entidades débiles (carrito,
-- pedido, historial de estado).
--
-- Se conserva un esquema de PostgreSQL por módulo de apps/server (DD-11):
-- solo el repositorio del módulo dueño escribe en su esquema. Las funciones
-- de este archivo son técnicas: no contienen reglas de negocio (DD-10).
-- =====================================================================

-- Hash bcrypt desde SQL. Solo lo usan las semillas de desarrollo;
-- en ejecución el hash lo genera apps/server.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA admin;         -- usuarios y administrador
CREATE SCHEMA clientes;      -- clientes y sus teléfonos
CREATE SCHEMA catalogo;      -- productos
CREATE SCHEMA inventario;    -- registro de mercancía que administra el administrador
CREATE SCHEMA pedidos;       -- carritos, líneas del carrito, ofertas, pedidos e historial
CREATE SCHEMA pagos;         -- pagos
CREATE SCHEMA facturacion;   -- facturas
CREATE SCHEMA reportes;      -- solo vistas de lectura

-- Mantiene la columna fecha_actualizacion en las tablas que la tienen.
CREATE FUNCTION public.fijar_fecha_actualizacion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.fecha_actualizacion := now();
    RETURN NEW;
END;
$$;

-- Rechaza UPDATE y DELETE en las tablas de solo inserción (RF-19, RF-26).
-- Se usa un trigger y no REVOKE porque en desarrollo la aplicación se conecta
-- como dueña de las tablas, y a la dueña un REVOKE no la detiene.
-- El código de error 23001 (restrict_violation) lo traduce apps/server.
--
-- Excepción: con llaves naturales, cambiar un correo o un SKU se propaga por
-- ON UPDATE CASCADE hasta estas tablas. Esa actualización la hace la llave
-- foránea (un trigger interno), así que llega con pg_trigger_depth() > 1 y se
-- deja pasar. Un UPDATE directo llega con profundidad 1 y se rechaza.
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
