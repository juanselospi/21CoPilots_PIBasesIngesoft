-- Escala de niveles de fidelidad. El sistema la necesita para arrancar.
--   RN-08 (confirmada): nivel 1 con 0 compras, 2 con 1, 3 con 2 y 4 con 4.
--   RN-09 (EN CONFLICTO, ver nota 1 del SRS): nivel 2 un 5 %, 3 un 10 %, 4 un 15 %.
-- Cuando el cliente resuelva el conflicto, el administrador edita esta tabla;
-- no hace falta una migración.

INSERT INTO clientes.nivel_fidelidad (nivel, compras_minimas, porcentaje_descuento) VALUES
    (1, 0,  0),
    (2, 1,  5),
    (3, 2, 10),
    (4, 4, 15)
ON CONFLICT (nivel) DO NOTHING;
