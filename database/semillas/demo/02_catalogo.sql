-- Datos de prueba: categorías, subcategorías y productos. SOLO para desarrollo local.
-- El catálogo real entra por la importación del Excel (RF-57), no por semillas.
-- Incluye a propósito los casos que exige probar el SRS:
--   * con existencias ........................ la mayoría
--   * sin existencias + contrapedido (se ve) .. MTG-002            (RF-07, RN-03)
--   * sin existencias ni contrapedido (oculto)  FUN-003            (RF-08)
--   * descontinuado (oculto) ................. VDJ-003            (RF-18)
--   * margen negativo / liquidación .......... LIQ-001            (RN-02, RF-43)
-- Costos en colones. Los precios NO se guardan: los calcula el motor de precios.
-- Las existencias están en 03_inventario.sql.

INSERT INTO catalogo.categoria (nombre) VALUES
    ('Juegos de cartas (TCG)'), ('Coleccionables'), ('Juguetes'), ('Videojuegos')
ON CONFLICT DO NOTHING;

INSERT INTO catalogo.subcategoria (categoria_id, nombre)
SELECT c.id, v.sub
FROM (VALUES
        ('Juegos de cartas (TCG)', 'Pokémon'),
        ('Juegos de cartas (TCG)', 'Magic: The Gathering'),
        ('Juegos de cartas (TCG)', 'Yu-Gi-Oh!'),
        ('Juegos de cartas (TCG)', 'Accesorios TCG'),
        ('Coleccionables',         'Funko Pop'),
        ('Coleccionables',         'Figuras de anime'),
        ('Juguetes',               'Construcción'),
        ('Juguetes',               'Rompecabezas'),
        ('Videojuegos',            'Nintendo Switch'),
        ('Videojuegos',            'PlayStation'),
        ('Videojuegos',            'Accesorios')
     ) AS v(cat, sub)
JOIN catalogo.categoria c ON c.nombre = v.cat
ON CONFLICT DO NOTHING;

WITH datos (sku, nombre, cat, sub, costo, imp, margen, contrapedido, estado, proveedor, descripcion) AS (
    VALUES
    ('PKM-001', 'Sobre Pokémon TCG Escarlata y Púrpura',   'Juegos de cartas (TCG)', 'Pokémon',               2500, 20,  25, false, 'activo', 'Distribuidora TCG', 'Sobre de 10 cartas.'),
    ('PKM-002', 'Pokémon TCG Elite Trainer Box',           'Juegos de cartas (TCG)', 'Pokémon',              18000, 20,  25, true,  'activo', 'Distribuidora TCG', 'Incluye 9 sobres, dados y accesorios.'),
    ('MTG-001', 'Magic: The Gathering — Commander Deck',   'Juegos de cartas (TCG)', 'Magic: The Gathering', 22000, 20,  30, true,  'activo', 'Distribuidora TCG', 'Mazo preconstruido de 100 cartas.'),
    ('MTG-002', 'Magic: The Gathering — Play Booster',     'Juegos de cartas (TCG)', 'Magic: The Gathering',  3000, 20,  25, true,  'activo', 'Distribuidora TCG', 'Sin existencias: disponible por contrapedido.'),
    ('YGO-001', 'Yu-Gi-Oh! Structure Deck',                'Juegos de cartas (TCG)', 'Yu-Gi-Oh!',             7000, 20,  25, false, 'activo', 'Distribuidora TCG', 'Mazo de estructura listo para jugar.'),
    ('LIQ-001', 'Protectores de cartas (empaque dañado)',  'Juegos de cartas (TCG)', 'Accesorios TCG',        1000, 20, -10, false, 'activo', 'Distribuidora TCG', 'Liquidación: se vende bajo el costo (margen negativo).'),
    ('FUN-001', 'Funko Pop! Goku',                         'Coleccionables',         'Funko Pop',             9000, 15,  35, true,  'activo', 'Importadora Pop',   'Figura de vinilo de 9,5 cm.'),
    ('FUN-002', 'Funko Pop! Pikachu',                      'Coleccionables',         'Funko Pop',             9000, 15,  35, true,  'activo', 'Importadora Pop',   'Figura de vinilo de 9,5 cm.'),
    ('FUN-003', 'Funko Pop! edición limitada convención',  'Coleccionables',         'Funko Pop',            15000, 15,  40, false, 'activo', 'Importadora Pop',   'Sin existencias y sin contrapedido: NO debe verse en el catálogo.'),
    ('ANI-001', 'Figura Nendoroid Hatsune Miku',           'Coleccionables',         'Figuras de anime',     30000, 15,  30, true,  'activo', 'Importadora Pop',   'Figura articulada con accesorios.'),
    ('JUG-001', 'LEGO Star Wars — Caza TIE',               'Juguetes',               'Construcción',         35000, 15,  25, false, 'activo', 'Juguetes CR',       'Set de construcción de 432 piezas.'),
    ('JUG-002', 'Rompecabezas 1000 piezas — mapa fantasía','Juguetes',               'Rompecabezas',          8000, 15,  30, false, 'activo', 'Juguetes CR',       'Rompecabezas de 70 x 50 cm.'),
    ('VDJ-001', 'The Legend of Zelda: Tears of the Kingdom','Videojuegos',           'Nintendo Switch',      28000, 20,  20, true,  'activo', 'Games Import',      'Juego físico para Nintendo Switch.'),
    ('VDJ-002', 'Control DualSense',                       'Videojuegos',            'Accesorios',           32000, 20,  20, true,  'activo', 'Games Import',      'Control inalámbrico para PS5.'),
    ('VDJ-003', 'Juego de PS4 descontinuado',              'Videojuegos',            'PlayStation',          15000, 20,  20, false, 'descontinuado', 'Games Import', 'Descontinuado: NO debe verse en el catálogo.')
)
INSERT INTO catalogo.producto (sku, nombre, subcategoria_id, costo_item, porcentaje_importacion,
                               margen_ganancia, admite_contrapedido, estado, proveedor, descripcion)
SELECT d.sku, d.nombre, s.id, d.costo, d.imp, d.margen, d.contrapedido, d.estado, d.proveedor, d.descripcion
FROM   datos d
JOIN   catalogo.categoria    c ON c.nombre = d.cat
JOIN   catalogo.subcategoria s ON s.categoria_id = c.id AND s.nombre = d.sub
ON CONFLICT (sku) DO NOTHING;
