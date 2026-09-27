-- Funciones de apoyo para las pruebas. `npm run db:test` las carga antes de
-- cada archivo, dentro de la misma transacción, y al final revierte todo:
-- las pruebas nunca dejan datos en la BD. Funcionan con o sin datos de prueba.

-- La instrucción debe fallar con el código de error indicado
--   23505 unicidad · 23514 CHECK · 23503 llave foránea · 23001 solo inserción
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

CREATE FUNCTION pg_temp.subcategoria_prueba() RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
    v_categoria    integer;
    v_subcategoria integer;
BEGIN
    SELECT s.id INTO v_subcategoria
    FROM   catalogo.subcategoria s
    JOIN   catalogo.categoria    c ON c.id = s.categoria_id
    WHERE  c.nombre = 'Categoría de prueba';

    IF v_subcategoria IS NULL THEN
        INSERT INTO catalogo.categoria (nombre) VALUES ('Categoría de prueba')
        RETURNING id INTO v_categoria;
        INSERT INTO catalogo.subcategoria (categoria_id, nombre) VALUES (v_categoria, 'Subcategoría de prueba')
        RETURNING id INTO v_subcategoria;
    END IF;
    RETURN v_subcategoria;
END;
$$;

CREATE FUNCTION pg_temp.producto_prueba(p_sku text, p_existencias integer DEFAULT 0) RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE
    v_producto bigint;
BEGIN
    INSERT INTO catalogo.producto (sku, nombre, subcategoria_id, costo_item)
    VALUES (p_sku, 'Producto ' || p_sku, pg_temp.subcategoria_prueba(), 1000)
    RETURNING id INTO v_producto;
    INSERT INTO inventario.existencia (producto_id, cantidad) VALUES (v_producto, p_existencias);
    RETURN v_producto;
END;
$$;

-- Devuelve el administrador existente o crea uno (RF-49 permite solo uno)
CREATE FUNCTION pg_temp.admin_prueba() RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE
    v_admin bigint := (SELECT id FROM admin.usuario WHERE rol = 'administrador');
BEGIN
    IF v_admin IS NULL THEN
        INSERT INTO admin.usuario (correo, contrasena_hash, nombre, rol)
        VALUES ('admin.prueba@prueba.test', 'x', 'Admin de prueba', 'administrador')
        RETURNING id INTO v_admin;
    END IF;
    RETURN v_admin;
END;
$$;

CREATE FUNCTION pg_temp.usuario_cliente_prueba() RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE
    v_usuario bigint := (SELECT id FROM admin.usuario WHERE correo = 'usuario.prueba@prueba.test');
BEGIN
    IF v_usuario IS NULL THEN
        INSERT INTO admin.usuario (correo, contrasena_hash, nombre, rol)
        VALUES ('usuario.prueba@prueba.test', 'x', 'Usuario de prueba', 'cliente')
        RETURNING id INTO v_usuario;
    END IF;
    RETURN v_usuario;
END;
$$;

CREATE FUNCTION pg_temp.cliente_prueba() RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE
    v_cliente bigint := (SELECT id FROM clientes.cliente WHERE correo = 'cliente.prueba@prueba.test');
BEGIN
    IF v_cliente IS NULL THEN
        INSERT INTO clientes.cliente (nombre, correo, tipo_cedula, cedula)
        VALUES ('Cliente de prueba', 'cliente.prueba@prueba.test', 'fisica', '9-9999-9999')
        RETURNING id INTO v_cliente;
    END IF;
    RETURN v_cliente;
END;
$$;

-- Venta presencial mínima, útil como pedido de referencia
CREATE FUNCTION pg_temp.pedido_prueba() RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE
    v_pedido bigint;
BEGIN
    INSERT INTO pedidos.pedido (canal, cliente_id, registrado_por, subtotal, impuesto, total)
    VALUES ('presencial', pg_temp.cliente_prueba(), pg_temp.admin_prueba(), 0, 0, 0)
    RETURNING id INTO v_pedido;
    RETURN v_pedido;
END;
$$;
