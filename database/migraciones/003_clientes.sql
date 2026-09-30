-- =====================================================================
-- 003 — Módulo clientes: CLIENTE y CLIENTE_TELEFONO
--
-- Mapeo:
--   CLIENTE          (PK/FK Correo_usuario → USUARIO.Correo,
--                     Cedula, Direccion, NumCompras)
--   CLIENTE_TELEFONO (PK/FK Correo_usuario, PK Telefono)
--
-- "Datos de contacto" es un atributo compuesto de Cliente: su parte simple
-- (Dirección) queda en CLIENTE y su parte multivaluada (Teléfonos) en
-- CLIENTE_TELEFONO. "Fidelidad" es un atributo derivado de NumCompras y no
-- se guarda.
-- =====================================================================

CREATE TABLE clientes.cliente (
    correo_usuario  VARCHAR(255)  PRIMARY KEY
        REFERENCES admin.usuario (correo) ON UPDATE CASCADE ON DELETE CASCADE,
    cedula          VARCHAR(20)   NOT NULL,   -- la factura la exige (RN-18)
    direccion       TEXT,
    num_compras     INTEGER       NOT NULL DEFAULT 0,   -- RF-34
    CONSTRAINT ux_cliente_cedula      UNIQUE (cedula),
    CONSTRAINT ck_cliente_cedula      CHECK (btrim(cedula) <> ''),
    CONSTRAINT ck_cliente_num_compras CHECK (num_compras >= 0)
);

-- Atributo multivaluado "Teléfonos" del EER. Es un atributo de Cliente, así
-- que la llave foránea apunta a CLIENTE (que a su vez es USUARIO).
CREATE TABLE clientes.cliente_telefono (
    correo_usuario  VARCHAR(255)  NOT NULL
        REFERENCES clientes.cliente (correo_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    telefono        VARCHAR(20)   NOT NULL,
    PRIMARY KEY (correo_usuario, telefono),
    CONSTRAINT ck_cliente_telefono CHECK (btrim(telefono) <> '')
);

-- Especialización disjunta (la "O" del EER): un usuario es administrador o
-- cliente, nunca las dos cosas. Involucra dos tablas, por eso es un trigger
-- y no un CHECK. Usa el código de error de un CHECK (23514).
CREATE FUNCTION public.verificar_usuario_disjunto() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_ya_es_el_otro boolean;
BEGIN
    IF TG_TABLE_NAME = 'administrador' THEN
        SELECT EXISTS (SELECT 1 FROM clientes.cliente WHERE correo_usuario = NEW.correo_usuario)
        INTO v_ya_es_el_otro;
    ELSE
        SELECT EXISTS (SELECT 1 FROM admin.administrador WHERE correo_usuario = NEW.correo_usuario)
        INTO v_ya_es_el_otro;
    END IF;

    IF v_ya_es_el_otro THEN
        RAISE EXCEPTION 'El usuario % no puede ser administrador y cliente a la vez', NEW.correo_usuario
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_administrador_disjunto
    BEFORE INSERT OR UPDATE OF correo_usuario ON admin.administrador
    FOR EACH ROW EXECUTE FUNCTION public.verificar_usuario_disjunto();

CREATE TRIGGER tg_cliente_disjunto
    BEFORE INSERT OR UPDATE OF correo_usuario ON clientes.cliente
    FOR EACH ROW EXECUTE FUNCTION public.verificar_usuario_disjunto();
