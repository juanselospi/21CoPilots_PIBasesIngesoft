-- =====================================================================
-- 002 — Módulo admin: usuarios y roles, recuperación de contraseña,
--       bitácora de auditoría y parámetros de negocio editables
-- =====================================================================

-- Cuentas para iniciar sesión (RF-50, RF-53). El correo NO es la llave:
-- puede cambiar sin arrastrar llaves foráneas y no se expone como identificador.
CREATE TABLE admin.usuario (
    id               BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    correo           VARCHAR(255) NOT NULL,
    contrasena_hash  VARCHAR(255) NOT NULL,   -- hash bcrypt, nunca texto plano (RNF-08)
    nombre           VARCHAR(150) NOT NULL,
    rol              VARCHAR(20)  NOT NULL,
    activo           BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_usuario_rol    CHECK (rol IN ('administrador', 'cliente')),
    CONSTRAINT ck_usuario_correo CHECK (correo LIKE '%_@_%')
);
CREATE UNIQUE INDEX ux_usuario_correo ON admin.usuario (lower(correo));

-- RF-49: existe una única cuenta de administrador.
-- Si el cliente aprueba cuentas para empleados, esta restricción se elimina
-- en una migración nueva.
CREATE UNIQUE INDEX ux_usuario_administrador_unico
    ON admin.usuario (rol) WHERE rol = 'administrador';

CREATE TRIGGER tg_usuario_actualizado_en
    BEFORE UPDATE ON admin.usuario
    FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();

-- RF-54: enlace de restablecimiento de un solo uso y con vencimiento.
-- Se guarda el hash del token; el token en claro solo viaja en el enlace.
CREATE TABLE admin.recuperacion_contrasena (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  BIGINT       NOT NULL REFERENCES admin.usuario (id) ON DELETE CASCADE,
    token_hash  VARCHAR(128) NOT NULL UNIQUE,
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    vence_en    TIMESTAMPTZ  NOT NULL,
    usado_en    TIMESTAMPTZ,
    CONSTRAINT ck_recuperacion_vigencia CHECK (vence_en > creado_en)
);
CREATE INDEX ix_recuperacion_usuario ON admin.recuperacion_contrasena (usuario_id);

-- RF-52 y RNF-10: bitácora de operaciones sensibles e intentos de acceso
-- no autorizados. Solo inserción.
CREATE TABLE admin.bitacora (
    id              BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id      BIGINT       REFERENCES admin.usuario (id),   -- NULL: intento anónimo
    accion          VARCHAR(50)  NOT NULL,                       -- p. ej. cambio_margen, acceso_denegado
    entidad         VARCHAR(50),                                 -- p. ej. producto, pedido
    entidad_id      VARCHAR(100),
    valor_anterior  JSONB,
    valor_nuevo     JSONB,
    registrado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_bitacora_usuario ON admin.bitacora (usuario_id);
CREATE INDEX ix_bitacora_fecha   ON admin.bitacora (registrado_en);

CREATE TRIGGER tg_bitacora_solo_insercion
    BEFORE UPDATE OR DELETE ON admin.bitacora
    FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();

-- Valores de negocio que el administrador puede editar sin cambiar el código
-- (aprobado #10, DD-14). El servidor interpreta el tipo de cada clave.
-- La escala de niveles no vive aquí: tiene su propia tabla (clientes.nivel_fidelidad).
CREATE TABLE admin.parametro_negocio (
    clave            VARCHAR(60)  PRIMARY KEY,
    valor            TEXT         NOT NULL,
    descripcion      TEXT         NOT NULL,
    actualizado_por  BIGINT       REFERENCES admin.usuario (id),
    actualizado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER tg_parametro_actualizado_en
    BEFORE UPDATE ON admin.parametro_negocio
    FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();
