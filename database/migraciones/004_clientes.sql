-- 004: crea las tablas CLIENTE y CLIENTE_TELEFONO.


-- Guarda la información propia de un cliente.
-- Todo cliente debe existir primero como usuario.
CREATE TABLE clientes.cliente (
    correo_usuario  VARCHAR(255)  PRIMARY KEY
        REFERENCES usuarios.usuario (correo) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
    cedula          VARCHAR(20)   NOT NULL,   
    direccion       TEXT,
    num_compras     INTEGER       NOT NULL DEFAULT 0, 

    CONSTRAINT ux_cliente_cedula      
        UNIQUE (cedula),
    CONSTRAINT ck_cliente_cedula      
        CHECK (btrim(cedula) <> ''),
    CONSTRAINT ck_cliente_num_compras 
        CHECK (num_compras >= 0)
);

-- Guarda los teléfonos de cada cliente.
-- Un cliente puede tener varios teléfonos (multivalor).
CREATE TABLE clientes.cliente_telefono (
    correo_usuario  VARCHAR(255)  NOT NULL
        REFERENCES clientes.cliente (correo_usuario) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
    telefono        VARCHAR(20)   NOT NULL,

    PRIMARY KEY (correo_usuario, telefono),
    CONSTRAINT ck_cliente_telefono 
        CHECK (btrim(telefono) <> '')
);

-- Evita que un mismo usuario sea cliente y administrador al mismo tiempo.
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

-- Aplica la validación al crear o cambiar un administrador.
CREATE TRIGGER tg_administrador_disjunto
    BEFORE INSERT OR UPDATE OF correo_usuario ON admin.administrador
    FOR EACH ROW EXECUTE FUNCTION public.verificar_usuario_disjunto();

-- Aplica la validación al crear o cambiar un cliente.
CREATE TRIGGER tg_cliente_disjunto
    BEFORE INSERT OR UPDATE OF correo_usuario ON clientes.cliente
    FOR EACH ROW EXECUTE FUNCTION public.verificar_usuario_disjunto();
