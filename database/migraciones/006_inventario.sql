-- 006: crea el historial de movimientos de inventario.

-- Registra cada entrada o salida de mercancía realizada por un administrador.
-- El stock actual se guarda en PRODUCTO; esta tabla conserva el historial.
CREATE TABLE inventario.producto_administra (
    sku VARCHAR(50) NOT NULL
        REFERENCES catalogo.producto (sku) 
        ON UPDATE CASCADE,

    correo_administrador  VARCHAR(255)  NOT NULL
        REFERENCES admin.administrador (correo_usuario) 
        ON UPDATE CASCADE,
    
    fecha   TIMESTAMPTZ   NOT NULL DEFAULT now(),

    -- Positivo = entrada de mercancía, negativo = salida.
    cantidad    INTEGER NOT NULL,  

    PRIMARY KEY (sku, correo_administrador, fecha),
    CONSTRAINT ck_producto_administra_cantidad CHECK (cantidad <> 0)
);

-- Facilita las búsquedas de movimientos realizados por un administrador.
CREATE INDEX ix_producto_administra_administrador
    ON inventario.producto_administra (correo_administrador);

-- El historial no se puede modificar ni eliminar una vez registrado.
CREATE TRIGGER tg_producto_administra_solo_insercion
    BEFORE UPDATE OR DELETE ON inventario.producto_administra
    FOR EACH ROW EXECUTE FUNCTION public.rechazar_modificacion();
