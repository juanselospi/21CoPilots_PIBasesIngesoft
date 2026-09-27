-- =====================================================================
-- 004 — Módulo inventario: existencias y libro de movimientos
--
-- Inventario único y compartido entre todos los canales (RES-07, RN-05).
-- existencia guarda el saldo y es la fila que se bloquea con FOR UPDATE
-- (§ 7.3); movimiento explica cómo se llegó a ese saldo. El servicio de
-- inventario escribe ambas en la misma transacción.
-- =====================================================================

CREATE TABLE inventario.existencia (
    producto_id     BIGINT       PRIMARY KEY REFERENCES catalogo.producto (id),
    cantidad        INTEGER      NOT NULL DEFAULT 0,
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- Segunda línea de defensa de RN-13: la primera es el servicio.
    -- Las unidades en contrapedido no descuentan existencias
    -- (ver pedidos.linea_pedido.cantidad_contrapedido).
    CONSTRAINT ck_existencia_no_negativa CHECK (cantidad >= 0)
);

CREATE TRIGGER tg_existencia_actualizado_en
    BEFORE UPDATE ON inventario.existencia
    FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();

-- RF-15, RF-19: historial consultable y no modificable de todo movimiento.
-- Las filas de ingreso conservan fecha y costo de compra: son el
-- histórico de costos de RN-06 y RF-14.
CREATE TABLE inventario.movimiento (
    id              BIGINT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    producto_id     BIGINT         NOT NULL REFERENCES catalogo.producto (id),
    tipo            VARCHAR(20)    NOT NULL,
    cantidad        INTEGER        NOT NULL,          -- con signo: positiva entra, negativa sale
    costo_unitario  NUMERIC(12,2),                    -- solo en ingresos y carga inicial
    motivo          TEXT,
    responsable_id  BIGINT         REFERENCES admin.usuario (id),
    pedido_id       BIGINT,                           -- llave foránea agregada en 006
    registrado_en   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT ck_movimiento_tipo CHECK (tipo IN (
        'carga_inicial',   -- importación del Excel (RF-57)
        'ingreso',         -- compra de mercancía (RF-13)
        'venta',           -- pedido confirmado, de cualquier canal (RF-30, RF-17)
        'cancelacion',     -- devolución de unidades al cancelar (RF-28)
        'ajuste',          -- merma, pérdida o corrección (RF-20)
        'reposicion'       -- reposición de producto defectuoso (RF-42)
    )),
    CONSTRAINT ck_movimiento_cantidad CHECK (cantidad <> 0),
    CONSTRAINT ck_movimiento_signo CHECK (
           (tipo IN ('carga_inicial', 'ingreso', 'cancelacion') AND cantidad > 0)
        OR (tipo IN ('venta', 'reposicion')                     AND cantidad < 0)
        OR  tipo = 'ajuste'
    ),
    -- RF-13, RF-14, RN-06: toda entrada de mercancía conserva su costo
    CONSTRAINT ck_movimiento_costo CHECK (
        (tipo IN ('carga_inicial', 'ingreso')) = (costo_unitario IS NOT NULL)
    ),
    CONSTRAINT ck_movimiento_costo_no_negativo CHECK (costo_unitario >= 0),
    -- RF-20: un ajuste exige motivo y usuario responsable
    CONSTRAINT ck_movimiento_ajuste CHECK (
        tipo <> 'ajuste'
        OR (btrim(coalesce(motivo, '')) <> '' AND responsable_id IS NOT NULL)
    ),
    -- Ventas y cancelaciones siempre vienen de un pedido; las entradas y los
    -- ajustes nunca. La reposición puede o no referirse a un pedido.
    CONSTRAINT ck_movimiento_con_pedido CHECK (
        tipo NOT IN ('venta', 'cancelacion') OR pedido_id IS NOT NULL
    ),
    CONSTRAINT ck_movimiento_sin_pedido CHECK (
        tipo NOT IN ('carga_inicial', 'ingreso', 'ajuste') OR pedido_id IS NULL
    )
);
CREATE INDEX ix_movimiento_producto ON inventario.movimiento (producto_id, registrado_en);
CREATE INDEX ix_movimiento_pedido   ON inventario.movimiento (pedido_id);

CREATE TRIGGER tg_movimiento_solo_insercion
    BEFORE UPDATE OR DELETE ON inventario.movimiento
    FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();
