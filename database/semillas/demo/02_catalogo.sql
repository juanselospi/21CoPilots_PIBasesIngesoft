-- Datos de prueba: familias y productos. SOLO para desarrollo local.
-- El catálogo real entra por la importación del Excel (RF-57), no por semillas.
-- Montos en dólares (C-03); importación y margen en porcentaje.
--
-- Las familias van primero porque producto.categoria es llave foránea a
-- familia (011). Un producto con importación o margen en NULL usa el de su
-- familia; con valor propio, lo sobrescribe (C-15). «Funko Pop» y «Discos de
-- vinilo» son las dos familias nuevas que pidió el profesor, con 5 productos
-- cada una (requerimientos-profesor.md § 8).
--
-- Incluye a propósito los casos que exige probar el SRS:
--   * con existencias ........................ la mayoría
--   * sin existencias + contrapedido (se ve) .. MTG-002, VIN-005   (RF-07, RN-03)
--   * sin existencias ni contrapedido (oculto)  FUN-003            (RF-08)
--   * margen negativo / liquidación .......... LIQ-001            (RN-02, RF-43)
--   * existencias bajas (alerta) .............. FUN-001, ANI-001, VIN-003
--   * margen propio (sobrescribe) ............. MTG-001, LIQ-001, JUG-002, FUN-003, VIN-004
--   * importación propia (sobrescribe) ........ ANI-001
--
-- El precio de venta lo calcula el motor de precios. El stock ya incluye el
-- registro de mercancía (03) y las ventas y reposiciones de los pedidos (04).

INSERT INTO catalogo.familia (nombre, descripcion, importacion, margen_ganancia) VALUES
    ('Juegos de cartas (TCG)', 'Sobres, mazos y accesorios de juegos de cartas coleccionables.', 20, 25),
    ('Coleccionables',         'Figuras articuladas y artículos de colección.',                15, 35),
    ('Juguetes',               'Sets de construcción y rompecabezas.',                         15, 25),
    ('Videojuegos',            'Juegos físicos y accesorios de consola.',                      20, 20),
    ('Funko Pop',              'Figuras de vinilo Funko Pop!.',                                15, 40),
    ('Discos de vinilo',       'Bandas sonoras de videojuegos y anime en vinilo.',             25, 30)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO catalogo.producto (sku, nombre, categoria, item, importacion, margen_ganancia,
                               contrapedido, stock, proveedor, descripcion) VALUES
    -- Juegos de cartas (TCG): 20 % de importación y 25 % de margen
    ('PKM-001', 'Sobre Pokémon TCG Escarlata y Púrpura',    'Juegos de cartas (TCG)',  4.00, NULL, NULL, false, 48, 'Distribuidora TCG', 'Sobre de 10 cartas.'),
    ('PKM-002', 'Pokémon TCG Elite Trainer Box',            'Juegos de cartas (TCG)', 35.00, NULL, NULL, true,   5, 'Distribuidora TCG', 'Incluye 9 sobres, dados y accesorios.'),
    ('MTG-001', 'Magic: The Gathering — Commander Deck',    'Juegos de cartas (TCG)', 40.00, NULL,   30, true,   3, 'Distribuidora TCG', 'Mazo preconstruido de 100 cartas. Margen propio de 30 %.'),
    ('MTG-002', 'Magic: The Gathering — Play Booster',      'Juegos de cartas (TCG)',  5.50, NULL, NULL, true,   0, 'Distribuidora TCG', 'Sin existencias: disponible por contrapedido.'),
    ('YGO-001', 'Yu-Gi-Oh! Structure Deck',                 'Juegos de cartas (TCG)', 12.00, NULL, NULL, false, 11, 'Distribuidora TCG', 'Mazo de estructura listo para jugar.'),
    ('LIQ-001', 'Protectores de cartas (empaque dañado)',   'Juegos de cartas (TCG)',  2.00, NULL,  -10, false,  6, 'Distribuidora TCG', 'Liquidación: se vende bajo el costo (margen negativo).'),

    -- Coleccionables: 15 % y 35 %
    ('ANI-001', 'Figura Nendoroid Hatsune Miku',            'Coleccionables',         55.00,   25, NULL, true,   2, 'Importadora Pop',   'Figura articulada con accesorios. Importación propia de 25 %.'),

    -- Juguetes: 15 % y 25 %
    ('JUG-001', 'LEGO Star Wars — Caza TIE',                'Juguetes',               60.00, NULL, NULL, false,  3, 'Juguetes CR',       'Set de construcción de 432 piezas.'),
    ('JUG-002', 'Rompecabezas 1000 piezas — mapa fantasía', 'Juguetes',               16.00, NULL,   30, false,  9, 'Juguetes CR',       'Rompecabezas de 70 x 50 cm. Margen propio de 30 %.'),

    -- Videojuegos: 20 % y 20 %
    ('VDJ-001', 'The Legend of Zelda: Tears of the Kingdom','Videojuegos',            50.00, NULL, NULL, true,   7, 'Games Import',      'Juego físico para Nintendo Switch.'),
    ('VDJ-002', 'Control DualSense',                        'Videojuegos',            55.00, NULL, NULL, true,   5, 'Games Import',      'Control inalámbrico para PS5.'),

    -- Funko Pop (familia nueva): 15 % y 40 %
    ('FUN-001', 'Funko Pop! Goku',                          'Funko Pop',               9.00, NULL, NULL, true,   2, 'Importadora Pop',   'Figura de vinilo de 9,5 cm.'),
    ('FUN-002', 'Funko Pop! Pikachu',                       'Funko Pop',               9.00, NULL, NULL, true,   4, 'Importadora Pop',   'Figura de vinilo de 9,5 cm.'),
    ('FUN-003', 'Funko Pop! edición limitada convención',   'Funko Pop',              18.00, NULL,   60, false,  0, 'Importadora Pop',   'Sin existencias y sin contrapedido: NO debe verse en el catálogo. Margen propio de 60 %.'),
    ('FUN-004', 'Funko Pop! Spider-Man',                    'Funko Pop',               9.00, NULL, NULL, false,  6, 'Importadora Pop',   'Figura de vinilo de 9,5 cm.'),
    ('FUN-005', 'Funko Pop! Hatsune Miku',                  'Funko Pop',              10.00, NULL, NULL, false,  5, 'Importadora Pop',   'Figura de vinilo de 9,5 cm.'),

    -- Discos de vinilo (familia nueva): 25 % y 30 %
    ('VIN-001', 'Vinilo — The Legend of Zelda: Ocarina of Time (banda sonora)', 'Discos de vinilo', 30.00, NULL, NULL, false, 4, 'Vinilos Retro', 'LP de 180 g.'),
    ('VIN-002', 'Vinilo — Final Fantasy VII (banda sonora)',                    'Discos de vinilo', 32.00, NULL, NULL, true,  3, 'Vinilos Retro', 'Edición de dos discos.'),
    ('VIN-003', 'Vinilo — Cowboy Bebop (banda sonora)',                         'Discos de vinilo', 30.00, NULL, NULL, false, 2, 'Vinilos Retro', 'LP de 180 g.'),
    ('VIN-004', 'Vinilo — Studio Ghibli (selección)',                           'Discos de vinilo', 36.00, NULL,   20, false, 3, 'Vinilos Retro', 'Margen propio de 20 %.'),
    ('VIN-005', 'Vinilo — Undertale (banda sonora)',                            'Discos de vinilo', 26.00, NULL, NULL, true,  0, 'Vinilos Retro', 'Sin existencias: disponible por contrapedido.')
ON CONFLICT (sku) DO NOTHING;
