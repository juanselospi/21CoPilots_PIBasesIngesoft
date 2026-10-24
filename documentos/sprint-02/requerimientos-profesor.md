# Requerimientos del profesor — sesión del 13/10/2026

> Extraídos de la grabación de clase (~27 min). El audio tiene varias voces superpuestas; los tramos 07:30–08:00, 15:00–17:00 y 21:00–24:30 son poco claros y conviene confirmarlos con el grupo. Los minutos entre corchetes indican dónde ubicar cada punto en el audio.

## 1. Estados del pedido y entrega

- Dos estados principales: **en tránsito** y **entregado/recibido**. [04:12]
- El **administrador** cambia el estado a "entregado" (por ejemplo, al final del día revisando lo enviado). [00:28–00:56]
- Opcional: el **cliente** confirma que recibió el producto y el estado cambia automáticamente. [00:00]
- **Fuera de alcance:** módulo o aplicación para mensajeros/entregas. [01:24]
- Por ahora solo el administrador consulta el estado de los pedidos. [01:52]

## 2. Historial de pedidos del cliente (Sprint 3)

- El cliente puede ver su **historial de pedidos**, planteado como un **reporte** del lado del cliente (opción/pantalla aparte). [01:52–02:48]
- Filtros sugeridos: "pedidos en tránsito" y "pedidos entregados". [03:44]

## 3. Administración de pedidos (administrador)

- La vista debe mostrar: **cliente**, **productos pedidos** y **estado**. [05:08]
- Desde el detalle del pedido, el administrador puede: [05:36–06:04]
  - Modificar la cantidad de un ítem.
  - Cambiar un ítem por otro (ej.: el cliente pidió *Mario Wonder* pero quería *Mario Kart*).
  - Eliminar un ítem.
  - Agregar un ítem nuevo.
- **Restricción:** solo se puede modificar si el pedido **no está enviado ni completado**. [06:32]
- **Creación manual de pedidos** por el administrador, para pedidos recibidos por WhatsApp, Facebook, teléfono o mensaje. [14:00–14:28]
  - Agregar un campo de **origen/canal** del pedido (WhatsApp, Facebook, teléfono…). [15:52]
  - Definir los datos mínimos de un pedido manual: al menos **nombre del cliente** y **dirección de envío**. [16:20]
  - Registrar **quién creó** el pedido (administrador) además de **para quién** es (cliente). [14:28–15:24]
- **Auditoría/bitácora:** guardar el historial de cambios sobre los pedidos (cuándo se insertó, modificó o eliminó algo) como control ante empleados malintencionados. No se requiere autorización explícita del cliente. [17:44–18:40]

## 4. Precios: carrito vs. pedido pagado

- **En el carrito:** si cambia el precio del producto, el carrito debe reflejar el precio actualizado. [07:00]
- **Pedido ya pagado:** se respeta el precio que se pagó. [07:28]

## 5. Inventario y existencias

- **Validar existencias al completar la compra/pago.** Si otra persona compró la última unidad mientras tanto, avisar al cliente (ej.: marcar el producto como **"fuera de stock"** en el detalle del carrito). [18:40–20:04]
- Al **cancelar o eliminar** un producto de un pedido, el **inventario se repone automáticamente**. [20:04–21:00]
  - Se refiere a cambios o cancelaciones porque el cliente se equivocó, **no** a devoluciones por producto defectuoso.

## 6. Créditos a favor

- Al eliminar un producto de un pedido ya pagado **no se devuelve dinero**: se otorga un **crédito a favor** del cliente. [08:24, 22:24]
- Requiere una **tabla de créditos** en el modelo relacional. [08:24]
- Se integra con el sistema de **promociones y beneficios**. [22:24]
- Uso en el pago: [22:52, 25:12]
  - Si el crédito alcanza, cubre el total.
  - Si no alcanza, se cobra la diferencia con otro medio de pago (pago parcial con crédito).
- El crédito **no se puede retirar en efectivo**. [23:48]
- **Pendiente de confirmar:** si la tienda puede compensar al cliente con descuento o crédito ante un problema en el pedido. [25:40]

## 7. Familias / clases de productos

- **Costo de importación** y **margen de ganancia** se definen a nivel de **familia/clase**; un cambio en la familia aplica a todos sus productos. [08:52]
- **Excepción por producto:** un producto puede tener su propio margen, que **sobrescribe** el de la familia solo para ese producto (ej.: familia 25 %, producto particular 50 %). [11:12–12:08]
- Que el porcentaje esté ligado a la familia (y no al producto) es parte del diseño correcto del modelo relacional. [13:32]

## 8. Datos de prueba

- Familias actuales: cartas coleccionables y consolas. [10:16]
- Agregar **2 familias nuevas** (ej.: Funko, figuras/discos de vinilo) con **5 productos cada una**, para demostrar la funcionalidad. [10:44]

## Checklist

- [ ] Estados "en tránsito" / "entregado" y cambio de estado por el administrador
- [ ] Confirmación de recibido por el cliente (opcional)
- [ ] Historial de pedidos del cliente con filtros (Sprint 3)
- [ ] Detalle de pedido editable por el administrador (solo si no está enviado)
- [ ] Creación manual de pedidos con campo de origen/canal y creador
- [ ] Bitácora de cambios en pedidos
- [ ] Precio actualizado en carrito / precio fijo en pedido pagado
- [ ] Validación de existencias al pagar y aviso "fuera de stock"
- [ ] Reposición automática de inventario al cancelar/eliminar ítems
- [ ] Tabla de créditos a favor y uso (total o parcial) en el pago
- [ ] Margen y costo de importación por familia, con sobrescritura por producto
- [ ] 2 familias nuevas × 5 productos en datos de prueba
