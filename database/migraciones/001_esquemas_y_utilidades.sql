-- =====================================================================
-- 001 — Esquemas por módulo y funciones técnicas compartidas
--
-- Un esquema de PostgreSQL por cada módulo de apps/server/modules/ (DD-11).
-- Solo el repositorio del módulo dueño escribe en su esquema.
-- Las funciones de este archivo son técnicas: no contienen reglas de
-- negocio (DD-10). Ver documentos/diseño/arquitectura.md § 9.
-- =====================================================================

-- Hash bcrypt desde SQL. Solo lo usan las semillas de desarrollo;
-- en ejecución el hash lo genera apps/server.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA admin;         -- usuarios, roles, bitácora, parámetros de negocio
CREATE SCHEMA catalogo;      -- categorías, subcategorías, productos
CREATE SCHEMA inventario;    -- existencias y libro de movimientos
CREATE SCHEMA clientes;      -- clientes, niveles de fidelidad, consentimientos
CREATE SCHEMA pedidos;       -- carritos, pedidos, líneas, historial de estados
CREATE SCHEMA pagos;         -- intentos de cobro
CREATE SCHEMA facturacion;   -- facturas
CREATE SCHEMA reportes;      -- solo vistas de lectura

-- Mantiene la columna actualizado_en en las tablas que la tienen.
CREATE FUNCTION public.fijar_actualizado_en() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.actualizado_en := now();
    RETURN NEW;
END;
$$;

-- Rechaza UPDATE y DELETE en las tablas de solo inserción (RF-19, RN-06, RF-52).
-- Se usa un trigger y no REVOKE porque en desarrollo la aplicación se conecta
-- como dueña de las tablas, y a la dueña un REVOKE no la detiene.
-- El código de error 23001 (restrict_violation) lo traduce apps/server.
CREATE FUNCTION public.rechazar_modificacion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'La tabla %.% es de solo inserción: no admite %',
        TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP
        USING ERRCODE = 'restrict_violation';
END;
$$;
