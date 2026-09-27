-- Restricciones del catálogo

SELECT pg_temp.debe_funcionar('Se crea un producto con SKU normalizado',
    $$SELECT pg_temp.producto_prueba('PRB-001')$$);

SELECT pg_temp.debe_fallar('Un SKU en minúsculas se rechaza (se guarda normalizado, RF-01)',
    $$INSERT INTO catalogo.producto (sku, nombre, subcategoria_id, costo_item)
      VALUES ('prb-002', 'x', pg_temp.subcategoria_prueba(), 100)$$, '23514');

SELECT pg_temp.debe_fallar('Un SKU repetido se rechaza (RF-01, RF-59)',
    $$SELECT pg_temp.producto_prueba('PRB-001')$$, '23505');

SELECT pg_temp.debe_funcionar('El margen negativo se acepta (RN-02)',
    $$UPDATE catalogo.producto SET margen_ganancia = -10 WHERE sku = 'PRB-001'$$);

SELECT pg_temp.debe_fallar('Un margen de -100 % o menos se rechaza (precio no positivo)',
    $$UPDATE catalogo.producto SET margen_ganancia = -100 WHERE sku = 'PRB-001'$$, '23514');

SELECT pg_temp.debe_fallar('Un costo negativo se rechaza',
    $$UPDATE catalogo.producto SET costo_item = -1 WHERE sku = 'PRB-001'$$, '23514');

SELECT pg_temp.debe_fallar('Un estado de producto desconocido se rechaza',
    $$UPDATE catalogo.producto SET estado = 'borrado' WHERE sku = 'PRB-001'$$, '23514');

SELECT pg_temp.debe_fallar('Una categoría repetida con otras mayúsculas se rechaza',
    $$INSERT INTO catalogo.categoria (nombre) VALUES ('categoría de prueba ')$$, '23505');
