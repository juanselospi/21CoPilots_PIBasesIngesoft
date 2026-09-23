# Requerimientos por tomar — para aprobación del cliente

Lista de funcionalidades que proponemos y aparecen en los wireframes del sprint 1 pero **no están cubiertas por ningún requerimiento del SRS del sprint 0** (RF-01 a RF-69).

Cada punto necesita que Daniel apruebe, rechace o ajuste, antes de que entre a un sprint.

**Fuentes:** `Documentos/wireframes/Wireframes.md` · `Documentos/sprints/sprint_0.pdf`

---

## Clientes

### 1. Ver los últimos pedidos del cliente desde su ficha

> Como administrador, quiero desplegar los últimos pedidos de un cliente desde su ficha, con la opción de ingresar un número de orden para ver un pedido en particular, para responderle sin salir de la pantalla.

**Por qué se discute:** el SRS solo tiene el reporte de pedidos por cliente (RF-46) y la consulta que hace el propio cliente de su cuenta (RF-37). No existe esta vista dentro del panel del administrador.

---

### 2. Lista de clientes en el panel del administrador

> Como administrador, quiero ver la lista de mis clientes y buscarla por nombre, correo o cédula, para encontrar a una persona cuando me escribe.

**Por qué se discute:** el SRS guarda los datos del cliente (RF-33) y calcula su nivel (RF-34), pero nunca define una pantalla donde el administrador consulte esa información.

---

### 3. Corregir los datos de un cliente

> Como administrador, quiero corregir el correo, el teléfono, la dirección o la cédula de un cliente, para que la factura salga con los datos correctos.

**Por qué se discute:** la factura exige la cédula física o jurídica del cliente (RN-18). Si el dato entra mal en la primera compra, hoy no hay forma de arreglarlo.

---

## Pedidos

### 4. Buscar y filtrar pedidos

> Como administrador, quiero buscar un pedido por su número y filtrar la lista por estado, estado de pago, modalidad de entrega o si contiene contrapedidos, para encontrar rápido lo que tengo pendiente.

**Por qué se discute:** el SRS define los estados del pedido (RF-26) y el reporte de pedidos por cliente (RF-46), pero no la búsqueda ni el filtrado en el panel.

---

## Ventas

### 5. Registrar una venta presencial con varios productos

> Como administrador, quiero registrar en una sola venta todos los artículos que un cliente me compró en el local, para que el conteo de transacciones de mis reportes no se infle.

**Por qué se discute:** el SRS habla de registrar "una venta realizada por otro canal" (RF-17) sin aclarar si lleva uno o varios productos. **Es una decisión del cliente**, porque él sabe cómo son sus ventas reales.

---

### 6. Cuentas para empleados

> Como administrador, quiero crear cuentas para las personas que me ayudan, para saber quién registró cada venta y cada ajuste.

**Por qué se discute:** el SRS define **una única cuenta de administrador** (RF-49). La bitácora guarda el usuario responsable (RF-52), pero con una sola cuenta ese dato siempre es el mismo. Preguntarle a Daniel si en algún momento habrá más de una persona operando el sistema.

---

## Panel principal

### 7. Tablero de inicio del administrador

> Como administrador, quiero que al entrar vea un resumen de las ventas del período, los pedidos recientes y accesos rápidos a lo que más uso, para saber cómo va el negocio sin abrir cada sección.

**Por qué se discute:** el SRS solo exige que las alertas de existencias bajas sean visibles en el panel (RF-16). El resto del tablero no está en ningún requerimiento.

---

## Catálogo y productos

### 8. Vitrina de la página de inicio

> Como visitante, quiero ver en la página de inicio un carrusel de novedades y los productos agrupados por categoría, para descubrir qué hay sin tener que buscar.

**Por qué se discute:** el SRS define el catálogo, la búsqueda y la ficha de producto (RF-10, RF-11, RF-12), pero nunca describe la página de inicio ni una vitrina de productos destacados.

---

### 9. Buscar y filtrar productos desde el panel del administrador

> Como administrador, quiero filtrar mi catálogo por proveedor, por existencias bajas o por margen negativo, y ordenarlo por existencias, para revisar qué tengo que reponer o qué tengo en liquidación.

**Por qué se discute:** el filtrado y el orden del SRS (RF-11) están redactados para el catálogo público. Los filtros que necesita el administrador son distintos.

---

## Configuración

### 10. Editar la escala de niveles y los descuentos

> Como administrador, quiero cambiar cuántas compras se necesitan para cada nivel, el porcentaje de descuento de cada uno y el monto mínimo de compra, para ajustar mi programa de fidelidad sin pedir un cambio al sistema.

**Por qué se discute:** el SRS permite modificar precios, descuentos y márgenes (RF-51), pero la escala de niveles y el monto mínimo de ₡100 000 están escritos como valores fijos (RN-08, RN-09).

---

### 11. Configurar las tarifas de envío

> Como administrador, quiero definir el costo de cada modalidad de entrega, para que el sistema lo sume correctamente al total del pedido.

**Por qué se discute:** el SRS obliga a cargar el costo de envío al cliente (RF-62, RN-16), pero **las tarifas siguen sin definirse** y no hay un requerimiento que diga dónde se configuran. Es el dato que falta para cerrar ese requerimiento.

---

### 12. Registrar los datos fiscales del negocio

> Como administrador, quiero registrar el nombre, la cédula jurídica y la dirección de la sociedad, para que aparezcan en todas las facturas.

**Por qué se discute:** la factura debe contener los datos fiscales de la sociedad (RN-18, RES-04), pero ningún requerimiento define cómo entran esos datos al sistema.

---

### 13. Editar el texto de términos y condiciones

> Como administrador, quiero editar el texto de los términos y condiciones, para actualizarlo cuando tenga la versión definitiva.

**Por qué se discute:** el SRS lo deja como texto simulado durante toda la entrega (RN-19), sin decir si el administrador puede reemplazarlo.

---

### 14. ¿Cambiar el umbral de alerta de existencias?

> Como administrador, quiero decidir con cuántas unidades me avisa el sistema, para adaptarlo a los productos que se venden más rápido.

**Por qué se discute:** el SRS lo fija en **dos unidades para todos los productos**, sin configuración (RN-04). El wireframe lo muestra bloqueado. Vale la pena confirmar con Daniel si quiere que siga siendo fijo.

---

## Cuenta y seguridad

### 15. Cerrar sesión y reglas de contraseña

> Como usuario del sistema, quiero cerrar mi sesión, y quiero saber qué requisitos debe cumplir mi contraseña al cambiarla.

**Por qué se discute:** el SRS define el inicio de sesión (RF-50, RF-53) y la recuperación de contraseña (RF-54), pero nunca el cierre de sesión ni una política mínima de contraseña.

---

## Resumen para la reunión

| # | Tema | Tipo |
|---|---|---|
| 1 | Últimos pedidos en la ficha del cliente | Añadido |
| 2 | Lista de clientes en el panel | Faltante |
| 3 | Corregir datos del cliente | Faltante |
| 4 | Buscar y filtrar pedidos | Faltante |
| 5 | Venta presencial con varios productos | Decisión del cliente |
| 6 | Cuentas para empleados | Cambio de alcance |
| 7 | Tablero de inicio del administrador | Añadido |
| 8 | Vitrina de la página de inicio | Añadido |
| 9 | Filtros del catálogo administrativo | Faltante |
| 10 | Editar niveles y descuentos | Cambio de alcance |
| 11 | Configurar tarifas de envío | Dato pendiente |
| 12 | Datos fiscales del negocio | Faltante |
| 13 | Editar términos y condiciones | Menor |
| 14 | Umbral de alerta configurable | Confirmar |
| 15 | Cerrar sesión y contraseñas | Menor |
