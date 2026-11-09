# Guion de la demostración del Sprint 2

Presentación en vivo: martes 10 de noviembre de 2026 · Equipo Twenty One CoPilots

Este guion recorre el flujo completo que pide el PDF del Sprint 2: administrar familias, productos y pedidos desde el panel, y completar una compra como cliente. La columna «Quién» es una propuesta según lo que implementó cada integrante; se puede ajustar en la demo interna.

## Antes de empezar

1. Estar en la última versión de `develop`.
2. En `apps/client` y `apps/server`, correr `npm ci`.
3. En `database`, correr `npm run db:up` y después `npm run db:reset`. Esto borra la base local y la deja con los datos de prueba.
4. Levantar el servidor con `npm run start` en `apps/server` y el cliente con `npm run dev` en `apps/client`.
5. Abrir dos ventanas: una normal para el panel y una de incógnito para la tienda, así cada una tiene su propia sesión.

| Cuenta | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@dchobbies.test` | `Admin123!` |
| Cliente de la demo | La que se crea en el paso 6 | `Clave123!` |

## Recorrido

| # | Quién | Qué hacer | Qué se tiene que ver |
|---|---|---|---|
| 1 | Jeferson | Panel → Familias → «Agregar familia»: `Figuras Anime`, importación 10 %, margen 25 %. | La familia aparece en la lista. |
| 2 | Jeferson | Panel → Productos → «Agregar producto»: `Figura Demo`, familia `Figuras Anime`, costo 100, sin margen propio, 3 unidades. | El producto hereda el margen de la familia. Precio final cerca de $155. |
| 3 | Jeferson | Editar la familia y cambiar el margen a 30 %. Volver a ver el producto. | El precio final sube a cerca de $162 sin tocar el producto. |
| 4 | Agustín | Abrir «Alertas» en el menú: `Funko Pop! Goku` tiene 2 unidades. En Mercancía, registrar un ingreso de 5 unidades a costo 9. | El ingreso queda en el historial con su costo y el producto sale de las alertas. |
| 5 | Juan | En la ventana de incógnito: Inicio y «Ver todo». Entrar a una ficha. | «Recién llegados» muestra lo último que entró. El catálogo tiene precio final y disponibilidad. |
| 6 | Juan | «Crear cuenta»: enviar el formulario vacío. Después llenarlo y aceptar los términos. | Todos los campos obligatorios se marcan en rojo a la vez. Con los datos completos, queda con sesión iniciada. |
| 7 | Juan | Ficha de `Vinilo — Cowboy Bebop`: pedir 9 unidades. | Mensaje «El máximo disponible es 2.» y el contador no cambia. |
| 8 | Juan | Agregar 2 de `Magic: The Gathering — Play Booster`, que no tiene existencias. | Se agrega y avisa cuántas unidades van por contrapedido. |
| 9 | Juan | Agregar 2 de `The Legend of Zelda: Tears of the Kingdom` y 1 de `Funko Pop! Pikachu`. Ir al carrito. | Líneas, subtotal, impuesto y total. |
| 10 | Juan | «Finalizar compra», Mensajero, tarjeta `4111 1111 1111 0000`, vencimiento `08/29`, CVV `123`. | Pantalla de pago rechazado. El carrito sigue igual. |
| 11 | Juan | «Reintentar» con la tarjeta `4242 4242 4242 4242`. | Confirmación con número de pedido y estado «Colocado». |
| 12 | Juan | «Ver la factura». | Factura con el emisor, la cédula del cliente y los totales. |
| 13 | Agustín | Panel → Pedidos: abrir el pedido nuevo y darle «Marcar procesado». | El estado cambia y queda en el historial. En «Mis pedidos» el cliente ve «Procesado». |
| 14 | Agustín | Bajar a 1 la cantidad de la línea de Zelda y guardar. | El inventario se ajusta y queda un crédito a favor por lo que ya se había pagado. |
| 15 | Agustín | «Poner en disputa» y después «Resolver disputa». | El pedido vuelve a «Procesado» y el historial muestra que pasó por disputa. |
| 16 | Agustín | «Marcar en tránsito» y después «Marcar entregado». | En tránsito la edición queda bloqueada con el motivo. Al final, «Entregado». |
| 17 | Joaquín | Panel → Configuración → Bitácora. | Los cambios anteriores con usuario, fecha, valor anterior y nuevo. |
| 18 | Agustín | Panel → Ventas: registrar una venta por WhatsApp con varios productos y un cliente. | «Venta registrada», el inventario baja y el pedido aparece con su canal. |
| 19 | Jeferson | Panel → Productos: desactivar `Funko Pop! Pikachu`. | Etiqueta «Descontinuado» en el panel y ya no aparece en la tienda. |
| 20 | Jeferson | Eliminar `Figura Demo`, la del paso 2. | El producto desaparece porque no tiene ventas ni movimientos. |
| 21 | Joaquín | Intentar eliminar `The Legend of Zelda: Tears of the Kingdom`. | Lo rechaza con un mensaje claro y ofrece desactivarlo. |
| 22 | Joaquín | Menú de la cuenta → «Cerrar sesión» y confirmar. | Vuelve a la tienda sin sesión. |

## Si preguntan

- **El pago es emulado.** Una tarjeta que termina en `0000` siempre se rechaza, y SINPE Móvil siempre se aprueba.
- **La factura dice «POR DEFINIR»** en la cédula jurídica y la dirección porque falta que el cliente pase esos datos.
- **El correo de recuperación** todavía no se envía de verdad: el enlace se escribe en el log del servidor.
- **La modificación del paso 14 no cobra diferencias.** Lo que se quita de un pedido pagado queda como crédito a favor, y no se devuelve dinero.
