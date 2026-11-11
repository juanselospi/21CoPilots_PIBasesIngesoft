-- Producto eliminado que conserva su historial (023, C-28)

SELECT pg_temp.producto_prueba('PRB-ELI', 4);

SELECT pg_temp.debe_funcionar('Se registra un ingreso del producto',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad, tipo)
      VALUES ('PRB-ELI', pg_temp.admin_prueba(), 4, 'ingreso')$$);

SELECT pg_temp.debe_funcionar('Un producto con historial pasa a eliminado (RF-18)',
    $$UPDATE catalogo.producto SET estado = 'eliminado' WHERE sku = 'PRB-ELI'$$);

SELECT pg_temp.debe_cumplirse('El producto eliminado conserva sus movimientos',
    (SELECT count(*) FROM inventario.producto_administra WHERE sku = 'PRB-ELI') = 1);

SELECT pg_temp.debe_cumplirse('Las existencias vigentes no incluyen productos eliminados',
    NOT EXISTS (SELECT 1 FROM reportes.v_existencias WHERE sku = 'PRB-ELI'));

SELECT pg_temp.debe_fallar('Su historial sigue sin poderse borrar',
    $$DELETE FROM catalogo.producto WHERE sku = 'PRB-ELI'$$, '23503');

SELECT pg_temp.debe_fallar('Su código queda reservado',
    $$INSERT INTO catalogo.producto (sku, nombre, categoria, item)
      SELECT 'PRB-ELI', 'Otro', categoria, 1 FROM catalogo.producto WHERE sku = 'PRB-ELI'$$, '23505');
