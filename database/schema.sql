-- =====================================================================
-- DDL completo de DC Hobbies Cultura Geek Online (PostgreSQL)
-- GENERADO AUTOMÁTICAMENTE con `npm run db:dump`. No lo edite a mano:
-- los cambios se hacen con migraciones en database/migraciones/.
-- =====================================================================
--
-- PostgreSQL database dump
--



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: admin; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA admin;


--
-- Name: catalogo; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA catalogo;


--
-- Name: clientes; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA clientes;


--
-- Name: facturacion; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA facturacion;


--
-- Name: inventario; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA inventario;


--
-- Name: pagos; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pagos;


--
-- Name: pedidos; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pedidos;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: reportes; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA reportes;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: fijar_actualizado_en(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fijar_actualizado_en() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.actualizado_en := now();
    RETURN NEW;
END;
$$;


--
-- Name: rechazar_modificacion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rechazar_modificacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'La tabla %.% es de solo inserción: no admite %',
        TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP
        USING ERRCODE = 'restrict_violation';
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bitacora; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.bitacora (
    id bigint NOT NULL,
    usuario_id bigint,
    accion character varying(50) NOT NULL,
    entidad character varying(50),
    entidad_id character varying(100),
    valor_anterior jsonb,
    valor_nuevo jsonb,
    registrado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bitacora_id_seq; Type: SEQUENCE; Schema: admin; Owner: -
--

ALTER TABLE admin.bitacora ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME admin.bitacora_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: parametro_negocio; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.parametro_negocio (
    clave character varying(60) NOT NULL,
    valor text NOT NULL,
    descripcion text NOT NULL,
    actualizado_por bigint,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: recuperacion_contrasena; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.recuperacion_contrasena (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    token_hash character varying(128) NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    vence_en timestamp with time zone NOT NULL,
    usado_en timestamp with time zone,
    CONSTRAINT ck_recuperacion_vigencia CHECK ((vence_en > creado_en))
);


--
-- Name: recuperacion_contrasena_id_seq; Type: SEQUENCE; Schema: admin; Owner: -
--

ALTER TABLE admin.recuperacion_contrasena ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME admin.recuperacion_contrasena_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuario; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.usuario (
    id bigint NOT NULL,
    correo character varying(255) NOT NULL,
    contrasena_hash character varying(255) NOT NULL,
    nombre character varying(150) NOT NULL,
    rol character varying(20) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_usuario_correo CHECK (((correo)::text ~~ '%_@_%'::text)),
    CONSTRAINT ck_usuario_rol CHECK (((rol)::text = ANY ((ARRAY['administrador'::character varying, 'cliente'::character varying])::text[])))
);


--
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: admin; Owner: -
--

ALTER TABLE admin.usuario ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME admin.usuario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: categoria; Type: TABLE; Schema: catalogo; Owner: -
--

CREATE TABLE catalogo.categoria (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    CONSTRAINT ck_categoria_nombre CHECK ((btrim((nombre)::text) <> ''::text))
);


--
-- Name: categoria_id_seq; Type: SEQUENCE; Schema: catalogo; Owner: -
--

ALTER TABLE catalogo.categoria ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME catalogo.categoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: producto; Type: TABLE; Schema: catalogo; Owner: -
--

CREATE TABLE catalogo.producto (
    id bigint NOT NULL,
    sku character varying(50) NOT NULL,
    nombre character varying(200) NOT NULL,
    descripcion text,
    subcategoria_id integer NOT NULL,
    proveedor character varying(150),
    imagen_url character varying(500),
    costo_item numeric(12,2) NOT NULL,
    porcentaje_importacion numeric(6,2) DEFAULT 0 NOT NULL,
    margen_ganancia numeric(6,2) DEFAULT 0 NOT NULL,
    admite_contrapedido boolean DEFAULT false NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    fecha_retiro date,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_producto_costo CHECK ((costo_item >= (0)::numeric)),
    CONSTRAINT ck_producto_estado CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'descontinuado'::character varying])::text[]))),
    CONSTRAINT ck_producto_importacion CHECK ((porcentaje_importacion >= (0)::numeric)),
    CONSTRAINT ck_producto_margen CHECK ((margen_ganancia > ('-100'::integer)::numeric)),
    CONSTRAINT ck_producto_sku_normalizado CHECK ((((sku)::text = upper(btrim((sku)::text))) AND ((sku)::text <> ''::text)))
);


--
-- Name: producto_id_seq; Type: SEQUENCE; Schema: catalogo; Owner: -
--

ALTER TABLE catalogo.producto ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME catalogo.producto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: subcategoria; Type: TABLE; Schema: catalogo; Owner: -
--

CREATE TABLE catalogo.subcategoria (
    id integer NOT NULL,
    categoria_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    CONSTRAINT ck_subcategoria_nombre CHECK ((btrim((nombre)::text) <> ''::text))
);


--
-- Name: subcategoria_id_seq; Type: SEQUENCE; Schema: catalogo; Owner: -
--

ALTER TABLE catalogo.subcategoria ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME catalogo.subcategoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cliente; Type: TABLE; Schema: clientes; Owner: -
--

CREATE TABLE clientes.cliente (
    id bigint NOT NULL,
    usuario_id bigint,
    nombre character varying(150) NOT NULL,
    correo character varying(255) NOT NULL,
    tipo_cedula character varying(10) NOT NULL,
    cedula character varying(20) NOT NULL,
    direccion text,
    num_compras integer DEFAULT 0 NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_cliente_cedula CHECK ((btrim((cedula)::text) <> ''::text)),
    CONSTRAINT ck_cliente_correo CHECK (((correo)::text ~~ '%_@_%'::text)),
    CONSTRAINT ck_cliente_num_compras CHECK ((num_compras >= 0)),
    CONSTRAINT ck_cliente_tipo_cedula CHECK (((tipo_cedula)::text = ANY ((ARRAY['fisica'::character varying, 'juridica'::character varying])::text[])))
);


--
-- Name: cliente_id_seq; Type: SEQUENCE; Schema: clientes; Owner: -
--

ALTER TABLE clientes.cliente ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME clientes.cliente_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cliente_telefono; Type: TABLE; Schema: clientes; Owner: -
--

CREATE TABLE clientes.cliente_telefono (
    cliente_id bigint NOT NULL,
    telefono character varying(20) NOT NULL
);


--
-- Name: consentimiento_terminos; Type: TABLE; Schema: clientes; Owner: -
--

CREATE TABLE clientes.consentimiento_terminos (
    id bigint NOT NULL,
    usuario_id bigint,
    cliente_id bigint,
    version_terminos character varying(20) NOT NULL,
    aceptado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_consentimiento_titular CHECK (((usuario_id IS NOT NULL) OR (cliente_id IS NOT NULL)))
);


--
-- Name: consentimiento_terminos_id_seq; Type: SEQUENCE; Schema: clientes; Owner: -
--

ALTER TABLE clientes.consentimiento_terminos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME clientes.consentimiento_terminos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: nivel_fidelidad; Type: TABLE; Schema: clientes; Owner: -
--

CREATE TABLE clientes.nivel_fidelidad (
    nivel smallint NOT NULL,
    compras_minimas integer NOT NULL,
    porcentaje_descuento numeric(5,2) DEFAULT 0 NOT NULL,
    CONSTRAINT ck_nivel_compras CHECK ((compras_minimas >= 0)),
    CONSTRAINT ck_nivel_descuento CHECK (((porcentaje_descuento >= (0)::numeric) AND (porcentaje_descuento <= (100)::numeric))),
    CONSTRAINT ck_nivel_positivo CHECK ((nivel > 0))
);


--
-- Name: factura; Type: TABLE; Schema: facturacion; Owner: -
--

CREATE TABLE facturacion.factura (
    id bigint NOT NULL,
    pedido_id bigint NOT NULL,
    consecutivo character varying(50),
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    emisor_razon_social character varying(200) NOT NULL,
    emisor_cedula_juridica character varying(20) NOT NULL,
    receptor_nombre character varying(150) NOT NULL,
    receptor_cedula character varying(20) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    descuento numeric(12,2) DEFAULT 0 NOT NULL,
    impuesto numeric(12,2) NOT NULL,
    costo_envio numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    creada_en timestamp with time zone DEFAULT now() NOT NULL,
    emitida_en timestamp with time zone,
    CONSTRAINT ck_factura_emision CHECK ((((estado)::text = 'emitida'::text) = ((emitida_en IS NOT NULL) AND (consecutivo IS NOT NULL)))),
    CONSTRAINT ck_factura_estado CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'emitida'::character varying, 'rechazada'::character varying])::text[]))),
    CONSTRAINT ck_factura_montos CHECK (((subtotal >= (0)::numeric) AND (descuento >= (0)::numeric) AND (impuesto >= (0)::numeric) AND (costo_envio >= (0)::numeric) AND (total >= (0)::numeric)))
);


--
-- Name: factura_id_seq; Type: SEQUENCE; Schema: facturacion; Owner: -
--

ALTER TABLE facturacion.factura ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME facturacion.factura_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: existencia; Type: TABLE; Schema: inventario; Owner: -
--

CREATE TABLE inventario.existencia (
    producto_id bigint NOT NULL,
    cantidad integer DEFAULT 0 NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_existencia_no_negativa CHECK ((cantidad >= 0))
);


--
-- Name: movimiento; Type: TABLE; Schema: inventario; Owner: -
--

CREATE TABLE inventario.movimiento (
    id bigint NOT NULL,
    producto_id bigint NOT NULL,
    tipo character varying(20) NOT NULL,
    cantidad integer NOT NULL,
    costo_unitario numeric(12,2),
    motivo text,
    responsable_id bigint,
    pedido_id bigint,
    registrado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_movimiento_ajuste CHECK ((((tipo)::text <> 'ajuste'::text) OR ((btrim(COALESCE(motivo, ''::text)) <> ''::text) AND (responsable_id IS NOT NULL)))),
    CONSTRAINT ck_movimiento_cantidad CHECK ((cantidad <> 0)),
    CONSTRAINT ck_movimiento_con_pedido CHECK ((((tipo)::text <> ALL ((ARRAY['venta'::character varying, 'cancelacion'::character varying])::text[])) OR (pedido_id IS NOT NULL))),
    CONSTRAINT ck_movimiento_costo CHECK ((((tipo)::text = ANY ((ARRAY['carga_inicial'::character varying, 'ingreso'::character varying])::text[])) = (costo_unitario IS NOT NULL))),
    CONSTRAINT ck_movimiento_costo_no_negativo CHECK ((costo_unitario >= (0)::numeric)),
    CONSTRAINT ck_movimiento_signo CHECK (((((tipo)::text = ANY ((ARRAY['carga_inicial'::character varying, 'ingreso'::character varying, 'cancelacion'::character varying])::text[])) AND (cantidad > 0)) OR (((tipo)::text = ANY ((ARRAY['venta'::character varying, 'reposicion'::character varying])::text[])) AND (cantidad < 0)) OR ((tipo)::text = 'ajuste'::text))),
    CONSTRAINT ck_movimiento_sin_pedido CHECK ((((tipo)::text <> ALL ((ARRAY['carga_inicial'::character varying, 'ingreso'::character varying, 'ajuste'::character varying])::text[])) OR (pedido_id IS NULL))),
    CONSTRAINT ck_movimiento_tipo CHECK (((tipo)::text = ANY ((ARRAY['carga_inicial'::character varying, 'ingreso'::character varying, 'venta'::character varying, 'cancelacion'::character varying, 'ajuste'::character varying, 'reposicion'::character varying])::text[])))
);


--
-- Name: movimiento_id_seq; Type: SEQUENCE; Schema: inventario; Owner: -
--

ALTER TABLE inventario.movimiento ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME inventario.movimiento_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: intento_pago; Type: TABLE; Schema: pagos; Owner: -
--

CREATE TABLE pagos.intento_pago (
    id bigint NOT NULL,
    pedido_id bigint,
    carrito_id bigint,
    metodo character varying(20) NOT NULL,
    monto numeric(12,2) NOT NULL,
    resultado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    referencia_externa character varying(100),
    solicitado_en timestamp with time zone DEFAULT now() NOT NULL,
    resuelto_en timestamp with time zone,
    CONSTRAINT ck_intento_metodo CHECK (((metodo)::text = ANY ((ARRAY['tarjeta'::character varying, 'sinpe_movil'::character varying, 'efectivo'::character varying, 'datafono'::character varying, 'contra_entrega'::character varying])::text[]))),
    CONSTRAINT ck_intento_monto CHECK ((monto >= (0)::numeric)),
    CONSTRAINT ck_intento_origen CHECK (((pedido_id IS NOT NULL) OR (carrito_id IS NOT NULL))),
    CONSTRAINT ck_intento_resolucion CHECK ((((resultado)::text = 'pendiente'::text) = (resuelto_en IS NULL))),
    CONSTRAINT ck_intento_resultado CHECK (((resultado)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobado'::character varying, 'rechazado'::character varying, 'no_disponible'::character varying])::text[])))
);


--
-- Name: intento_pago_id_seq; Type: SEQUENCE; Schema: pagos; Owner: -
--

ALTER TABLE pagos.intento_pago ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pagos.intento_pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: carrito; Type: TABLE; Schema: pedidos; Owner: -
--

CREATE TABLE pedidos.carrito (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    cerrado_en timestamp with time zone,
    CONSTRAINT ck_carrito_cierre CHECK ((((estado)::text = 'activo'::text) = (cerrado_en IS NULL))),
    CONSTRAINT ck_carrito_estado CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'convertido'::character varying])::text[])))
);


--
-- Name: carrito_id_seq; Type: SEQUENCE; Schema: pedidos; Owner: -
--

ALTER TABLE pedidos.carrito ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pedidos.carrito_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: historial_estado; Type: TABLE; Schema: pedidos; Owner: -
--

CREATE TABLE pedidos.historial_estado (
    id bigint NOT NULL,
    pedido_id bigint NOT NULL,
    estado character varying(20) NOT NULL,
    usuario_id bigint,
    registrado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_historial_estado CHECK (((estado)::text = ANY ((ARRAY['colocado'::character varying, 'procesado'::character varying, 'en_transito'::character varying, 'finalizado'::character varying, 'cancelado'::character varying])::text[])))
);


--
-- Name: historial_estado_id_seq; Type: SEQUENCE; Schema: pedidos; Owner: -
--

ALTER TABLE pedidos.historial_estado ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pedidos.historial_estado_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: linea_carrito; Type: TABLE; Schema: pedidos; Owner: -
--

CREATE TABLE pedidos.linea_carrito (
    carrito_id bigint NOT NULL,
    producto_id bigint NOT NULL,
    cantidad integer NOT NULL,
    agregado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_linea_carrito_cantidad CHECK ((cantidad > 0))
);


--
-- Name: linea_pedido; Type: TABLE; Schema: pedidos; Owner: -
--

CREATE TABLE pedidos.linea_pedido (
    pedido_id bigint NOT NULL,
    producto_id bigint NOT NULL,
    cantidad integer NOT NULL,
    cantidad_contrapedido integer DEFAULT 0 NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    CONSTRAINT ck_linea_pedido_cantidad CHECK ((cantidad > 0)),
    CONSTRAINT ck_linea_pedido_contrapedido CHECK (((cantidad_contrapedido >= 0) AND (cantidad_contrapedido <= cantidad))),
    CONSTRAINT ck_linea_pedido_precio CHECK ((precio_unitario >= (0)::numeric))
);


--
-- Name: pedido; Type: TABLE; Schema: pedidos; Owner: -
--

CREATE TABLE pedidos.pedido (
    id bigint NOT NULL,
    canal character varying(20) DEFAULT 'en_linea'::character varying NOT NULL,
    cliente_id bigint,
    carrito_id bigint,
    registrado_por bigint,
    estado character varying(20) DEFAULT 'colocado'::character varying NOT NULL,
    estado_pago character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    modalidad_entrega character varying(20),
    direccion_entrega text,
    numero_guia character varying(100),
    subtotal numeric(12,2) NOT NULL,
    descuento numeric(12,2) DEFAULT 0 NOT NULL,
    impuesto numeric(12,2) NOT NULL,
    costo_envio numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    colocado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_pedido_canal CHECK (((canal)::text = ANY ((ARRAY['en_linea'::character varying, 'presencial'::character varying, 'redes_sociales'::character varying])::text[]))),
    CONSTRAINT ck_pedido_en_linea CHECK ((((canal)::text <> 'en_linea'::text) OR ((cliente_id IS NOT NULL) AND (modalidad_entrega IS NOT NULL)))),
    CONSTRAINT ck_pedido_estado CHECK (((estado)::text = ANY ((ARRAY['colocado'::character varying, 'procesado'::character varying, 'en_transito'::character varying, 'finalizado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT ck_pedido_estado_pago CHECK (((estado_pago)::text = ANY ((ARRAY['pendiente'::character varying, 'pagado'::character varying, 'pendiente_cobro'::character varying])::text[]))),
    CONSTRAINT ck_pedido_externo CHECK ((((canal)::text = 'en_linea'::text) OR ((registrado_por IS NOT NULL) AND (carrito_id IS NULL)))),
    CONSTRAINT ck_pedido_modalidad CHECK (((modalidad_entrega)::text = ANY ((ARRAY['mensajero'::character varying, 'uber_flash'::character varying, 'correos_cr'::character varying, 'entrega_personal'::character varying])::text[]))),
    CONSTRAINT ck_pedido_montos CHECK (((subtotal >= (0)::numeric) AND (descuento >= (0)::numeric) AND (impuesto >= (0)::numeric) AND (costo_envio >= (0)::numeric) AND (total >= (0)::numeric)))
);


--
-- Name: pedido_id_seq; Type: SEQUENCE; Schema: pedidos; Owner: -
--

ALTER TABLE pedidos.pedido ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pedidos.pedido_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: v_existencias; Type: VIEW; Schema: reportes; Owner: -
--

CREATE VIEW reportes.v_existencias AS
 SELECT p.id AS producto_id,
    p.sku,
    p.nombre,
    p.estado,
    c.nombre AS categoria,
    s.nombre AS subcategoria,
    COALESCE(e.cantidad, 0) AS existencias,
    p.costo_item,
    p.porcentaje_importacion,
    p.margen_ganancia,
    p.admite_contrapedido
   FROM (((catalogo.producto p
     JOIN catalogo.subcategoria s ON ((s.id = p.subcategoria_id)))
     JOIN catalogo.categoria c ON ((c.id = s.categoria_id)))
     LEFT JOIN inventario.existencia e ON ((e.producto_id = p.id)));


--
-- Name: v_historico_costos; Type: VIEW; Schema: reportes; Owner: -
--

CREATE VIEW reportes.v_historico_costos AS
 SELECT m.producto_id,
    p.sku,
    p.nombre,
    m.registrado_en,
    m.tipo,
    m.cantidad,
    m.costo_unitario
   FROM (inventario.movimiento m
     JOIN catalogo.producto p ON ((p.id = m.producto_id)))
  WHERE (m.costo_unitario IS NOT NULL);


--
-- Name: v_pedidos_por_cliente; Type: VIEW; Schema: reportes; Owner: -
--

CREATE VIEW reportes.v_pedidos_por_cliente AS
 SELECT cl.id AS cliente_id,
    cl.nombre AS cliente,
    cl.cedula,
    pe.id AS pedido_id,
    pe.colocado_en,
    pe.canal,
    pe.total,
    pe.estado,
    pe.estado_pago
   FROM (pedidos.pedido pe
     JOIN clientes.cliente cl ON ((cl.id = pe.cliente_id)));


--
-- Name: v_venta_por_linea; Type: VIEW; Schema: reportes; Owner: -
--

CREATE VIEW reportes.v_venta_por_linea AS
 SELECT pe.id AS pedido_id,
    pe.colocado_en,
    pe.canal,
    pe.cliente_id,
    p.id AS producto_id,
    p.sku,
    p.nombre AS producto,
    c.id AS categoria_id,
    c.nombre AS categoria,
    s.id AS subcategoria_id,
    s.nombre AS subcategoria,
    lp.cantidad,
    lp.precio_unitario,
    ((lp.cantidad)::numeric * lp.precio_unitario) AS monto
   FROM ((((pedidos.linea_pedido lp
     JOIN pedidos.pedido pe ON ((pe.id = lp.pedido_id)))
     JOIN catalogo.producto p ON ((p.id = lp.producto_id)))
     JOIN catalogo.subcategoria s ON ((s.id = p.subcategoria_id)))
     JOIN catalogo.categoria c ON ((c.id = s.categoria_id)))
  WHERE ((pe.estado)::text <> 'cancelado'::text);


--
-- Name: bitacora bitacora_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.bitacora
    ADD CONSTRAINT bitacora_pkey PRIMARY KEY (id);


--
-- Name: parametro_negocio parametro_negocio_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.parametro_negocio
    ADD CONSTRAINT parametro_negocio_pkey PRIMARY KEY (clave);


--
-- Name: recuperacion_contrasena recuperacion_contrasena_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.recuperacion_contrasena
    ADD CONSTRAINT recuperacion_contrasena_pkey PRIMARY KEY (id);


--
-- Name: recuperacion_contrasena recuperacion_contrasena_token_hash_key; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.recuperacion_contrasena
    ADD CONSTRAINT recuperacion_contrasena_token_hash_key UNIQUE (token_hash);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: categoria categoria_pkey; Type: CONSTRAINT; Schema: catalogo; Owner: -
--

ALTER TABLE ONLY catalogo.categoria
    ADD CONSTRAINT categoria_pkey PRIMARY KEY (id);


--
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: catalogo; Owner: -
--

ALTER TABLE ONLY catalogo.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (id);


--
-- Name: subcategoria subcategoria_pkey; Type: CONSTRAINT; Schema: catalogo; Owner: -
--

ALTER TABLE ONLY catalogo.subcategoria
    ADD CONSTRAINT subcategoria_pkey PRIMARY KEY (id);


--
-- Name: producto ux_producto_sku; Type: CONSTRAINT; Schema: catalogo; Owner: -
--

ALTER TABLE ONLY catalogo.producto
    ADD CONSTRAINT ux_producto_sku UNIQUE (sku);


--
-- Name: cliente cliente_pkey; Type: CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (id);


--
-- Name: cliente_telefono cliente_telefono_pkey; Type: CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.cliente_telefono
    ADD CONSTRAINT cliente_telefono_pkey PRIMARY KEY (cliente_id, telefono);


--
-- Name: cliente cliente_usuario_id_key; Type: CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.cliente
    ADD CONSTRAINT cliente_usuario_id_key UNIQUE (usuario_id);


--
-- Name: consentimiento_terminos consentimiento_terminos_pkey; Type: CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.consentimiento_terminos
    ADD CONSTRAINT consentimiento_terminos_pkey PRIMARY KEY (id);


--
-- Name: nivel_fidelidad nivel_fidelidad_pkey; Type: CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.nivel_fidelidad
    ADD CONSTRAINT nivel_fidelidad_pkey PRIMARY KEY (nivel);


--
-- Name: nivel_fidelidad ux_nivel_compras_minimas; Type: CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.nivel_fidelidad
    ADD CONSTRAINT ux_nivel_compras_minimas UNIQUE (compras_minimas);


--
-- Name: factura factura_consecutivo_key; Type: CONSTRAINT; Schema: facturacion; Owner: -
--

ALTER TABLE ONLY facturacion.factura
    ADD CONSTRAINT factura_consecutivo_key UNIQUE (consecutivo);


--
-- Name: factura factura_pedido_id_key; Type: CONSTRAINT; Schema: facturacion; Owner: -
--

ALTER TABLE ONLY facturacion.factura
    ADD CONSTRAINT factura_pedido_id_key UNIQUE (pedido_id);


--
-- Name: factura factura_pkey; Type: CONSTRAINT; Schema: facturacion; Owner: -
--

ALTER TABLE ONLY facturacion.factura
    ADD CONSTRAINT factura_pkey PRIMARY KEY (id);


--
-- Name: existencia existencia_pkey; Type: CONSTRAINT; Schema: inventario; Owner: -
--

ALTER TABLE ONLY inventario.existencia
    ADD CONSTRAINT existencia_pkey PRIMARY KEY (producto_id);


--
-- Name: movimiento movimiento_pkey; Type: CONSTRAINT; Schema: inventario; Owner: -
--

ALTER TABLE ONLY inventario.movimiento
    ADD CONSTRAINT movimiento_pkey PRIMARY KEY (id);


--
-- Name: intento_pago intento_pago_pkey; Type: CONSTRAINT; Schema: pagos; Owner: -
--

ALTER TABLE ONLY pagos.intento_pago
    ADD CONSTRAINT intento_pago_pkey PRIMARY KEY (id);


--
-- Name: intento_pago intento_pago_referencia_externa_key; Type: CONSTRAINT; Schema: pagos; Owner: -
--

ALTER TABLE ONLY pagos.intento_pago
    ADD CONSTRAINT intento_pago_referencia_externa_key UNIQUE (referencia_externa);


--
-- Name: carrito carrito_pkey; Type: CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.carrito
    ADD CONSTRAINT carrito_pkey PRIMARY KEY (id);


--
-- Name: historial_estado historial_estado_pkey; Type: CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.historial_estado
    ADD CONSTRAINT historial_estado_pkey PRIMARY KEY (id);


--
-- Name: linea_carrito linea_carrito_pkey; Type: CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.linea_carrito
    ADD CONSTRAINT linea_carrito_pkey PRIMARY KEY (carrito_id, producto_id);


--
-- Name: linea_pedido linea_pedido_pkey; Type: CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.linea_pedido
    ADD CONSTRAINT linea_pedido_pkey PRIMARY KEY (pedido_id, producto_id);


--
-- Name: pedido pedido_carrito_id_key; Type: CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.pedido
    ADD CONSTRAINT pedido_carrito_id_key UNIQUE (carrito_id);


--
-- Name: pedido pedido_pkey; Type: CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.pedido
    ADD CONSTRAINT pedido_pkey PRIMARY KEY (id);


--
-- Name: ix_bitacora_fecha; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX ix_bitacora_fecha ON admin.bitacora USING btree (registrado_en);


--
-- Name: ix_bitacora_usuario; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX ix_bitacora_usuario ON admin.bitacora USING btree (usuario_id);


--
-- Name: ix_recuperacion_usuario; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX ix_recuperacion_usuario ON admin.recuperacion_contrasena USING btree (usuario_id);


--
-- Name: ux_usuario_administrador_unico; Type: INDEX; Schema: admin; Owner: -
--

CREATE UNIQUE INDEX ux_usuario_administrador_unico ON admin.usuario USING btree (rol) WHERE ((rol)::text = 'administrador'::text);


--
-- Name: ux_usuario_correo; Type: INDEX; Schema: admin; Owner: -
--

CREATE UNIQUE INDEX ux_usuario_correo ON admin.usuario USING btree (lower((correo)::text));


--
-- Name: ix_producto_subcategoria; Type: INDEX; Schema: catalogo; Owner: -
--

CREATE INDEX ix_producto_subcategoria ON catalogo.producto USING btree (subcategoria_id);


--
-- Name: ux_categoria_nombre; Type: INDEX; Schema: catalogo; Owner: -
--

CREATE UNIQUE INDEX ux_categoria_nombre ON catalogo.categoria USING btree (lower(btrim((nombre)::text)));


--
-- Name: ux_subcategoria_nombre; Type: INDEX; Schema: catalogo; Owner: -
--

CREATE UNIQUE INDEX ux_subcategoria_nombre ON catalogo.subcategoria USING btree (categoria_id, lower(btrim((nombre)::text)));


--
-- Name: ix_consentimiento_cliente; Type: INDEX; Schema: clientes; Owner: -
--

CREATE INDEX ix_consentimiento_cliente ON clientes.consentimiento_terminos USING btree (cliente_id);


--
-- Name: ix_consentimiento_usuario; Type: INDEX; Schema: clientes; Owner: -
--

CREATE INDEX ix_consentimiento_usuario ON clientes.consentimiento_terminos USING btree (usuario_id);


--
-- Name: ux_cliente_cedula; Type: INDEX; Schema: clientes; Owner: -
--

CREATE UNIQUE INDEX ux_cliente_cedula ON clientes.cliente USING btree (cedula);


--
-- Name: ux_cliente_correo; Type: INDEX; Schema: clientes; Owner: -
--

CREATE UNIQUE INDEX ux_cliente_correo ON clientes.cliente USING btree (lower((correo)::text));


--
-- Name: ix_movimiento_pedido; Type: INDEX; Schema: inventario; Owner: -
--

CREATE INDEX ix_movimiento_pedido ON inventario.movimiento USING btree (pedido_id);


--
-- Name: ix_movimiento_producto; Type: INDEX; Schema: inventario; Owner: -
--

CREATE INDEX ix_movimiento_producto ON inventario.movimiento USING btree (producto_id, registrado_en);


--
-- Name: ix_intento_carrito; Type: INDEX; Schema: pagos; Owner: -
--

CREATE INDEX ix_intento_carrito ON pagos.intento_pago USING btree (carrito_id);


--
-- Name: ix_intento_pedido; Type: INDEX; Schema: pagos; Owner: -
--

CREATE INDEX ix_intento_pedido ON pagos.intento_pago USING btree (pedido_id);


--
-- Name: ix_historial_pedido; Type: INDEX; Schema: pedidos; Owner: -
--

CREATE INDEX ix_historial_pedido ON pedidos.historial_estado USING btree (pedido_id, registrado_en);


--
-- Name: ix_linea_carrito_producto; Type: INDEX; Schema: pedidos; Owner: -
--

CREATE INDEX ix_linea_carrito_producto ON pedidos.linea_carrito USING btree (producto_id);


--
-- Name: ix_linea_pedido_producto; Type: INDEX; Schema: pedidos; Owner: -
--

CREATE INDEX ix_linea_pedido_producto ON pedidos.linea_pedido USING btree (producto_id);


--
-- Name: ix_pedido_cliente; Type: INDEX; Schema: pedidos; Owner: -
--

CREATE INDEX ix_pedido_cliente ON pedidos.pedido USING btree (cliente_id);


--
-- Name: ix_pedido_estado; Type: INDEX; Schema: pedidos; Owner: -
--

CREATE INDEX ix_pedido_estado ON pedidos.pedido USING btree (estado);


--
-- Name: ix_pedido_fecha; Type: INDEX; Schema: pedidos; Owner: -
--

CREATE INDEX ix_pedido_fecha ON pedidos.pedido USING btree (colocado_en);


--
-- Name: ux_carrito_activo_por_usuario; Type: INDEX; Schema: pedidos; Owner: -
--

CREATE UNIQUE INDEX ux_carrito_activo_por_usuario ON pedidos.carrito USING btree (usuario_id) WHERE ((estado)::text = 'activo'::text);


--
-- Name: bitacora tg_bitacora_solo_insercion; Type: TRIGGER; Schema: admin; Owner: -
--

CREATE TRIGGER tg_bitacora_solo_insercion BEFORE DELETE OR UPDATE ON admin.bitacora FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();


--
-- Name: parametro_negocio tg_parametro_actualizado_en; Type: TRIGGER; Schema: admin; Owner: -
--

CREATE TRIGGER tg_parametro_actualizado_en BEFORE UPDATE ON admin.parametro_negocio FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();


--
-- Name: usuario tg_usuario_actualizado_en; Type: TRIGGER; Schema: admin; Owner: -
--

CREATE TRIGGER tg_usuario_actualizado_en BEFORE UPDATE ON admin.usuario FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();


--
-- Name: producto tg_producto_actualizado_en; Type: TRIGGER; Schema: catalogo; Owner: -
--

CREATE TRIGGER tg_producto_actualizado_en BEFORE UPDATE ON catalogo.producto FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();


--
-- Name: cliente tg_cliente_actualizado_en; Type: TRIGGER; Schema: clientes; Owner: -
--

CREATE TRIGGER tg_cliente_actualizado_en BEFORE UPDATE ON clientes.cliente FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();


--
-- Name: consentimiento_terminos tg_consentimiento_solo_insercion; Type: TRIGGER; Schema: clientes; Owner: -
--

CREATE TRIGGER tg_consentimiento_solo_insercion BEFORE DELETE OR UPDATE ON clientes.consentimiento_terminos FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();


--
-- Name: existencia tg_existencia_actualizado_en; Type: TRIGGER; Schema: inventario; Owner: -
--

CREATE TRIGGER tg_existencia_actualizado_en BEFORE UPDATE ON inventario.existencia FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();


--
-- Name: movimiento tg_movimiento_solo_insercion; Type: TRIGGER; Schema: inventario; Owner: -
--

CREATE TRIGGER tg_movimiento_solo_insercion BEFORE DELETE OR UPDATE ON inventario.movimiento FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();


--
-- Name: carrito tg_carrito_actualizado_en; Type: TRIGGER; Schema: pedidos; Owner: -
--

CREATE TRIGGER tg_carrito_actualizado_en BEFORE UPDATE ON pedidos.carrito FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();


--
-- Name: historial_estado tg_historial_solo_insercion; Type: TRIGGER; Schema: pedidos; Owner: -
--

CREATE TRIGGER tg_historial_solo_insercion BEFORE DELETE OR UPDATE ON pedidos.historial_estado FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();


--
-- Name: linea_pedido tg_linea_pedido_solo_insercion; Type: TRIGGER; Schema: pedidos; Owner: -
--

CREATE TRIGGER tg_linea_pedido_solo_insercion BEFORE DELETE OR UPDATE ON pedidos.linea_pedido FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();


--
-- Name: pedido tg_pedido_actualizado_en; Type: TRIGGER; Schema: pedidos; Owner: -
--

CREATE TRIGGER tg_pedido_actualizado_en BEFORE UPDATE ON pedidos.pedido FOR EACH ROW EXECUTE FUNCTION public.fijar_actualizado_en();


--
-- Name: bitacora bitacora_usuario_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.bitacora
    ADD CONSTRAINT bitacora_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES admin.usuario(id);


--
-- Name: parametro_negocio parametro_negocio_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.parametro_negocio
    ADD CONSTRAINT parametro_negocio_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES admin.usuario(id);


--
-- Name: recuperacion_contrasena recuperacion_contrasena_usuario_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.recuperacion_contrasena
    ADD CONSTRAINT recuperacion_contrasena_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES admin.usuario(id) ON DELETE CASCADE;


--
-- Name: producto producto_subcategoria_id_fkey; Type: FK CONSTRAINT; Schema: catalogo; Owner: -
--

ALTER TABLE ONLY catalogo.producto
    ADD CONSTRAINT producto_subcategoria_id_fkey FOREIGN KEY (subcategoria_id) REFERENCES catalogo.subcategoria(id);


--
-- Name: subcategoria subcategoria_categoria_id_fkey; Type: FK CONSTRAINT; Schema: catalogo; Owner: -
--

ALTER TABLE ONLY catalogo.subcategoria
    ADD CONSTRAINT subcategoria_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES catalogo.categoria(id);


--
-- Name: cliente_telefono cliente_telefono_cliente_id_fkey; Type: FK CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.cliente_telefono
    ADD CONSTRAINT cliente_telefono_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes.cliente(id) ON DELETE CASCADE;


--
-- Name: cliente cliente_usuario_id_fkey; Type: FK CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.cliente
    ADD CONSTRAINT cliente_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES admin.usuario(id);


--
-- Name: consentimiento_terminos consentimiento_terminos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.consentimiento_terminos
    ADD CONSTRAINT consentimiento_terminos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes.cliente(id);


--
-- Name: consentimiento_terminos consentimiento_terminos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.consentimiento_terminos
    ADD CONSTRAINT consentimiento_terminos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES admin.usuario(id);


--
-- Name: factura factura_pedido_id_fkey; Type: FK CONSTRAINT; Schema: facturacion; Owner: -
--

ALTER TABLE ONLY facturacion.factura
    ADD CONSTRAINT factura_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES pedidos.pedido(id);


--
-- Name: existencia existencia_producto_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: -
--

ALTER TABLE ONLY inventario.existencia
    ADD CONSTRAINT existencia_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES catalogo.producto(id);


--
-- Name: movimiento fk_movimiento_pedido; Type: FK CONSTRAINT; Schema: inventario; Owner: -
--

ALTER TABLE ONLY inventario.movimiento
    ADD CONSTRAINT fk_movimiento_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos.pedido(id);


--
-- Name: movimiento movimiento_producto_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: -
--

ALTER TABLE ONLY inventario.movimiento
    ADD CONSTRAINT movimiento_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES catalogo.producto(id);


--
-- Name: movimiento movimiento_responsable_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: -
--

ALTER TABLE ONLY inventario.movimiento
    ADD CONSTRAINT movimiento_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES admin.usuario(id);


--
-- Name: intento_pago intento_pago_carrito_id_fkey; Type: FK CONSTRAINT; Schema: pagos; Owner: -
--

ALTER TABLE ONLY pagos.intento_pago
    ADD CONSTRAINT intento_pago_carrito_id_fkey FOREIGN KEY (carrito_id) REFERENCES pedidos.carrito(id);


--
-- Name: intento_pago intento_pago_pedido_id_fkey; Type: FK CONSTRAINT; Schema: pagos; Owner: -
--

ALTER TABLE ONLY pagos.intento_pago
    ADD CONSTRAINT intento_pago_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES pedidos.pedido(id);


--
-- Name: carrito carrito_usuario_id_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.carrito
    ADD CONSTRAINT carrito_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES admin.usuario(id);


--
-- Name: historial_estado historial_estado_pedido_id_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.historial_estado
    ADD CONSTRAINT historial_estado_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES pedidos.pedido(id);


--
-- Name: historial_estado historial_estado_usuario_id_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.historial_estado
    ADD CONSTRAINT historial_estado_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES admin.usuario(id);


--
-- Name: linea_carrito linea_carrito_carrito_id_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.linea_carrito
    ADD CONSTRAINT linea_carrito_carrito_id_fkey FOREIGN KEY (carrito_id) REFERENCES pedidos.carrito(id) ON DELETE CASCADE;


--
-- Name: linea_carrito linea_carrito_producto_id_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.linea_carrito
    ADD CONSTRAINT linea_carrito_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES catalogo.producto(id);


--
-- Name: linea_pedido linea_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.linea_pedido
    ADD CONSTRAINT linea_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES pedidos.pedido(id);


--
-- Name: linea_pedido linea_pedido_producto_id_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.linea_pedido
    ADD CONSTRAINT linea_pedido_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES catalogo.producto(id);


--
-- Name: pedido pedido_carrito_id_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.pedido
    ADD CONSTRAINT pedido_carrito_id_fkey FOREIGN KEY (carrito_id) REFERENCES pedidos.carrito(id);


--
-- Name: pedido pedido_cliente_id_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.pedido
    ADD CONSTRAINT pedido_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes.cliente(id);


--
-- Name: pedido pedido_registrado_por_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.pedido
    ADD CONSTRAINT pedido_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES admin.usuario(id);


--
-- PostgreSQL database dump complete
--


