-- 019: datos fiscales del negocio para las facturas (RF-41, RN-18).
-- Decisión del 26/10/2026 (C-24): viven en la base y no en .env.

-- Una sola fila: quien emite las facturas. La columna "unica" solo puede ser
-- true y es la llave, así que no puede haber una segunda fila.
CREATE TABLE facturacion.emisor (
    unica            BOOLEAN       PRIMARY KEY DEFAULT TRUE,
    razon_social     VARCHAR(200)  NOT NULL,
    cedula_juridica  VARCHAR(20)   NOT NULL,
    direccion        TEXT          NOT NULL,

    CONSTRAINT ck_emisor_unica          CHECK (unica),
    CONSTRAINT ck_emisor_razon_social   CHECK (btrim(razon_social) <> ''),
    CONSTRAINT ck_emisor_cedula         CHECK (btrim(cedula_juridica) <> ''),
    CONSTRAINT ck_emisor_direccion      CHECK (btrim(direccion) <> '')
);

-- Hasta que el cliente dé su cédula jurídica y dirección fiscal.
INSERT INTO facturacion.emisor (razon_social, cedula_juridica, direccion)
VALUES ('DC Hobbies Cultura Geek', 'POR DEFINIR', 'POR DEFINIR');
