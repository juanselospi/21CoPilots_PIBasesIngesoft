-- Funciones de apoyo para las pruebas. `npm run db:test` las carga antes de
-- cada archivo, dentro de la misma transacción, y al final revierte todo:
-- las pruebas nunca dejan datos en la BD. Funcionan con o sin datos de prueba.

-- La instrucción debe fallar con el código de error indicado
--   23505 unicidad · 23514 CHECK · 23503 llave foránea · 23001 solo inserción
--   428C9 columna generada
CREATE FUNCTION pg_temp.debe_fallar(p_prueba text, p_sql text, p_codigo text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        EXECUTE p_sql;
    EXCEPTION WHEN OTHERS THEN
        IF SQLSTATE <> p_codigo THEN
            RAISE EXCEPTION '✖ %: se esperaba el error %, pero ocurrió % (%)',
                p_prueba, p_codigo, SQLSTATE, SQLERRM;
        END IF;
        RAISE NOTICE '✔ %', p_prueba;
        RETURN;
    END;
    RAISE EXCEPTION '✖ %: se esperaba el error %, pero la instrucción se aceptó', p_prueba, p_codigo;
END;
$$;

-- La instrucción debe ejecutarse sin error
CREATE FUNCTION pg_temp.debe_funcionar(p_prueba text, p_sql text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE p_sql;
    RAISE NOTICE '✔ %', p_prueba;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '✖ %: se esperaba éxito, pero ocurrió % (%)', p_prueba, SQLSTATE, SQLERRM;
END;
$$;

-- La condición debe ser verdadera
CREATE FUNCTION pg_temp.debe_cumplirse(p_prueba text, p_condicion boolean) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    IF p_condicion IS NOT TRUE THEN
        RAISE EXCEPTION '✖ %: la condición no se cumple', p_prueba;
    END IF;
    RAISE NOTICE '✔ %', p_prueba;
END;
$$;

-- ---------------------------------------------------------------------
-- Datos mínimos para las pruebas
-- ---------------------------------------------------------------------

CREATE FUNCTION pg_temp.producto_prueba(p_sku text, p_stock integer DEFAULT 0) RETURNS text
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO catalogo.producto (sku, nombre, categoria, item, stock)
    VALUES (p_sku, 'Producto ' || p_sku, 'Categoría de prueba', 1000, p_stock);
    RETURN p_sku;
END;
$$;

-- Devuelve el correo del administrador existente o crea uno (RF-49 permite solo uno)
CREATE FUNCTION pg_temp.admin_prueba() RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
    v_admin text := (SELECT correo_usuario FROM admin.administrador);
BEGIN
    IF v_admin IS NULL THEN
        v_admin := 'admin.prueba@prueba.test';
        INSERT INTO usuarios.usuario (correo, contrasena, nombre) VALUES (v_admin, 'x', 'Admin de prueba');
        INSERT INTO admin.administrador (correo_usuario) VALUES (v_admin);
    END IF;
    RETURN v_admin;
END;
$$;

-- Crea (una sola vez) un usuario cliente y devuelve su correo
CREATE FUNCTION pg_temp.cliente_prueba() RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
    v_correo text := 'cliente.prueba@prueba.test';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM clientes.cliente WHERE correo_usuario = v_correo) THEN
        INSERT INTO usuarios.usuario (correo, contrasena, nombre) VALUES (v_correo, 'x', 'Cliente de prueba');
        INSERT INTO clientes.cliente (correo_usuario, cedula) VALUES (v_correo, '9-9999-9999');
    END IF;
    RETURN v_correo;
END;
$$;

-- Carrito convertido del cliente de prueba con una línea, y su pedido.
-- Devuelve el número de carrito (la llave es cliente_prueba() + ese número).
CREATE FUNCTION pg_temp.pedido_prueba() RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
    v_cliente text    := pg_temp.cliente_prueba();
    v_num     integer := (SELECT coalesce(max(num_carrito), 0) + 1
                          FROM pedidos.carrito WHERE correo_cliente = v_cliente);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM catalogo.producto WHERE sku = 'PRB-AYU') THEN
        PERFORM pg_temp.producto_prueba('PRB-AYU', 10);
    END IF;
    INSERT INTO pedidos.carrito (correo_cliente, num_carrito, estado_carrito, fecha_cierre)
    VALUES (v_cliente, v_num, 'convertido', now());
    INSERT INTO pedidos.agrega (correo_cliente, num_carrito, sku, cantidad_solicitada,
                                precio_unitario, tasa_impuesto_aplicada)
    VALUES (v_cliente, v_num, 'PRB-AYU', 1, 1500, 13);
    INSERT INTO pedidos.pedido (correo_cliente, num_carrito, modalidad_entrega)
    VALUES (v_cliente, v_num, 'entrega_personal');
    RETURN v_num;
END;
$$;
