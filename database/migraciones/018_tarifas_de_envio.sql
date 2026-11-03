-- 018: tarifas de envío por modalidad de entrega (RF-62, RN-16).
-- Decisión del 26/10/2026 (C-24): las tarifas viven en la base y no en .env.

-- Lo que cobra cada modalidad. El pedido copia el monto en costo_entrega al
-- confirmarse, así cambiar una tarifa no toca los pedidos que ya existen.
CREATE TABLE pedidos.tarifa_envio (
    modalidad  VARCHAR(20)    PRIMARY KEY,
    monto      NUMERIC(12,2)  NOT NULL DEFAULT 0,

    CONSTRAINT ck_tarifa_envio_modalidad
        CHECK (modalidad IN ('mensajero', 'uber_flash', 'correos_cr', 'entrega_personal')),

    CONSTRAINT ck_tarifa_envio_monto
        CHECK (monto >= 0)
);

-- Una fila por modalidad, en 0 hasta que el cliente defina los montos.
INSERT INTO pedidos.tarifa_envio (modalidad)
VALUES ('mensajero'), ('uber_flash'), ('correos_cr'), ('entrega_personal');
