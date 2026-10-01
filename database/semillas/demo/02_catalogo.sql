-- Datos de prueba: productos. SOLO para desarrollo local.
-- El catálogo real entra por la importación del Excel (RF-57), no por semillas.
-- Incluye a propósito los casos que exige probar el SRS:
--   * con existencias ........................ la mayoría
--   * sin existencias + contrapedido (se ve) .. MTG-002            (RF-07, RN-03)
--   * sin existencias ni contrapedido (oculto)  FUN-003            (RF-08)
--   * margen negativo / liquidación .......... LIQ-001            (RN-02, RF-43)
-- item en colones; importacion y margen en porcentaje. costo_total lo calcula
-- la base de datos y el precio de venta el motor de precios.
-- El stock ya incluye el registro de mercancía (03) y las ventas (04).

INSERT INTO catalogo.producto (sku, nombre, categoria, item, importacion, margen_ganancia,
                               contrapedido, stock, proveedor, descripcion) VALUES
    ('PKM-001', 'Sobre Pokémon TCG Escarlata y Púrpura',    'Juegos de cartas (TCG)',  2500, 20,  25, false, 48, 'Distribuidora TCG', 'Sobre de 10 cartas.'),
    ('PKM-002', 'Pokémon TCG Elite Trainer Box',            'Juegos de cartas (TCG)', 18000, 20,  25, true,   5, 'Distribuidora TCG', 'Incluye 9 sobres, dados y accesorios.'),
    ('MTG-001', 'Magic: The Gathering — Commander Deck',    'Juegos de cartas (TCG)', 22000, 20,  30, true,   3, 'Distribuidora TCG', 'Mazo preconstruido de 100 cartas.'),
    ('MTG-002', 'Magic: The Gathering — Play Booster',      'Juegos de cartas (TCG)',  3000, 20,  25, true,   0, 'Distribuidora TCG', 'Sin existencias: disponible por contrapedido.'),
    ('YGO-001', 'Yu-Gi-Oh! Structure Deck',                 'Juegos de cartas (TCG)',  7000, 20,  25, false, 11, 'Distribuidora TCG', 'Mazo de estructura listo para jugar.'),
    ('LIQ-001', 'Protectores de cartas (empaque dañado)',   'Juegos de cartas (TCG)',  1000, 20, -10, false,  6, 'Distribuidora TCG', 'Liquidación: se vende bajo el costo (margen negativo).'),
    ('FUN-001', 'Funko Pop! Goku',                          'Coleccionables',          9000, 15,  35, true,   2, 'Importadora Pop',   'Figura de vinilo de 9,5 cm.'),
    ('FUN-002', 'Funko Pop! Pikachu',                       'Coleccionables',          9000, 15,  35, true,   4, 'Importadora Pop',   'Figura de vinilo de 9,5 cm.'),
    ('FUN-003', 'Funko Pop! edición limitada convención',   'Coleccionables',         15000, 15,  40, false,  0, 'Importadora Pop',   'Sin existencias y sin contrapedido: NO debe verse en el catálogo.'),
    ('ANI-001', 'Figura Nendoroid Hatsune Miku',            'Coleccionables',         30000, 15,  30, true,   2, 'Importadora Pop',   'Figura articulada con accesorios.'),
    ('JUG-001', 'LEGO Star Wars — Caza TIE',                'Juguetes',               35000, 15,  25, false,  3, 'Juguetes CR',       'Set de construcción de 432 piezas.'),
    ('JUG-002', 'Rompecabezas 1000 piezas — mapa fantasía', 'Juguetes',                8000, 15,  30, false,  9, 'Juguetes CR',       'Rompecabezas de 70 x 50 cm.'),
    ('VDJ-001', 'The Legend of Zelda: Tears of the Kingdom','Videojuegos',            28000, 20,  20, true,   7, 'Games Import',      'Juego físico para Nintendo Switch.'),
    ('VDJ-002', 'Control DualSense',                        'Videojuegos',            32000, 20,  20, true,   5, 'Games Import',      'Control inalámbrico para PS5.')
ON CONFLICT (sku) DO NOTHING;
