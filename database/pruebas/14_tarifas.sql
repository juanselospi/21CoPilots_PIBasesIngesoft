-- Tarifas de envío por modalidad (018, C-24)

SELECT pg_temp.debe_cumplirse('Las cuatro modalidades tienen su tarifa',
    (SELECT count(*) = 4 FROM pedidos.tarifa_envio));

SELECT pg_temp.debe_funcionar('Se cambia el monto de una tarifa',
    $$UPDATE pedidos.tarifa_envio SET monto = 3.50 WHERE modalidad = 'mensajero'$$);

SELECT pg_temp.debe_fallar('Un monto negativo se rechaza',
    $$UPDATE pedidos.tarifa_envio SET monto = -1 WHERE modalidad = 'uber_flash'$$, '23514');

SELECT pg_temp.debe_fallar('Una modalidad que no existe se rechaza',
    $$INSERT INTO pedidos.tarifa_envio (modalidad, monto) VALUES ('dron', 5)$$, '23514');

SELECT pg_temp.debe_fallar('Una modalidad repetida se rechaza',
    $$INSERT INTO pedidos.tarifa_envio (modalidad) VALUES ('correos_cr')$$, '23505');
