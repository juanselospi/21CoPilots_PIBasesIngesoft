-- =====================================================================
-- 005 — Módulo inventario: PRODUCTO_ADMINISTRA
--
-- Mapeo:
--   PRODUCTO_ADMINISTRA (PK/FK SKU → PRODUCTO.SKU,
--                        PK/FK Correo_administrador → ADMINISTRADOR.Correo_usuario,
--                        PK Fecha, Cantidad)
--
-- Relación "Administrar" (N:M) entre Producto y Administrador: cada vez que
-- el administrador registra mercancía queda la fecha y la cantidad (RF-13).
-- El saldo vigente vive en catalogo.producto.stock; el servicio de
-- inventario escribe ambos en la misma transacción.
-- =====================================================================

CREATE TABLE inventario.producto_administra (
    sku                   VARCHAR(50)   NOT NULL
        REFERENCES catalogo.producto (sku) ON UPDATE CASCADE,
    correo_administrador  VARCHAR(255)  NOT NULL
        REFERENCES admin.administrador (correo_usuario) ON UPDATE CASCADE,
    fecha                 TIMESTAMPTZ   NOT NULL DEFAULT now(),
    cantidad              INTEGER       NOT NULL,   -- con signo: positiva entra, negativa sale
    PRIMARY KEY (sku, correo_administrador, fecha),
    CONSTRAINT ck_producto_administra_cantidad CHECK (cantidad <> 0)
);
CREATE INDEX ix_producto_administra_administrador
    ON inventario.producto_administra (correo_administrador);

-- RF-19: el registro de mercancía es historial y no se modifica
CREATE TRIGGER tg_producto_administra_solo_insercion
    BEFORE UPDATE OR DELETE ON inventario.producto_administra
    FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();
