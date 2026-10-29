-- Familias de productos y herencia de importación y margen (011, C-15)

SELECT pg_temp.debe_funcionar('Se crea una familia con su importación y margen',
    $$INSERT INTO catalogo.familia (nombre, importacion, margen_ganancia)
      VALUES ('Familia de prueba', 20, 25)$$);

SELECT pg_temp.debe_fallar('Una familia con nombre vacío se rechaza',
    $$INSERT INTO catalogo.familia (nombre) VALUES ('  ')$$, '23514');

SELECT pg_temp.debe_fallar('Una familia repetida se rechaza',
    $$INSERT INTO catalogo.familia (nombre) VALUES ('Familia de prueba')$$, '23505');

SELECT pg_temp.debe_fallar('Una importación negativa en la familia se rechaza',
    $$INSERT INTO catalogo.familia (nombre, importacion) VALUES ('Mala 1', -1)$$, '23514');

SELECT pg_temp.debe_fallar('Un margen de -100 % en la familia se rechaza',
    $$INSERT INTO catalogo.familia (nombre, margen_ganancia) VALUES ('Mala 2', -100)$$, '23514');

SELECT pg_temp.debe_fallar('Un producto con una familia inexistente se rechaza',
    $$INSERT INTO catalogo.producto (sku, nombre, categoria, item)
      VALUES ('PRB-FAM-0', 'x', 'No existe', 100)$$, '23503');

SELECT pg_temp.debe_funcionar('Un producto sin importación ni margen propios se acepta (hereda)',
    $$INSERT INTO catalogo.producto (sku, nombre, categoria, item)
      VALUES ('PRB-FAM-1', 'Hereda', 'Familia de prueba', 100)$$);

SELECT pg_temp.debe_cumplirse('Sin valor propio, importación y margen quedan en NULL',
    (SELECT importacion IS NULL AND margen_ganancia IS NULL
     FROM catalogo.producto WHERE sku = 'PRB-FAM-1'));

SELECT pg_temp.debe_cumplirse('La vista hereda importación, margen y costo total de la familia',
    (SELECT importacion = 20 AND margen_ganancia = 25 AND costo_total = 120
            AND importacion_heredada AND margen_heredado
     FROM reportes.v_existencias WHERE sku = 'PRB-FAM-1'));

SELECT pg_temp.debe_funcionar('Un producto puede sobrescribir el margen de su familia',
    $$INSERT INTO catalogo.producto (sku, nombre, categoria, item, margen_ganancia)
      VALUES ('PRB-FAM-2', 'Sobrescribe', 'Familia de prueba', 100, 50)$$);

SELECT pg_temp.debe_cumplirse('La vista usa el margen propio y hereda la importación',
    (SELECT importacion = 20 AND margen_ganancia = 50
            AND importacion_heredada AND NOT margen_heredado
     FROM reportes.v_existencias WHERE sku = 'PRB-FAM-2'));

SELECT pg_temp.debe_funcionar('Cambiar el margen de la familia',
    $$UPDATE catalogo.familia SET margen_ganancia = 30 WHERE nombre = 'Familia de prueba'$$);

SELECT pg_temp.debe_cumplirse('El cambio llega al que hereda y no al que sobrescribe',
    (SELECT margen_ganancia FROM reportes.v_existencias WHERE sku = 'PRB-FAM-1') = 30
    AND (SELECT margen_ganancia FROM reportes.v_existencias WHERE sku = 'PRB-FAM-2') = 50);

SELECT pg_temp.debe_funcionar('Renombrar una familia',
    $$UPDATE catalogo.familia SET nombre = 'Familia renombrada' WHERE nombre = 'Familia de prueba'$$);

SELECT pg_temp.debe_cumplirse('El nombre nuevo se propaga a sus productos (ON UPDATE CASCADE)',
    (SELECT count(*) FROM catalogo.producto WHERE categoria = 'Familia renombrada') = 2);

SELECT pg_temp.debe_fallar('Una familia con productos no se puede borrar',
    $$DELETE FROM catalogo.familia WHERE nombre = 'Familia renombrada'$$, '23503');

SELECT pg_temp.debe_cumplirse('Todo producto de las semillas está ligado a una familia existente',
    NOT EXISTS (SELECT 1 FROM catalogo.producto p
                LEFT JOIN catalogo.familia f ON f.nombre = p.categoria
                WHERE f.nombre IS NULL));
