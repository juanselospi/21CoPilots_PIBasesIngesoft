-- Restricciones del catálogo

SELECT pg_temp.debe_funcionar('Se crea un producto con SKU normalizado',
    $$SELECT pg_temp.producto_prueba('PRB-001')$$);

SELECT pg_temp.debe_fallar('Un SKU en minúsculas se rechaza (se guarda normalizado, RF-01)',
    $$INSERT INTO catalogo.producto (sku, nombre, categoria, item)
      VALUES ('prb-002', 'x', 'Categoría', 100)$$, '23514');

SELECT pg_temp.debe_fallar('Un SKU repetido se rechaza (RF-01, RF-59)',
    $$SELECT pg_temp.producto_prueba('PRB-001')$$, '23505');

SELECT pg_temp.debe_funcionar('Se asignan item e importación',
    $$UPDATE catalogo.producto SET item = 100, importacion = 20 WHERE sku = 'PRB-001'$$);

SELECT pg_temp.debe_cumplirse('El costo total es item + importación % (formula-precio.md)',
    (SELECT costo_total FROM catalogo.producto WHERE sku = 'PRB-001') = 120);

SELECT pg_temp.debe_fallar('El costo total no se puede escribir a mano',
    $$UPDATE catalogo.producto SET costo_total = 1 WHERE sku = 'PRB-001'$$, '428C9');

SELECT pg_temp.debe_funcionar('El margen negativo se acepta (RN-02)',
    $$UPDATE catalogo.producto SET margen_ganancia = -10 WHERE sku = 'PRB-001'$$);

SELECT pg_temp.debe_fallar('Un margen de -100 % o menos se rechaza (precio no positivo)',
    $$UPDATE catalogo.producto SET margen_ganancia = -100 WHERE sku = 'PRB-001'$$, '23514');

SELECT pg_temp.debe_fallar('Un item negativo se rechaza',
    $$UPDATE catalogo.producto SET item = -1 WHERE sku = 'PRB-001'$$, '23514');

SELECT pg_temp.debe_fallar('Una importación negativa se rechaza',
    $$UPDATE catalogo.producto SET importacion = -1 WHERE sku = 'PRB-001'$$, '23514');

SELECT pg_temp.debe_fallar('Una tasa de impuesto mayor a 100 % se rechaza',
    $$UPDATE catalogo.producto SET tasa_impuesto = 101 WHERE sku = 'PRB-001'$$, '23514');

SELECT pg_temp.debe_fallar('El stock no puede quedar negativo (RN-13)',
    $$UPDATE catalogo.producto SET stock = -1 WHERE sku = 'PRB-001'$$, '23514');

SELECT pg_temp.debe_fallar('Un producto sin categoría se rechaza',
    $$INSERT INTO catalogo.producto (sku, nombre, categoria, item)
      VALUES ('PRB-003', 'x', '  ', 100)$$, '23514');
