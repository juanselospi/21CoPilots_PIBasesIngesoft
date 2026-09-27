-- Parámetros de negocio editables por el administrador (aprobado #10, DD-14).
-- Los valores fijados por el SRS o por ley que NO son editables (impuesto de
-- venta de 13 % por RES-06, umbral de alerta de 2 unidades por RN-04) viven en
-- la configuración de apps/server, no aquí.

INSERT INTO admin.parametro_negocio (clave, valor, descripcion) VALUES
    ('monto_minimo_descuento', '100000',
     'Monto mínimo de compra, en colones, para aplicar el descuento por nivel (RN-09, en conflicto)'),
    ('emisor_razon_social', 'POR DEFINIR',
     'Razón social de la sociedad que factura (RN-18). Pendiente de que el cliente la entregue'),
    ('emisor_cedula_juridica', 'POR DEFINIR',
     'Cédula jurídica de la sociedad que factura (RN-18). Pendiente de que el cliente la entregue'),
    ('version_terminos_vigente', '1.0',
     'Versión de los términos y condiciones que se registra al aceptar (RF-38)')
ON CONFLICT (clave) DO NOTHING;
