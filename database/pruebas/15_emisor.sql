-- Emisor de las facturas (019, C-24)

SELECT pg_temp.debe_cumplirse('Hay un emisor con sus datos',
    (SELECT count(*) = 1 FROM facturacion.emisor));

SELECT pg_temp.debe_funcionar('Se cambian los datos del emisor',
    $$UPDATE facturacion.emisor SET cedula_juridica = '3-101-123456'$$);

SELECT pg_temp.debe_fallar('No puede haber un segundo emisor',
    $$INSERT INTO facturacion.emisor (razon_social, cedula_juridica, direccion) VALUES ('Otro', '1', 'x')$$, '23505');

SELECT pg_temp.debe_fallar('La columna única no puede ser false',
    $$INSERT INTO facturacion.emisor (unica, razon_social, cedula_juridica, direccion) VALUES (false, 'Otro', '1', 'x')$$, '23514');

SELECT pg_temp.debe_fallar('La cédula jurídica no puede quedar vacía',
    $$UPDATE facturacion.emisor SET cedula_juridica = ' '$$, '23514');
