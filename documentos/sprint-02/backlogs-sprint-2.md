# Sprint Backlog y Product Backlog del Sprint 2

Estado al 9 de noviembre de 2026 · Entrega: 10 de noviembre de 2026

Estas dos tablas pasan al documento del Sprint 2, en el mismo formato de las secciones 5 y 6 del documento del Sprint 1. El detalle de cada criterio de aceptación está en `historias-de-usuario.md`.

## Sprint Backlog del Sprint 2

El sprint se manejó en Jira, en el tablero «SCRUM Sprint 2» (21 de octubre al 10 de noviembre de 2026). Cada historia es una épica, partida en tareas por capa: [BD] base de datos, [BE] servidor, [FE] cliente web y [Docs] documentación. Cada tarea se trabajó en su propia rama y entró a `develop` por un Pull Request.

### Resumen del sprint

| Épica | Historia | Puntos | Puntos completos | Tareas | Terminadas | Estado de la historia |
|---|---|---|---|---|---|---|
| SCRUM-76 | Fundaciones del Sprint 2: decisiones del modelo, migraciones y validación | — | — | 14 | 14 | Terminada |
| SCRUM-77 | HU-03 (cont.) Productos: editar, desactivar y eliminar | 5 | 5 | 5 | 5 | Terminada |
| SCRUM-78 | HU-16 Familias de productos | 8 | 8 | 4 | 4 | Terminada |
| SCRUM-79 | HU-07 / HU-08 Ingreso de mercancía y alerta de existencias | 10 | 10 | 5 | 5 | Terminada |
| SCRUM-80 | HU-02 (cont.), PB-05, PB-18 y PB-19 Seguridad, empleados y bitácora | 16 | 11 | 9 | 9 | Parcial |
| SCRUM-81 | HU-11 Registro de clientes | 5 | 5 | 4 | 4 | Terminada |
| SCRUM-82 | HU-10 Carrito persistente con contrapedido | 8 | 8 | 4 | 4 | Terminada |
| SCRUM-83 | HU-12 y PB-02 Confirmar el pedido, pago emulado y factura | 18 | 5 | 6 | 6 | Parcial |
| SCRUM-84 | HU-17 Administración de pedidos | 13 | 13 | 7 | 7 | Terminada |
| SCRUM-85 | PB-31 Créditos a favor del cliente | 5 | 0 | 2 | 2 | Parcial |
| SCRUM-86 | Cierre del Sprint 2: pruebas, evidencia, documentación y demo | — | — | 10 | 4 | En curso |
| | **Total** | **88** | **65** | **70** | **64** | |

Una historia puede tener todas sus tareas terminadas y quedar parcial, porque tiene criterios que esas tareas no cubrieron. Los puntos parciales no se cuentan como completos:

- **SCRUM-80:** de los 16 puntos faltan los 5 de HU-02, porque el correo de recuperación no se envía de verdad. PB-05, PB-18 y PB-19 sí quedaron completas.
- **SCRUM-83:** de los 18 puntos faltan los 13 de HU-12, porque la factura todavía dice «POR DEFINIR» en los datos del negocio. PB-02 sí quedó completa.
- **SCRUM-85:** falta mostrar en Mi cuenta el saldo a favor y de qué pedido salió.

### Tareas del sprint

**SCRUM-76 · Fundaciones del Sprint 2: decisiones del modelo, migraciones y validación**

| Clave | Tarea | Responsable | Estado |
|---|---|---|---|
| SCRUM-87 | [Docs] Reunión de decisiones del modelo y registro en cambios-siguiente-sprint.md | Joaquin Rodriguez | Terminada |
| SCRUM-88 | [BD] Migración 010: alinear con el EER (trigger disjunto y llave del historial) | Joaquin Rodriguez | Terminada |
| SCRUM-89 | [BD] Migración 011: familias de productos con importación y margen heredados | Joaquin Rodriguez | Terminada |
| SCRUM-90 | [BD] Migración 012: estado del producto (activo / descontinuado) | Joaquin Rodriguez | Terminada |
| SCRUM-91 | [BD] Migración 013: inventario con costo, motivo y tipo de movimiento | Joaquin Rodriguez | Terminada |
| SCRUM-92 | [BD] Migración 014: pedidos (estado «en disputa», canal, creado por) y aceptación de términos | Joaquin Rodriguez | Terminada |
| SCRUM-93 | [BD] Migración 015: bitácora de auditoría | Joaquin Rodriguez | Terminada |
| SCRUM-94 | [BD] Migración 016: cuentas de empleados (varios administradores, un propietario) | Joaquin Rodriguez | Terminada |
| SCRUM-95 | [BD] Migración 017: créditos a favor del cliente | Joaquin Rodriguez | Terminada |
| SCRUM-96 | [BD] Pruebas SQL de las migraciones nuevas | Joaquin Rodriguez | Terminada |
| SCRUM-97 | [FE] Validación de formularios estándar: todos los obligatorios en rojo a la vez | Agussoto 48 | Terminada |
| SCRUM-98 | [BE] Helper de validación en el servidor con todos los campos en una respuesta | Jeferson Marín | Terminada |
| SCRUM-99 | [BE] Adaptar los esqueletos de inventario, clientes, pedidos, pagos, facturación y reportes al EER corregido | Jeferson Marín | Terminada |
| SCRUM-100 | [BD] Semillas del Sprint 2: dólares, 2 familias nuevas × 5 productos y pedidos con canal | Joaquin Rodriguez | Terminada |

**SCRUM-77 · HU-03 (cont.) Productos: editar, desactivar y eliminar**

| Clave | Tarea | Responsable | Estado |
|---|---|---|---|
| SCRUM-101 | [BE] Editar los datos generales del producto (nombre, descripción, familia, proveedor, imagen) | Jeferson Marín | Terminada |
| SCRUM-102 | [BE] Desactivar y reactivar un producto; ocultarlo de la tienda; filtro y etiqueta «descontinuado» | Jeferson Marín | Terminada |
| SCRUM-103 | [BE] Eliminar un producto (DELETE) respetando las relaciones del modelo | Jeferson Marín | Terminada |
| SCRUM-104 | [FE] Modal de edición completo: datos generales, familia y precios heredados o propios | Agussoto 48 | Terminada |
| SCRUM-105 | [FE] Acciones desactivar, reactivar y eliminar producto en la tarjeta y la tabla, con confirmación | Agussoto 48 | Terminada |

**SCRUM-78 · HU-16 Familias de productos**

| Clave | Tarea | Responsable | Estado |
|---|---|---|---|
| SCRUM-106 | [BE] CRUD de familias: consultar, ingresar, modificar, desactivar y eliminar | Jeferson Marín | Terminada |
| SCRUM-107 | [BE] Herencia de importación y margen en el motor de precios y en la importación del Excel | Jeferson Marín | Terminada |
| SCRUM-108 | [FE] Pantalla «Familias» del panel con formulario validado | Agussoto 48 | Terminada |
| SCRUM-109 | [FE] Selector de familia y precios heredados en «Agregar producto» | Agussoto 48 | Terminada |

**SCRUM-79 · HU-07 / HU-08 Ingreso de mercancía y alerta de existencias**

| Clave | Tarea | Responsable | Estado |
|---|---|---|---|
| SCRUM-110 | [BE] Registrar ingreso de mercancía (producto, cantidad, costo) en una transacción | Jeferson Marín | Terminada |
| SCRUM-111 | [BE] Ajustes de existencias con motivo y consulta del historial de movimientos | Jeferson Marín | Terminada |
| SCRUM-112 | [BE] Alertas de existencias bajas (GET /api/inventario/alertas) | Jeferson Marín | Terminada |
| SCRUM-113 | [FE] Pantalla «Ingreso de mercancía» en el panel (una sola pantalla) y ajustes con motivo | Agussoto 48 | Terminada |
| SCRUM-114 | [FE] Panel «Alertas de inventario» y contador en el menú | Agussoto 48 | Terminada |

**SCRUM-80 · HU-02 (cont.), PB-05, PB-18 y PB-19 Seguridad, empleados y bitácora**

| Clave | Tarea | Responsable | Estado |
|---|---|---|---|
| SCRUM-115 | [BE] Política de contraseñas del cliente y cambio de contraseña | Jeferson Marín | Terminada |
| SCRUM-116 | [FE] Botón «Cerrar sesión», aviso de sesión vencida y pantalla «Mi cuenta» con cambio de contraseña | Juan Loaiza | Terminada |
| SCRUM-117 | [BE] Recuperación de contraseña con enlace de un solo uso y vencimiento (RF-54) | Jeferson Marín | Terminada |
| SCRUM-118 | [FE] Pantallas «¿Olvidaste tu contraseña?» y «Restablecer contraseña» | Juan Loaiza | Terminada |
| SCRUM-119 | [BE] Cuentas de empleados: crear, listar y desactivar (solo el propietario); matriz de permisos | Jeferson Marín | Terminada |
| SCRUM-120 | [FE] Pantalla «Empleados» en Configuración | Agussoto 48 | Terminada |
| SCRUM-121 | [BE] Bitácora: suscriptor que guarda los eventos y GET /api/admin/bitacora | Jeferson Marín | Terminada |
| SCRUM-122 | [FE] Consulta de la bitácora en el panel y en el detalle del pedido | Agussoto 48 | Terminada |
| SCRUM-131 | [BE] Cerrar sesión, renovación y limpieza de sesiones vencidas, duración parametrizable | Jeferson Marín | Terminada |

**SCRUM-81 · HU-11 Registro de clientes**

| Clave | Tarea | Responsable | Estado |
|---|---|---|---|
| SCRUM-123 | [BE] Registro de cliente (POST /api/clientes) con cédula, política de contraseñas y aceptación de términos | Jeferson Marín | Terminada |
| SCRUM-124 | [BE] Mi cuenta del cliente: consultar y corregir datos de contacto | Jeferson Marín | Terminada |
| SCRUM-125 | [FE] Pestaña «Crear cuenta» en /acceso con todos los campos validados a la vez | Juan Loaiza | Terminada |
| SCRUM-126 | [FE] Página «Mi cuenta» del cliente (datos de contacto y enlace a Mis pedidos) | Juan Loaiza | Terminada |

**SCRUM-82 · HU-10 Carrito persistente con contrapedido**

| Clave | Tarea | Responsable | Estado |
|---|---|---|---|
| SCRUM-127 | [BE] Carrito del cliente: consultar, agregar, cambiar cantidad y quitar líneas | Jeferson Marín | Terminada |
| SCRUM-128 | [BE] Precio vigente y disponibilidad de cada línea al consultar el carrito | Jeferson Marín | Terminada |
| SCRUM-129 | [FE] «Agregar al carrito» en la tarjeta y la ficha; contador del carrito en el header | Juan Loaiza | Terminada |
| SCRUM-130 | [FE] Página /carrito con totales, avisos y botón «Finalizar compra» | Juan Loaiza | Terminada |

**SCRUM-83 · HU-12 y PB-02 Confirmar el pedido, pago emulado y factura**

| Clave | Tarea | Responsable | Estado |
|---|---|---|---|
| SCRUM-132 | [BE] Confirmar el pedido: transacción con candado, validación de existencias, descuento de stock y pedido en «colocado» | Jeferson Marín | Terminada |
| SCRUM-133 | [BE] Pago emulado con aprobado, rechazado y contra entrega; referencia local cuando la pasarela no da una | Jeferson Marín | Terminada |
| SCRUM-134 | [BE] Factura placeholder con datos fiscales del negocio y cédula del cliente | Jeferson Marín | Terminada |
| SCRUM-135 | [BE] Tarifas por modalidad de entrega y total del pedido (RF-62) | Jeferson Marín | Terminada |
| SCRUM-136 | [FE] Checkout: datos de entrega, pago emulado, resumen y confirmación con número de pedido y factura | Juan Loaiza | Terminada |
| SCRUM-137 | [FE] «Mis pedidos» del cliente con el estado vigente (lista mínima) | Juan Loaiza | Terminada |

**SCRUM-84 · HU-17 Administración de pedidos**

| Clave | Tarea | Responsable | Estado |
|---|---|---|---|
| SCRUM-138 | [BE] Listado y detalle de pedidos para el administrador, con filtros | Jeferson Marín | Terminada |
| SCRUM-139 | [BE] Cambio de estado por el administrador («en disputa» incluido), cancelación solo por el administrador y reposición del inventario | Jeferson Marín | Terminada |
| SCRUM-140 | [BE] Edición de las líneas del pedido: cantidad, quitar, agregar y reemplazar por igual o menor valor | Jeferson Marín | Terminada |
| SCRUM-141 | [BE] Pedido manual / venta de otro canal con canal, cliente y quién lo creó (HU-09) | Jeferson Marín | Terminada |
| SCRUM-142 | [FE] Pantalla «Pedidos» del panel: lista, filtros y detalle con acciones por estado | Agussoto 48 | Terminada |
| SCRUM-143 | [FE] Edición del pedido en el detalle: cantidad, quitar, agregar y reemplazar | Agussoto 48 | Terminada |
| SCRUM-144 | [FE] «Registrar venta / pedido manual» con varios productos, canal y cliente | Agussoto 48 | Terminada |

**SCRUM-85 · PB-31 Créditos a favor del cliente**

| Clave | Tarea | Responsable | Estado |
|---|---|---|---|
| SCRUM-145 | [BE] Otorgar un crédito al quitar un ítem de un pedido ya pagado; saldo del cliente | Jeferson Marín | Terminada |
| SCRUM-146 | [BE+FE] Usar el crédito a favor en el pago, total o parcial | Jeferson Marín | Terminada |

**SCRUM-86 · Cierre del Sprint 2: pruebas, evidencia, documentación y demo**

| Clave | Tarea | Responsable | Estado |
|---|---|---|---|
| SCRUM-147 | [BD] Regenerar schema.sql, db:reset y db:test en verde con las semillas finales | Joaquin Rodriguez | Terminada |
| SCRUM-148 | [BD] Diagrama EER y mapeo actualizados; modelo-datos.md con los cambios C-15 a C-22 | Joaquin Rodriguez | Terminada |
| SCRUM-149 | [Docs] Pruebas funcionales con evidencia (capturas) de todas las operaciones del Sprint 2 | Joaquin Rodriguez | En curso |
| SCRUM-150 | [Docs] Historias de usuario y criterios de aceptación del Sprint 2 con su estado | Juan Loaiza | Terminada |
| SCRUM-151 | [Docs] Sprint Backlog y Product Backlog actualizados; cambios-siguiente-sprint.md (Sprint 2 → 3) | Juan Loaiza | En curso |
| SCRUM-152 | [Docs] Retrospectiva del Sprint 2 | Juan Loaiza | Por hacer |
| SCRUM-153 | [Docs] Documento del Sprint 2 | Juan Loaiza | Por hacer |
| SCRUM-154 | [Docs] Demo interna (6 de noviembre) y guion de la presentación en vivo | Juan Loaiza | En curso |
| SCRUM-155 | [FE] Limpiezas: sesion.js e importaciones.js al clienteHttp; total y paginación de «Ver todo»; «Recién llegados» por fecha | Juan Loaiza | Terminada |
| SCRUM-156 | [Docs] Actualizar matriz-permisos.md y arquitectura.md § 11 con los roles y las rutas nuevas | Juan Loaiza | En curso |

## Product Backlog actualizado

Partimos del Product Backlog del 22 de octubre y lo dejamos con el estado de todo después del Sprint 2. La prioridad MoSCoW va entre paréntesis y Est. son puntos de historia.

**Qué cambió durante el sprint:**

- **Se adelantó:** el uso del crédito a favor en el pago, que estaba para el Sprint 3, entró en este sprint (SCRUM-146), incluido el pago parcial.
- **Entró sin estar planeado:** la búsqueda, los filtros y el orden del catálogo de la tienda (PR #107), que son casi toda HU-06.
- **Absorbidas por HU-17:** HU-09, PB-23 y la parte del administrador de HU-14.

| ID | Historia / requerimiento | Prioridad | Est. | Sprint | Estado / nota |
|---|---|---|---|---|---|
| **Terminadas en el Sprint 1** | | | | | |
| HU-01 | Importación del catálogo desde Excel | Alta (M) | 8 | S1 | Terminada. |
| HU-04 | Cálculo automático del precio de venta | Alta (M) | 8 | S1 | Terminada. En S2 el margen y la importación se heredan de la familia (HU-16). |
| HU-05 | Consulta del catálogo con disponibilidad real | Alta (M) | 8 | S1 | Terminada. En S2 «Ver todo» ya muestra el total y tiene páginas. |
| PB-16 | Página de inicio con vitrina y productos por categoría | Media | — | S1 | Terminada. En S2 «Recién llegados» sale por fecha de ingreso (PR #125). |
| PB-17 | Filtros del catálogo en el panel del administrador | Media | — | S1 | Terminada. |
| **Sprint 2** | | | | | |
| HU-02 | Inicio de sesión con permisos por rol (cont.) | Alta (M) | 5 | S1 → S2 | Parcial: el correo de recuperación no se envía de verdad. |
| HU-03 | Registro y clasificación de productos (cont.) | Alta (M) | 5 | S1 → S2 | Terminada. |
| HU-16 | Familias de productos con importación y margen heredados | Alta (M) | 8 | S2 | Terminada. Nueva (profesor, 13/10). |
| HU-07 | Ingreso de mercancía en una sola pantalla | Alta (M) | 5 | S2 | Terminada. |
| HU-08 | Alerta de existencias bajas | Alta (M) | 5 | S2 | Terminada. |
| HU-10 | Carrito persistente con contrapedido | Alta (M) | 8 | S2 | Terminada. |
| HU-11 | Registro del cliente | Alta (M) | 5 | S2 | Terminada. |
| HU-12 | Confirmación del pedido, pago y facturación | Alta (M) | 13 | S3 → S2 | Parcial: faltan los datos fiscales reales del negocio. Adelantada porque el PDF del S2 pide completar la compra. |
| HU-17 | Administración de pedidos | Alta (M) | 13 | S2 | Terminada. Nueva. |
| HU-09 | Registro de ventas de otros canales | Alta (M) | — | S2 | Terminada, dentro de HU-17 como pedido manual. |
| PB-02 | Selección de modalidad de entrega (RF-62) | Alta (M) | 5 | S3 → S2 | Terminada. |
| PB-05 | Bitácora de auditoría (RF-52) | Media (S) | 5 | — → S2 | Terminada. |
| PB-18 | Cuentas para empleados | Media (S) | 3 | S2 | Terminada. |
| PB-19 | Cerrar sesión y reglas de contraseña | Alta (M) | 3 | S2 | Terminada. |
| PB-23 | Buscar y filtrar pedidos en el panel | — | — | S2 | Terminada, dentro de HU-17. |
| PB-26 | Configurar las tarifas de envío | — | — | S2 | Las tarifas están en la base de datos con montos de prueba; falta que el cliente pase los reales. |
| PB-27 | Datos fiscales del negocio | — | — | S2 | Están en la base de datos (`facturacion.emisor`); falta que el cliente pase la cédula jurídica y la dirección. |
| PB-31 | Créditos a favor del cliente | Media (S) | 5 | S2 | Parcial: falta mostrar en Mi cuenta el saldo y de qué pedido salió. Usarlo al pagar ya funciona. Nueva. |
| **Sprint 3** | | | | | |
| HU-13 | Descuento por nivel de cliente frecuente | Alta (M) | 8 | S3 | Sin cambios. |
| HU-14 | Seguimiento de pedidos | Alta (M) | 5 | S3 | El cliente ya no cancela (solo el administrador, en HU-17). Queda el seguimiento del lado del cliente. |
| HU-15 | Reportes de ventas, inventario y pedidos por cliente | Alta (M) | 8 | S3 | Sin cambios. |
| HU-06 | Búsqueda y filtrado de productos (cliente) | Media (S) | 5 | S3 | Casi toda entró en S2 (PR #107). Falta buscar por código exacto. |
| PB-01 | Gestión de precios, descuentos y márgenes | Alta (M) | 5 | S2 → S3 | Los márgenes ya están; los descuentos van con HU-13. |
| PB-03 | Pedidos activos simultáneos sin límite | Alta (M) | 2 | S3 | Sin cambios. |
| PB-04 | Canal de contacto al correo del negocio | Alta (M) | 2 | S2 → S3 | No entró en la planificación del S2. |
| PB-06 | Historial de compras y nivel en la cuenta del cliente | Media (S) | 3 | — → S3 | Historial con filtros (en tránsito / entregados). En S2 entró la lista mínima «Mis pedidos». |
| **Por priorizar y fuera del alcance inicial** | | | | | |
| PB-07 | Reposición de producto defectuoso | Media (S) | 3 | — | Sin cambios. |
| PB-08 | Retiro programado de productos de temporada | Media (S) | 3 | — | Sin cambios. |
| PB-09 | Importación del archivo de clientes | Media (S) | 5 | — | Sin cambios. |
| PB-10 | Número de guía de despacho | Media (S) | 3 | — | Sin cambios. |
| PB-11 | Métodos de pago adicionales (SINPE, efectivo, datáfono) | Baja (C) | 5 | — | En S2 se emulan en el checkout y en los pedidos manuales, sin integración real. |
| PB-12 a PB-15 | Notificación por correo, contra entrega por nivel, cupones, respaldo automático | Baja / Muy baja | 3–5 | — | Contra entrega se le ofrece hoy a todos los clientes porque el nivel todavía no existe. |
| PB-20 | Lista de clientes en el panel | — | — | — | Por estimar y priorizar. |
| PB-21 | Corregir los datos de un cliente | — | — | — | Por estimar y priorizar. |
| PB-22 | Últimos pedidos del cliente desde su ficha | — | — | — | Por estimar y priorizar. |
| PB-24 | Tablero de inicio del administrador | — | — | — | Por estimar y priorizar. |
| PB-25 | Editar la escala de niveles y los descuentos | — | — | — | Por estimar. Ligado a HU-13. |
| PB-28 | Editar el texto de términos y condiciones | — | — | — | Por estimar. En S2 el texto es provisional. |
| PB-29 | Umbral de alerta de existencias configurable | — | — | — | Por confirmar con el cliente; sigue fijo en 2 unidades. |
