-- =====================================================================
-- 005 — Módulo clientes: niveles de fidelidad, clientes, teléfonos y
--       consentimiento de términos y condiciones
-- =====================================================================

-- Escala de niveles (RN-08) y descuento de cada nivel (RN-09), editable por
-- el administrador (aprobado #10). El nivel de un cliente NO se guarda: es el
-- mayor nivel cuyo mínimo de compras no supera su num_compras.
CREATE TABLE clientes.nivel_fidelidad (
    nivel                 SMALLINT      PRIMARY KEY,
    compras_minimas       INTEGER       NOT NULL,
    porcentaje_descuento  NUMERIC(5,2)  NOT NULL DEFAULT 0,
    CONSTRAINT ux_nivel_compras_minimas UNIQUE (compras_minimas),
    CONSTRAINT ck_nivel_positivo        CHECK (nivel > 0),
    CONSTRAINT ck_nivel_compras         CHECK (compras_minimas >= 0),
    CONSTRAINT ck_nivel_descuento       CHECK (porcentaje_descuento BETWEEN 0 AND 100)
);

-- RF-33: datos del cliente. Un cliente puede no tener cuenta para iniciar
-- sesión (usuario_id NULL): así se registran compradores de otros canales
-- (RF-17) y clientes importados con su historial (RF-60).
CREATE TABLE clientes.cliente (
    id              BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id      BIGINT        UNIQUE REFERENCES admin.usuario (id),
    nombre          VARCHAR(150)  NOT NULL,
    correo          VARCHAR(255)  NOT NULL,   -- correo de contacto; puede diferir del de la cuenta
    tipo_cedula     VARCHAR(10)   NOT NULL,
    cedula          VARCHAR(20)   NOT NULL,   -- obligatoria: la factura la exige (RN-18)
    direccion       TEXT,
    num_compras     INTEGER       NOT NULL DEFAULT 0,   -- RF-34
    creado_en       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_cliente_tipo_cedula CHECK (tipo_cedula IN ('fisica', 'juridica')),
    CONSTRAINT ck_cliente_cedula      CHECK (btrim(cedula) <> ''),
    CONSTRAINT ck_cliente_correo      CHECK (correo LIKE '%_@_%'),
    CONSTRAINT ck_cliente_num_compras CHECK (num_compras >= 0)
);
CREATE UNIQUE INDEX ux_cliente_correo ON clientes.cliente (lower(correo));
CREATE UNIQUE INDEX ux_cliente_cedula ON clientes.cliente (cedula);

CREATE TRIGGER tg_cliente_actualizado_en
    BEFORE UPDATE ON clientes.cliente
    FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();

-- Atributo multivaluado "Teléfonos" del EER
CREATE TABLE clientes.cliente_telefono (
    cliente_id  BIGINT       NOT NULL REFERENCES clientes.cliente (id) ON DELETE CASCADE,
    telefono    VARCHAR(20)  NOT NULL,
    PRIMARY KEY (cliente_id, telefono)
);

-- RF-38: la aceptación de términos se registra con su fecha. Puede darse al
-- crear la cuenta (usuario) o en la primera compra (cliente). Solo inserción.
CREATE TABLE clientes.consentimiento_terminos (
    id                BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id        BIGINT       REFERENCES admin.usuario (id),
    cliente_id        BIGINT       REFERENCES clientes.cliente (id),
    version_terminos  VARCHAR(20)  NOT NULL,
    aceptado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_consentimiento_titular CHECK (usuario_id IS NOT NULL OR cliente_id IS NOT NULL)
);
CREATE INDEX ix_consentimiento_usuario ON clientes.consentimiento_terminos (usuario_id);
CREATE INDEX ix_consentimiento_cliente ON clientes.consentimiento_terminos (cliente_id);

CREATE TRIGGER tg_consentimiento_solo_insercion
    BEFORE UPDATE OR DELETE ON clientes.consentimiento_terminos
    FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();
