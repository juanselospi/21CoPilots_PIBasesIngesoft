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
-- Name: usuarios; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA usuarios;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: fijar_fecha_actualizacion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fijar_fecha_actualizacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fecha_actualizacion := now();
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
    IF TG_OP = 'UPDATE' AND pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'La tabla %.% es de solo inserción: no admite %',
        TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP
        USING ERRCODE = 'restrict_violation';
END;
$$;


--
-- Name: verificar_usuario_disjunto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verificar_usuario_disjunto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administrador; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.administrador (
    correo_usuario character varying(255) NOT NULL
);


--
-- Name: producto; Type: TABLE; Schema: catalogo; Owner: -
--

CREATE TABLE catalogo.producto (
    sku character varying(50) NOT NULL,
    nombre character varying(200) NOT NULL,
    item numeric(12,2) NOT NULL,
    importacion numeric(6,2) DEFAULT 0 NOT NULL,
    costo_total numeric GENERATED ALWAYS AS ((item * ((1)::numeric + (importacion / (100)::numeric)))) STORED,
    margen_ganancia numeric(6,2) DEFAULT 0 NOT NULL,
    tasa_impuesto numeric(5,2) DEFAULT 13 NOT NULL,
    categoria character varying(100) NOT NULL,
    proveedor character varying(150),
    descripcion text,
    stock integer DEFAULT 0 NOT NULL,
    imagen character varying(500),
    contrapedido boolean DEFAULT false NOT NULL,
    CONSTRAINT ck_producto_categoria CHECK ((btrim((categoria)::text) <> ''::text)),
    CONSTRAINT ck_producto_importacion CHECK ((importacion >= (0)::numeric)),
    CONSTRAINT ck_producto_item CHECK ((item >= (0)::numeric)),
    CONSTRAINT ck_producto_margen CHECK ((margen_ganancia > ('-100'::integer)::numeric)),
    CONSTRAINT ck_producto_nombre CHECK ((btrim((nombre)::text) <> ''::text)),
    CONSTRAINT ck_producto_sku_normalizado CHECK ((((sku)::text = upper(btrim((sku)::text))) AND ((sku)::text <> ''::text))),
    CONSTRAINT ck_producto_stock CHECK ((stock >= 0)),
    CONSTRAINT ck_producto_tasa_impuesto CHECK (((tasa_impuesto >= (0)::numeric) AND (tasa_impuesto <= (100)::numeric)))
);


--
-- Name: cliente; Type: TABLE; Schema: clientes; Owner: -
--

CREATE TABLE clientes.cliente (
    correo_usuario character varying(255) NOT NULL,
    cedula character varying(20) NOT NULL,
    direccion text,
    num_compras integer DEFAULT 0 NOT NULL,
    CONSTRAINT ck_cliente_cedula CHECK ((btrim((cedula)::text) <> ''::text)),
    CONSTRAINT ck_cliente_num_compras CHECK ((num_compras >= 0))
);


--
-- Name: cliente_telefono; Type: TABLE; Schema: clientes; Owner: -
--

CREATE TABLE clientes.cliente_telefono (
    correo_usuario character varying(255) NOT NULL,
    telefono character varying(20) NOT NULL,
    CONSTRAINT ck_cliente_telefono CHECK ((btrim((telefono)::text) <> ''::text))
);


--
-- Name: factura; Type: TABLE; Schema: facturacion; Owner: -
--

CREATE TABLE facturacion.factura (
    num_factura character varying(50) NOT NULL,
    fecha_emision timestamp with time zone DEFAULT now() NOT NULL,
    num_referencia character varying(100) NOT NULL,
    CONSTRAINT ck_factura_numero CHECK ((btrim((num_factura)::text) <> ''::text))
);


--
-- Name: producto_administra; Type: TABLE; Schema: inventario; Owner: -
--

CREATE TABLE inventario.producto_administra (
    sku character varying(50) NOT NULL,
    correo_administrador character varying(255) NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    cantidad integer NOT NULL,
    CONSTRAINT ck_producto_administra_cantidad CHECK ((cantidad <> 0))
);


--
-- Name: pago; Type: TABLE; Schema: pagos; Owner: -
--

CREATE TABLE pagos.pago (
    num_referencia character varying(100) NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    monto numeric(12,2) NOT NULL,
    metodo_pago character varying(20) NOT NULL,
    estado_pago character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    correo_cliente character varying(255) NOT NULL,
    num_carrito integer NOT NULL,
    CONSTRAINT ck_pago_estado CHECK (((estado_pago)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobado'::character varying, 'rechazado'::character varying])::text[]))),
    CONSTRAINT ck_pago_metodo CHECK (((metodo_pago)::text = ANY ((ARRAY['tarjeta'::character varying, 'sinpe_movil'::character varying, 'efectivo'::character varying, 'datafono'::character varying, 'contra_entrega'::character varying])::text[]))),
    CONSTRAINT ck_pago_monto CHECK ((monto >= (0)::numeric)),
    CONSTRAINT ck_pago_referencia CHECK ((btrim((num_referencia)::text) <> ''::text))
);


--
-- Name: agrega; Type: TABLE; Schema: pedidos; Owner: -
--

CREATE TABLE pedidos.agrega (
    correo_cliente character varying(255) NOT NULL,
    num_carrito integer NOT NULL,
    sku character varying(50) NOT NULL,
    cantidad_solicitada integer NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    tasa_impuesto_aplicada numeric(5,2) NOT NULL,
    CONSTRAINT ck_agrega_cantidad CHECK ((cantidad_solicitada > 0)),
    CONSTRAINT ck_agrega_precio CHECK ((precio_unitario >= (0)::numeric)),
    CONSTRAINT ck_agrega_tasa CHECK (((tasa_impuesto_aplicada >= (0)::numeric) AND (tasa_impuesto_aplicada <= (100)::numeric)))
);


--
-- Name: carrito; Type: TABLE; Schema: pedidos; Owner: -
--

CREATE TABLE pedidos.carrito (
    correo_cliente character varying(255) NOT NULL,
    num_carrito integer NOT NULL,
    estado_carrito character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now() NOT NULL,
    fecha_actualizacion timestamp with time zone DEFAULT now() NOT NULL,
    fecha_cierre timestamp with time zone,
    CONSTRAINT ck_carrito_cierre CHECK ((((estado_carrito)::text = 'activo'::text) = (fecha_cierre IS NULL))),
    CONSTRAINT ck_carrito_estado CHECK (((estado_carrito)::text = ANY ((ARRAY['activo'::character varying, 'convertido'::character varying])::text[]))),
    CONSTRAINT ck_carrito_num CHECK ((num_carrito > 0))
);


--
-- Name: historial_estado; Type: TABLE; Schema: pedidos; Owner: -
--

CREATE TABLE pedidos.historial_estado (
    correo_cliente character varying(255) NOT NULL,
    num_carrito integer NOT NULL,
    numero_cambio integer NOT NULL,
    estado character varying(20) NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_historial_estado CHECK (((estado)::text = ANY ((ARRAY['colocado'::character varying, 'procesado'::character varying, 'en_transito'::character varying, 'finalizado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT ck_historial_numero CHECK ((numero_cambio > 0))
);


--
-- Name: oferta; Type: TABLE; Schema: pedidos; Owner: -
--

CREATE TABLE pedidos.oferta (
    codigo_oferta character varying(30) NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    porcentaje_descuento numeric(5,2) NOT NULL,
    monto_minimo numeric(12,2) DEFAULT 0 NOT NULL,
    nivel_fidelidad_minimo smallint DEFAULT 1 NOT NULL,
    CONSTRAINT ck_oferta_codigo_normalizado CHECK ((((codigo_oferta)::text = upper(btrim((codigo_oferta)::text))) AND ((codigo_oferta)::text <> ''::text))),
    CONSTRAINT ck_oferta_monto_minimo CHECK ((monto_minimo >= (0)::numeric)),
    CONSTRAINT ck_oferta_nivel CHECK ((nivel_fidelidad_minimo > 0)),
    CONSTRAINT ck_oferta_porcentaje CHECK (((porcentaje_descuento > (0)::numeric) AND (porcentaje_descuento <= (100)::numeric))),
    CONSTRAINT ck_oferta_vigencia CHECK ((fecha_fin >= fecha_inicio))
);


--
-- Name: pedido; Type: TABLE; Schema: pedidos; Owner: -
--

CREATE TABLE pedidos.pedido (
    correo_cliente character varying(255) NOT NULL,
    num_carrito integer NOT NULL,
    fecha_pedido_realizado timestamp with time zone DEFAULT now() NOT NULL,
    fecha_entrega timestamp with time zone,
    modalidad_entrega character varying(20) NOT NULL,
    direccion text,
    costo_entrega numeric(12,2) DEFAULT 0 NOT NULL,
    codigo_oferta character varying(30),
    CONSTRAINT ck_pedido_costo_entrega CHECK ((costo_entrega >= (0)::numeric)),
    CONSTRAINT ck_pedido_fecha_entrega CHECK (((fecha_entrega IS NULL) OR (fecha_entrega >= fecha_pedido_realizado))),
    CONSTRAINT ck_pedido_modalidad CHECK (((modalidad_entrega)::text = ANY ((ARRAY['mensajero'::character varying, 'uber_flash'::character varying, 'correos_cr'::character varying, 'entrega_personal'::character varying])::text[])))
);


--
-- Name: v_estado_pedido; Type: VIEW; Schema: reportes; Owner: -
--

CREATE VIEW reportes.v_estado_pedido AS
 SELECT DISTINCT ON (correo_cliente, num_carrito) correo_cliente,
    num_carrito,
    estado,
    fecha AS fecha_estado
   FROM pedidos.historial_estado h
  ORDER BY correo_cliente, num_carrito, numero_cambio DESC;


--
-- Name: v_existencias; Type: VIEW; Schema: reportes; Owner: -
--

CREATE VIEW reportes.v_existencias AS
 SELECT sku,
    nombre,
    categoria,
    stock,
    item,
    importacion,
    costo_total,
    margen_ganancia,
    tasa_impuesto,
    contrapedido
   FROM catalogo.producto;


--
-- Name: usuario; Type: TABLE; Schema: usuarios; Owner: -
--

CREATE TABLE usuarios.usuario (
    correo character varying(255) NOT NULL,
    contrasena character varying(255) NOT NULL,
    nombre character varying(150) NOT NULL,
    CONSTRAINT ck_usuario_correo CHECK (((correo)::text ~~ '%_@_%'::text)),
    CONSTRAINT ck_usuario_correo_normalizado CHECK (((correo)::text = lower(btrim((correo)::text)))),
    CONSTRAINT ck_usuario_nombre CHECK ((btrim((nombre)::text) <> ''::text))
);


--
-- Name: v_pedidos_por_cliente; Type: VIEW; Schema: reportes; Owner: -
--

CREATE VIEW reportes.v_pedidos_por_cliente AS
 SELECT pe.correo_cliente,
    u.nombre AS cliente,
    cl.cedula,
    pe.num_carrito,
    pe.fecha_pedido_realizado,
    pe.fecha_entrega,
    pe.modalidad_entrega,
    pe.codigo_oferta,
    lineas.subtotal,
    lineas.impuesto,
    pe.costo_entrega,
    ep.estado
   FROM ((((pedidos.pedido pe
     JOIN clientes.cliente cl ON (((cl.correo_usuario)::text = (pe.correo_cliente)::text)))
     JOIN usuarios.usuario u ON (((u.correo)::text = (pe.correo_cliente)::text)))
     JOIN LATERAL ( SELECT COALESCE(sum(((a.cantidad_solicitada)::numeric * a.precio_unitario)), (0)::numeric) AS subtotal,
            COALESCE(sum(((((a.cantidad_solicitada)::numeric * a.precio_unitario) * a.tasa_impuesto_aplicada) / (100)::numeric)), (0)::numeric) AS impuesto
           FROM pedidos.agrega a
          WHERE (((a.correo_cliente)::text = (pe.correo_cliente)::text) AND (a.num_carrito = pe.num_carrito))) lineas ON (true))
     LEFT JOIN reportes.v_estado_pedido ep ON ((((ep.correo_cliente)::text = (pe.correo_cliente)::text) AND (ep.num_carrito = pe.num_carrito))));


--
-- Name: v_registro_mercancia; Type: VIEW; Schema: reportes; Owner: -
--

CREATE VIEW reportes.v_registro_mercancia AS
 SELECT pa.sku,
    p.nombre,
    pa.fecha,
    pa.cantidad,
    pa.correo_administrador
   FROM (inventario.producto_administra pa
     JOIN catalogo.producto p ON (((p.sku)::text = (pa.sku)::text)));


--
-- Name: v_venta_por_producto; Type: VIEW; Schema: reportes; Owner: -
--

CREATE VIEW reportes.v_venta_por_producto AS
 SELECT pe.correo_cliente,
    pe.num_carrito,
    pe.fecha_pedido_realizado,
    p.sku,
    p.nombre AS producto,
    p.categoria,
    a.cantidad_solicitada AS cantidad,
    a.precio_unitario,
    a.tasa_impuesto_aplicada,
    ((a.cantidad_solicitada)::numeric * a.precio_unitario) AS monto
   FROM (((pedidos.pedido pe
     JOIN pedidos.agrega a ON ((((a.correo_cliente)::text = (pe.correo_cliente)::text) AND (a.num_carrito = pe.num_carrito))))
     JOIN catalogo.producto p ON (((p.sku)::text = (a.sku)::text)))
     LEFT JOIN reportes.v_estado_pedido ep ON ((((ep.correo_cliente)::text = (pe.correo_cliente)::text) AND (ep.num_carrito = pe.num_carrito))))
  WHERE ((ep.estado)::text IS DISTINCT FROM 'cancelado'::text);


--
-- Name: sesion; Type: TABLE; Schema: usuarios; Owner: -
--

CREATE TABLE usuarios.sesion (
    correo_usuario character varying(255) NOT NULL,
    token_hash character varying(128) NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now() NOT NULL,
    fecha_vencimiento timestamp with time zone NOT NULL,
    CONSTRAINT ck_sesion_vigencia CHECK ((fecha_vencimiento > fecha_creacion))
);


--
-- Name: administrador administrador_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.administrador
    ADD CONSTRAINT administrador_pkey PRIMARY KEY (correo_usuario);


--
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: catalogo; Owner: -
--

ALTER TABLE ONLY catalogo.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (sku);


--
-- Name: cliente cliente_pkey; Type: CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (correo_usuario);


--
-- Name: cliente_telefono cliente_telefono_pkey; Type: CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.cliente_telefono
    ADD CONSTRAINT cliente_telefono_pkey PRIMARY KEY (correo_usuario, telefono);


--
-- Name: cliente ux_cliente_cedula; Type: CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.cliente
    ADD CONSTRAINT ux_cliente_cedula UNIQUE (cedula);


--
-- Name: factura factura_pkey; Type: CONSTRAINT; Schema: facturacion; Owner: -
--

ALTER TABLE ONLY facturacion.factura
    ADD CONSTRAINT factura_pkey PRIMARY KEY (num_factura);


--
-- Name: factura ux_factura_pago; Type: CONSTRAINT; Schema: facturacion; Owner: -
--

ALTER TABLE ONLY facturacion.factura
    ADD CONSTRAINT ux_factura_pago UNIQUE (num_referencia);


--
-- Name: producto_administra producto_administra_pkey; Type: CONSTRAINT; Schema: inventario; Owner: -
--

ALTER TABLE ONLY inventario.producto_administra
    ADD CONSTRAINT producto_administra_pkey PRIMARY KEY (sku, correo_administrador, fecha);


--
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: pagos; Owner: -
--

ALTER TABLE ONLY pagos.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (num_referencia);


--
-- Name: agrega agrega_pkey; Type: CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.agrega
    ADD CONSTRAINT agrega_pkey PRIMARY KEY (correo_cliente, num_carrito, sku);


--
-- Name: carrito carrito_pkey; Type: CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.carrito
    ADD CONSTRAINT carrito_pkey PRIMARY KEY (correo_cliente, num_carrito);


--
-- Name: historial_estado historial_estado_pkey; Type: CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.historial_estado
    ADD CONSTRAINT historial_estado_pkey PRIMARY KEY (correo_cliente, num_carrito, numero_cambio);


--
-- Name: oferta oferta_pkey; Type: CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.oferta
    ADD CONSTRAINT oferta_pkey PRIMARY KEY (codigo_oferta);


--
-- Name: pedido pedido_pkey; Type: CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.pedido
    ADD CONSTRAINT pedido_pkey PRIMARY KEY (correo_cliente, num_carrito);


--
-- Name: sesion sesion_pkey; Type: CONSTRAINT; Schema: usuarios; Owner: -
--

ALTER TABLE ONLY usuarios.sesion
    ADD CONSTRAINT sesion_pkey PRIMARY KEY (correo_usuario, token_hash);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: usuarios; Owner: -
--

ALTER TABLE ONLY usuarios.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (correo);


--
-- Name: ux_administrador_unico; Type: INDEX; Schema: admin; Owner: -
--

CREATE UNIQUE INDEX ux_administrador_unico ON admin.administrador USING btree ((true));


--
-- Name: ix_producto_categoria; Type: INDEX; Schema: catalogo; Owner: -
--

CREATE INDEX ix_producto_categoria ON catalogo.producto USING btree (categoria);


--
-- Name: ix_producto_administra_administrador; Type: INDEX; Schema: inventario; Owner: -
--

CREATE INDEX ix_producto_administra_administrador ON inventario.producto_administra USING btree (correo_administrador);


--
-- Name: ix_pago_pedido; Type: INDEX; Schema: pagos; Owner: -
--

CREATE INDEX ix_pago_pedido ON pagos.pago USING btree (correo_cliente, num_carrito);


--
-- Name: ix_agrega_sku; Type: INDEX; Schema: pedidos; Owner: -
--

CREATE INDEX ix_agrega_sku ON pedidos.agrega USING btree (sku);


--
-- Name: ix_pedido_fecha; Type: INDEX; Schema: pedidos; Owner: -
--

CREATE INDEX ix_pedido_fecha ON pedidos.pedido USING btree (fecha_pedido_realizado);


--
-- Name: ix_pedido_oferta; Type: INDEX; Schema: pedidos; Owner: -
--

CREATE INDEX ix_pedido_oferta ON pedidos.pedido USING btree (codigo_oferta);


--
-- Name: ux_carrito_activo_por_cliente; Type: INDEX; Schema: pedidos; Owner: -
--

CREATE UNIQUE INDEX ux_carrito_activo_por_cliente ON pedidos.carrito USING btree (correo_cliente) WHERE ((estado_carrito)::text = 'activo'::text);


--
-- Name: ux_sesion_token; Type: INDEX; Schema: usuarios; Owner: -
--

CREATE UNIQUE INDEX ux_sesion_token ON usuarios.sesion USING btree (token_hash);


--
-- Name: administrador tg_administrador_disjunto; Type: TRIGGER; Schema: admin; Owner: -
--

CREATE TRIGGER tg_administrador_disjunto BEFORE INSERT OR UPDATE OF correo_usuario ON admin.administrador FOR EACH ROW EXECUTE FUNCTION public.verificar_usuario_disjunto();


--
-- Name: cliente tg_cliente_disjunto; Type: TRIGGER; Schema: clientes; Owner: -
--

CREATE TRIGGER tg_cliente_disjunto BEFORE INSERT OR UPDATE OF correo_usuario ON clientes.cliente FOR EACH ROW EXECUTE FUNCTION public.verificar_usuario_disjunto();


--
-- Name: producto_administra tg_producto_administra_solo_insercion; Type: TRIGGER; Schema: inventario; Owner: -
--

CREATE TRIGGER tg_producto_administra_solo_insercion BEFORE DELETE OR UPDATE ON inventario.producto_administra FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();


--
-- Name: carrito tg_carrito_fecha_actualizacion; Type: TRIGGER; Schema: pedidos; Owner: -
--

CREATE TRIGGER tg_carrito_fecha_actualizacion BEFORE UPDATE ON pedidos.carrito FOR EACH ROW EXECUTE FUNCTION public.fijar_fecha_actualizacion();


--
-- Name: historial_estado tg_historial_solo_insercion; Type: TRIGGER; Schema: pedidos; Owner: -
--

CREATE TRIGGER tg_historial_solo_insercion BEFORE DELETE OR UPDATE ON pedidos.historial_estado FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();


--
-- Name: administrador administrador_correo_usuario_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.administrador
    ADD CONSTRAINT administrador_correo_usuario_fkey FOREIGN KEY (correo_usuario) REFERENCES usuarios.usuario(correo) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cliente cliente_correo_usuario_fkey; Type: FK CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.cliente
    ADD CONSTRAINT cliente_correo_usuario_fkey FOREIGN KEY (correo_usuario) REFERENCES usuarios.usuario(correo) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cliente_telefono cliente_telefono_correo_usuario_fkey; Type: FK CONSTRAINT; Schema: clientes; Owner: -
--

ALTER TABLE ONLY clientes.cliente_telefono
    ADD CONSTRAINT cliente_telefono_correo_usuario_fkey FOREIGN KEY (correo_usuario) REFERENCES clientes.cliente(correo_usuario) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: factura factura_num_referencia_fkey; Type: FK CONSTRAINT; Schema: facturacion; Owner: -
--

ALTER TABLE ONLY facturacion.factura
    ADD CONSTRAINT factura_num_referencia_fkey FOREIGN KEY (num_referencia) REFERENCES pagos.pago(num_referencia) ON UPDATE CASCADE;


--
-- Name: producto_administra producto_administra_correo_administrador_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: -
--

ALTER TABLE ONLY inventario.producto_administra
    ADD CONSTRAINT producto_administra_correo_administrador_fkey FOREIGN KEY (correo_administrador) REFERENCES admin.administrador(correo_usuario) ON UPDATE CASCADE;


--
-- Name: producto_administra producto_administra_sku_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: -
--

ALTER TABLE ONLY inventario.producto_administra
    ADD CONSTRAINT producto_administra_sku_fkey FOREIGN KEY (sku) REFERENCES catalogo.producto(sku) ON UPDATE CASCADE;


--
-- Name: pago pago_correo_cliente_num_carrito_fkey; Type: FK CONSTRAINT; Schema: pagos; Owner: -
--

ALTER TABLE ONLY pagos.pago
    ADD CONSTRAINT pago_correo_cliente_num_carrito_fkey FOREIGN KEY (correo_cliente, num_carrito) REFERENCES pedidos.pedido(correo_cliente, num_carrito) ON UPDATE CASCADE;


--
-- Name: agrega agrega_correo_cliente_num_carrito_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.agrega
    ADD CONSTRAINT agrega_correo_cliente_num_carrito_fkey FOREIGN KEY (correo_cliente, num_carrito) REFERENCES pedidos.carrito(correo_cliente, num_carrito) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agrega agrega_sku_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.agrega
    ADD CONSTRAINT agrega_sku_fkey FOREIGN KEY (sku) REFERENCES catalogo.producto(sku) ON UPDATE CASCADE;


--
-- Name: carrito carrito_correo_cliente_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.carrito
    ADD CONSTRAINT carrito_correo_cliente_fkey FOREIGN KEY (correo_cliente) REFERENCES clientes.cliente(correo_usuario) ON UPDATE CASCADE;


--
-- Name: historial_estado historial_estado_correo_cliente_num_carrito_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.historial_estado
    ADD CONSTRAINT historial_estado_correo_cliente_num_carrito_fkey FOREIGN KEY (correo_cliente, num_carrito) REFERENCES pedidos.pedido(correo_cliente, num_carrito) ON UPDATE CASCADE;


--
-- Name: pedido pedido_codigo_oferta_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.pedido
    ADD CONSTRAINT pedido_codigo_oferta_fkey FOREIGN KEY (codigo_oferta) REFERENCES pedidos.oferta(codigo_oferta) ON UPDATE CASCADE;


--
-- Name: pedido pedido_correo_cliente_num_carrito_fkey; Type: FK CONSTRAINT; Schema: pedidos; Owner: -
--

ALTER TABLE ONLY pedidos.pedido
    ADD CONSTRAINT pedido_correo_cliente_num_carrito_fkey FOREIGN KEY (correo_cliente, num_carrito) REFERENCES pedidos.carrito(correo_cliente, num_carrito) ON UPDATE CASCADE;


--
-- Name: sesion sesion_correo_usuario_fkey; Type: FK CONSTRAINT; Schema: usuarios; Owner: -
--

ALTER TABLE ONLY usuarios.sesion
    ADD CONSTRAINT sesion_correo_usuario_fkey FOREIGN KEY (correo_usuario) REFERENCES usuarios.usuario(correo) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


