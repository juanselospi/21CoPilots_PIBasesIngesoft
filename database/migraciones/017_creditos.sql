-- =====================================================================
-- 017 — créditos a favor del cliente
-- Historia/tarea: SCRUM-95
-- Justificación: modelo-datos.md § 4, C-22
-- =====================================================================

-- Al quitar un producto de un pedido ya pagado no se devuelve dinero: se le
-- otorga al cliente un crédito a favor (requerimientos-profesor.md § 6).
-- Solo inserción: un crédito otorgado no se edita ni se borra.
-- Llave (correo_cliente, fecha), como la bitácora; clock_timestamp() evita
-- que dos créditos del mismo cliente en una transacción choquen.
CREATE TABLE clientes.credito (
    correo_cliente      VARCHAR(255)   NOT NULL
        REFERENCES clientes.cliente (correo_usuario) ON UPDATE CASCADE,
    fecha               TIMESTAMPTZ    NOT NULL DEFAULT clock_timestamp(),
    monto               NUMERIC(12,2)  NOT NULL,
    motivo              TEXT           NOT NULL,
    -- Pedido que lo originó, si hay uno. Usa el mismo correo, así que solo
    -- puede ser un pedido del mismo cliente.
    num_carrito_pedido  INTEGER,

    PRIMARY KEY (correo_cliente, fecha),

    FOREIGN KEY (correo_cliente, num_carrito_pedido)
        REFERENCES pedidos.pedido (correo_cliente, num_carrito) ON UPDATE CASCADE,

    CONSTRAINT ck_credito_monto
        CHECK (monto > 0),
    CONSTRAINT ck_credito_motivo
        CHECK (btrim(motivo) <> '')
);

CREATE INDEX ix_credito_pedido ON clientes.credito (correo_cliente, num_carrito_pedido);

CREATE TRIGGER tg_credito_solo_insercion
    BEFORE UPDATE OR DELETE ON clientes.credito
    FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();

-- El crédito se usa como un pago más del pedido, con método 'credito'. Si no
-- alcanza, la diferencia se cobra en otro pago con otro método.
ALTER TABLE pagos.pago
    DROP CONSTRAINT ck_pago_metodo,
    ADD CONSTRAINT ck_pago_metodo CHECK (
        metodo_pago IN ('tarjeta', 'sinpe_movil', 'efectivo', 'datafono',
                        'contra_entrega', 'credito')
    );

-- Saldo de cada cliente: lo otorgado menos lo usado en pagos no rechazados.
-- El saldo no se guarda en una columna, porque credito es de solo inserción.
CREATE VIEW reportes.v_saldo_credito AS
SELECT c.correo_cliente,
       c.otorgado,
       coalesce(u.usado, 0)               AS usado,
       c.otorgado - coalesce(u.usado, 0)  AS saldo
FROM   (SELECT correo_cliente, sum(monto) AS otorgado
        FROM   clientes.credito
        GROUP  BY correo_cliente) c
LEFT   JOIN (SELECT correo_cliente, sum(monto) AS usado
             FROM   pagos.pago
             WHERE  metodo_pago = 'credito' AND estado_pago <> 'rechazado'
             GROUP  BY correo_cliente) u
       ON u.correo_cliente = c.correo_cliente;

-- Un pago con crédito no puede pasar del saldo (el saldo nunca queda negativo).
-- Bloquea la fila del cliente para que dos pagos simultáneos no gasten el
-- mismo saldo.
CREATE FUNCTION pagos.verificar_saldo_credito() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_saldo NUMERIC(12,2);
BEGIN
    IF NEW.metodo_pago <> 'credito' OR NEW.estado_pago = 'rechazado' THEN
        RETURN NEW;
    END IF;

    PERFORM 1 FROM clientes.cliente
    WHERE correo_usuario = NEW.correo_cliente FOR UPDATE;

    SELECT coalesce((SELECT sum(monto) FROM clientes.credito
                     WHERE correo_cliente = NEW.correo_cliente), 0)
         - coalesce((SELECT sum(monto) FROM pagos.pago
                     WHERE correo_cliente = NEW.correo_cliente
                       AND metodo_pago = 'credito'
                       AND estado_pago <> 'rechazado'
                       -- al editar un pago, no se cuenta su valor anterior
                       AND (TG_OP = 'INSERT' OR num_referencia <> OLD.num_referencia)), 0)
    INTO v_saldo;

    IF NEW.monto > v_saldo THEN
        RAISE EXCEPTION 'El cliente % tiene % de saldo a favor y el pago es de %',
            NEW.correo_cliente, v_saldo, NEW.monto
            USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_pago_saldo_credito';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_pago_saldo_credito
    BEFORE INSERT OR UPDATE OF monto, metodo_pago, estado_pago, correo_cliente
    ON pagos.pago
    FOR EACH ROW EXECUTE FUNCTION pagos.verificar_saldo_credito();
