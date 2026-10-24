# Plan de tareas del Sprint 2

**Entrega:** martes 10 de noviembre de 2026 · **Hoy:** 21 de octubre · **Quedan:** 20 días
**Fuentes:** `Proyecto del curso - Sprint 2 instrucciones.pdf` · `requerimientos-profesor.md` (13/10) ·
`entrevistas/e2-6-10-2026.md` · `requerimientos/cambios-siguiente-sprint.md` · documento del Sprint 1 § 9 ·
estado del repositorio en `develop` (último commit: 8 de octubre) · Jira (sin ninguna tarea del Sprint 2 todavía)

Este documento es la propuesta para montar el Sprint 2 en Jira. Está pensado para revisarlo, ajustarlo y
después crear las épicas y tareas tal cual.

---

## 1. Qué pide el PDF y qué nos falta

Revisión punto por punto de las instrucciones del Sprint 2 contra lo que hay en `develop`.

| Punto del PDF | Qué pide | Estado hoy | Qué falta |
|---|---|---|---|
| a) Validaciones y reglas de negocio | Campos obligatorios, código único, precios y existencias no negativos | El servidor valida y responde con todos los campos; la BD tiene los `CHECK`. En el cliente, el modal de agregar producto usa el `required` nativo del navegador, que muestra **un solo aviso a la vez** | Validación de formularios estándar: todos los obligatorios en rojo a la vez (tarea A11 y A12). Aplicarla a todos los formularios nuevos |
| a) Productos: ingresar | Formulario y Excel | ✅ Listo | — |
| a) Productos: modificar | Todos los datos | ⚠️ Solo costo, importación, margen, existencias y contrapedido | Editar nombre, descripción, familia, proveedor e imagen (B1, B4) |
| a) Productos: desactivar | Baja lógica (RF-18) | ❌ No existe; el EER no tiene columna `estado` | Migración con `estado` del producto, ruta y botones (A4, B2, B5) |
| a) Productos: eliminar | **Nuevo en el Sprint 2**: eliminar físicamente respetando las relaciones del modelo | ❌ | `DELETE` que solo borra si el producto no tiene ventas ni movimientos; si los tiene, 409 y sugerir desactivar (B3, B5) |
| a) Productos: consultar | Listado con filtros | ✅ Listo | Filtro y etiqueta «descontinuado» (B2, B5) |
| a) Clases o familias | Ingresar, modificar, desactivar, eliminar y consultar. Con características que permean a los productos (costo de importación y margen, con sobrescritura por producto, según el profesor) | ❌ `categoria` es un texto libre en `producto`; no hay entidad | Entidad `familia`, herencia en el motor de precios, CRUD y pantalla (épica C) |
| a) Administración de pedidos | Consultar y modificar pedidos del cliente | ❌ El módulo `pedidos` es un esqueleto | Listado, detalle, cambio de estado (con «en disputa»), edición de líneas, cancelación solo por el administrador, pedidos manuales con canal, bitácora (épica I) |
| b) Catálogo del cliente | Consultar el catálogo | ✅ Listo | Paginación de «Ver todo» con el catálogo real de ~195 SKU (K9, opcional) |
| b) Carrito | Llenar un carrito | ❌ Los botones existen pero no hacen nada | Carrito persistente por cliente (épica G) |
| b) Completar la compra | Pago emulado | ❌ | Confirmar pedido, pasarela simulada, factura placeholder (épica H) |
| b) Inicio de sesión según el tipo | Nuevo cliente (registro), cliente existente o administrador | ⚠️ Solo inicio de sesión; «Crear cuenta» está deshabilitado | Registro de clientes con cédula y aceptación de términos (épica F) |
| c) Ingreso seguro con contraseña | Hash criptográfico | ✅ bcrypt | Política de contraseñas del cliente (8–12, mayúscula, número, especial) (E2) |
| c) Sesiones parametrizables | Manejo de sesiones | ⚠️ La duración sale de `.env` (25 min) y la expiración se verifica, pero no hay cierre de sesión ni aviso de vencimiento | Cerrar sesión, renovación, limpieza de sesiones vencidas, pantalla «Mi cuenta» (E1, E3) |
| d) DDL y datos de prueba | Scripts actualizados y lógica de acceso a datos | ✅ 9 migraciones, semillas, 86 pruebas | Migraciones nuevas (familias, estado, inventario, pedidos, bitácora), semillas con 2 familias × 5 productos, `schema.sql` regenerado, repositorios de los módulos nuevos (épica A, K1) |
| d) Ajustes al modelo documentados | Con justificación | ✅ `modelo-datos.md` § 4 | Filas C-15 en adelante y EER actualizado (K2) |
| e) Pruebas funcionales con capturas | Operaciones de productos y catálogo | ✅ Del Sprint 1 | Repetirlas para las operaciones nuevas (eliminar, familias, pedidos, carrito, compra) (K3) |
| f) Artefactos Scrum | Sprint Backlog, Product Backlog, HU, retrospectiva | — | K4 a K6 |
| g) Entregables | Código, EER, DDL, documento, demo en vivo | — | K1, K2, K7, K8 |

Resumen: del Sprint 2 tenemos listo el catálogo y la base del panel. Falta todo lo transaccional (carrito,
compra, pedidos), las familias, desactivar y eliminar productos, el registro de clientes y el cierre de sesión.

---

## 2. Qué entra al Sprint 2 de lo que fuimos anotando

### 2.1 `cambios-siguiente-sprint.md` (Sprint 1 → Sprint 2)

| Cambio anotado | ¿Entra al Sprint 2? | Dónde queda |
|---|---|---|
| Cuentas para empleados (rol `empleado`) | **Sí, Should.** La entrevista 2 (punto 3) dice que los empleados tienen *cuenta de administrador* y editan pedidos; la bitácora de pedidos del profesor es «control ante empleados». Propuesta: varias cuentas de administrador en vez de un rol nuevo (quitar `ux_administrador_unico`, marcar al propietario) | A1, A8, E6, E7 |
| Movimientos de inventario y alerta de existencias bajas | **Sí, Must.** Son HU-07 y HU-08 (planeadas para S2) y los pedidos dependen del descuento y la reposición del stock | Épica D |
| Recuperación de contraseña (RF-54) | **Sí, Should.** Es parte de la seguridad que pide el PDF y del criterio pendiente de HU-02 | E4, E5 |
| Cierre de sesión y expiración | **Sí, Must.** El PDF pide «manejo de sesiones parametrizable» | E1, E3 |
| «Recién llegados» por fecha de ingreso | Could. Depende de HU-07 | K9 |
| Total y paginación de `GET /api/catalogo/productos` | Should. Con el catálogo real «Ver todo» se queda en 48 productos y se nota en la demo | K9 |
| `api/sesion.js` e `importaciones.js` al `clienteHttp` | Could. Limpieza | K9 |
| **Prioritario.** Pagos sin número de referencia | **Sí, Must.** El checkout lo necesita (contra entrega). Decisión propuesta: `LOCAL-<uuid>` | A1, H2 |
| **Prioritario.** Usuarios que no son ni administrador ni cliente | **Sí, Must.** Con el registro, todo usuario que se registra nace como cliente con su cédula | A1, F1 |
| Bitácora de auditoría (RF-52, RNF-10) | **Sí, Must.** El profesor pidió la bitácora de cambios en pedidos. Decisión propuesta: tabla `admin.bitacora` (migración nueva) | A1, A7, E8, E9 |
| Escala de niveles y datos fiscales del emisor | Datos fiscales: **sí** (la factura los necesita), van en `.env`. Escala de niveles: Sprint 3 (HU-13) | H3 |
| Descontinuar un producto (RF-18) | **Sí, Must.** Opción (a): columna `estado` | A4, B2 |
| Adaptar los esqueletos al EER corregido | **Sí, Must.** Primer paso antes de implementar cada módulo | A13 |
| Histórico de costos (RF-14), motivo de ajustes (RF-20), aceptación de términos (RF-38) | **Sí.** Términos: Must (el registro lo exige). Costo y motivo: Should, en la misma migración de inventario | A5, A6 |
| **Prioritario.** Alinear la BD con el EER (trigger disjunto, llave del historial) | **Sí, Must.** Ojo con la llave del historial: con el estado «en disputa», un pedido puede entrar y salir de ese estado más de una vez, así que la llave `(correo, num_carrito, estado)` ya no sirve. Propuesta: conservar `numero_cambio` y corregir el EER, no la migración | A1, A2 |
| Logo definitivo y favicon | Could, solo si el cliente lo entrega | K9 |

### 2.2 `cambios-siguiente-sprint.md` (Sprint 2 → Sprint 3) y «Por confirmar»

| Punto | Decisión |
|---|---|
| Buscador de la barra superior (HU-06) | Se queda en el Sprint 3 |
| Carrito, contador y botón «Agregar al carrito» | **Pasa al Sprint 2.** El PDF pide llenar el carrito y completar la compra. Hay que mover la fila |
| ¿«Crear cuenta» antes de comprar o solo al comprar? | El PDF lo resuelve: el sistema debe permitir iniciar sesión «según sea un nuevo cliente (registro)». Se habilita «Crear cuenta» en `/acceso` y también desde el checkout |
| ¿Factura y pagos en dólares? | Confirmar con Daniel en la primera reunión. Mientras tanto, todo en dólares |

### 2.3 Entrevista 2 (6 de octubre)

| # | Tema | Entra al Sprint 2 | Tarea |
|---|---|---|---|
| 1 | Estado «en disputa», que se mantiene hasta resolverlo y queda en el historial | Sí | A6, I2 |
| 2 | Solo el administrador cancela un pedido | Sí. El cliente no tiene botón de cancelar; se actualiza `matriz-permisos.md` | I2, K10 |
| 3 | Los empleados con cuenta de administrador editan pedidos | Sí | E6, I3 |
| 4 | Reemplazo de un producto solo por otro de igual o menor valor | Sí | I3, I6 |

### 2.4 Requerimientos del profesor (clase del 13 de octubre)

| Punto | Entra al Sprint 2 | Tarea |
|---|---|---|
| Estados «en tránsito» y «entregado»; el administrador cambia el estado | Sí | I2, I5 |
| El cliente confirma que recibió (opcional) | Could; si sobra tiempo | H6 |
| Historial de pedidos del cliente con filtros | **Sprint 3** (lo dijo el profesor). En S2 solo una lista mínima «Mis pedidos» con el estado | H6 |
| Detalle del pedido editable (cantidad, cambiar, eliminar, agregar) solo si no está enviado ni completado | Sí | I3, I6 |
| Creación manual de pedidos con canal y quién lo creó | Sí. Absorbe HU-09 (venta de otro canal) | A6, I4, I7 |
| Bitácora de cambios en pedidos | Sí | A7, E8 |
| Carrito con precio actualizado; pedido pagado con el precio pagado | Sí | G2, H1 |
| Validar existencias al pagar y avisar «fuera de stock» | Sí | H1, G4 |
| Reposición automática del inventario al cancelar o eliminar ítems | Sí | I2, I3 |
| Créditos a favor (tabla, uso total o parcial en el pago) | **Should, al final del sprint.** Es alcance nuevo y el PDF pide evaluar el valor antes de implementar. Propuesta: tabla y otorgamiento del crédito en S2 si da tiempo; uso del crédito en el pago, Sprint 3 | A9, J1, J2 |
| Margen e importación por familia con sobrescritura por producto | Sí | A3, C2 |
| 2 familias nuevas × 5 productos en datos de prueba | Sí | A14 |

### 2.5 Pedido tuyo: validación de formularios

Hoy `AddProduct.jsx` usa el `required` nativo del navegador (sin `noValidate`), así que al enviar el
formulario el navegador muestra el aviso de **un solo campo**. El formulario de acceso sí tiene
`noValidate`, pero muestra un único mensaje genérico. La práctica estándar es: al enviar, validar todos los
campos, marcar en rojo cada obligatorio vacío con su mensaje debajo, poner el foco en el primero y no
enviar hasta que todo esté bien. Esto es la tarea A11 (cliente) y A12 (servidor, que ya responde todos los
campos en `ENTRADA_INVALIDA` y solo hay que extraer el helper). Se hace primero porque todas las pantallas
nuevas (registro, familias, mercancía, checkout, pedidos) la reutilizan.

---

## 3. Cómo se organiza el sprint

**Equipo y reparto sugerido** (según lo que cada uno hizo en el Sprint 1; se puede cambiar):

| Integrante | Rol | Frente sugerido |
|---|---|---|
| Joaquín Rodríguez | PO | [BD] migraciones, pruebas SQL, semillas, EER; decisiones del modelo |
| Jeferson Marín | Dev | [BE] módulos del servidor |
| Juan Loaiza | SM | [FE] tienda del cliente (acceso, carrito, checkout, mi cuenta); [Docs] |
| Agustín Soto | Dev | [FE] panel del administrador (productos, familias, mercancía, pedidos) |

**Fechas clave:**

| Fecha | Hito |
|---|---|
| Jue 23 oct | Reunión de decisiones del modelo (A1). Sin esto no arrancan las migraciones |
| Mié 28 oct | Fundaciones listas: migraciones 010–014, validación de formularios, sesión y registro en el servidor |
| Mar 3 nov | Flujo de punta a punta conectado en `develop`: carrito → compra → pedido visible en el panel (meta de la retrospectiva del Sprint 1: «integrar a mitad del sprint») |
| Jue 5 nov | Congelar funcionalidades. Solo correcciones |
| Vie 6 nov | Demo interna completa |
| Dom 8 nov | Evidencia de pruebas, HU y backlogs listos |
| Lun 9 nov | Documento del Sprint 2 cerrado, `schema.sql` y EER finales |
| Mar 10 nov | Entrega y demostración en vivo |

**Convenciones de Jira** (las mismas del Sprint 1): una épica por historia; tareas con prefijo `[BD]`,
`[BE]`, `[FE]` o `[Docs]`; descripción con **Qué hacer**, **Referencias** y **Listo cuando**; etiqueta por
capa (`database`, `backend`, `frontend`, `docs`); enlaces «is blocked by»; fecha límite; una rama por tarea
(`feature/<app>-<descripcion>`) y PR a `develop`.

**Prioridad:** Must = lo pide el PDF o es requisito de algo que lo pide. Should = aprobado por el cliente o
pedido por el profesor, pero el sprint se aprueba sin ello. Could = si sobra tiempo.

---

## 4. Épicas y tareas

### Épica A — Fundaciones del Sprint 2: decisiones del modelo, migraciones y formularios

Sin historia propia (como «Fundaciones técnicas» del Sprint 1). Es lo primero porque todo lo demás depende de ella.

| ID | Tarea | Prioridad | Bloqueada por | Responsable sugerido | Límite |
|---|---|---|---|---|---|
| A1 | [Docs] Reunión de decisiones del modelo y registro en `cambios-siguiente-sprint.md` | Must | — | Joaquín (todos) | 23 oct |
| A2 | [BD] Migración 010: alinear con el EER (quitar el trigger disjunto; decidir la llave del historial) | Must | A1 | Joaquín | 24 oct |
| A3 | [BD] Migración 011: familias de productos | Must | A1 | Joaquín | 26 oct |
| A4 | [BD] Migración 012: estado del producto (activo / descontinuado) | Must | A1 | Joaquín | 24 oct |
| A5 | [BD] Migración 013: inventario con costo, motivo y tipo de movimiento | Must | A1 | Joaquín | 26 oct |
| A6 | [BD] Migración 014: pedidos (estado «en disputa», canal, creado por) y aceptación de términos | Must | A1 | Joaquín | 27 oct |
| A7 | [BD] Migración 015: bitácora de auditoría | Must | A1 | Joaquín | 28 oct |
| A8 | [BD] Migración 016: cuentas de empleados (varios administradores) | Should | A1 | Joaquín | 30 oct |
| A9 | [BD] Migración 017: créditos a favor del cliente | Should | A1 | Joaquín | 2 nov |
| A10 | [BD] Pruebas SQL de las migraciones nuevas | Must | A2–A8 | Joaquín | 31 oct |
| A11 | [FE] Validación de formularios estándar: todos los obligatorios a la vez | Must | — | Agustín | 25 oct |
| A12 | [BE] Helper de validación en el servidor con todos los campos en una respuesta | Must | — | Jeferson | 25 oct |
| A13 | [BE] Adaptar los esqueletos de inventario, clientes, pedidos, pagos, facturación y reportes al EER corregido | Must | — | Jeferson | 24 oct |
| A14 | [BD] Semillas del Sprint 2: montos en dólares, 2 familias nuevas × 5 productos, pedidos con canal | Must | A3–A7 | Joaquín | 4 nov |

**A1 — [Docs] Reunión de decisiones del modelo**
Qué hacer: el primer día del sprint (compromiso de la retrospectiva) decidir en equipo y anotar en `cambios-siguiente-sprint.md` (marcando ✅) y en `modelo-datos.md` § 4 las decisiones pendientes: (1) RF-18 con columna `estado` en producto; (2) pago sin referencia de la pasarela: `LOCAL-<uuid>`; (3) todo usuario registrado es cliente (el registro pide cédula); (4) bitácora en tabla `admin.bitacora`; (5) llave de `historial_estado`: conservar `numero_cambio` y corregir el EER, porque «en disputa» puede repetirse; (6) permisos de una cuenta administrador y cliente a la vez; (7) empleados = cuentas de administrador adicionales creadas por el propietario; (8) familia como entidad con `nombre` como llave y `producto.categoria` como llave foránea; (9) factura y pagos en dólares (confirmar con Daniel).
Referencias: `cambios-siguiente-sprint.md` · documento del Sprint 1 § 2.8 y § 9 · `e2-6-10-2026.md` · `requerimientos-profesor.md`.
Listo cuando: cada decisión tiene su fila ✅ en `cambios-siguiente-sprint.md` con lo acordado, y A2 a A9 saben qué migrar.

**A2 — [BD] Migración 010: alinear con el EER**
Qué hacer: `npm run db:new -- alinear-eer`. Quitar `verificar_usuario_disjunto` y sus dos triggers. Según A1, dejar `numero_cambio` en `historial_estado` y actualizar la página «Mapeo» y el EER del drawio para que coincidan. Ajustar `03_usuarios_clientes.sql` y la fila de `004_clientes.sql` en `database/README.md`.
Referencias: `cambios-siguiente-sprint.md` (fila «Alinear la base de datos con el EER») · `modelo-datos.md` § 2.2 y § 2.5 · DD-12.
Listo cuando: un mismo correo puede estar en `admin.administrador` y `clientes.cliente`; `npm run db:reset` y `npm run db:test` pasan.

**A3 — [BD] Migración 011: familias de productos**
Qué hacer: crear `catalogo.familia (nombre PK, descripcion, importacion NUMERIC(6,2) ≥ 0, margen_ganancia NUMERIC(6,2) > −100, activa BOOLEAN DEFAULT true)`. Insertar una fila por cada `categoria` distinta que exista en `producto` y convertir `producto.categoria` en llave foránea a `familia(nombre) ON UPDATE CASCADE`. Hacer `producto.importacion` y `producto.margen_ganancia` NULL-ables: `NULL` significa «hereda de la familia», un valor significa «sobrescribe». `costo_total` deja de ser columna generada (no puede leer otra tabla): se calcula en el motor de precios y en `v_existencias` con `coalesce(p.importacion, f.importacion)`. Registrar el cambio como C-15 en `modelo-datos.md` con la justificación del profesor (el margen ligado a la familia «es parte del diseño correcto del modelo relacional»).
Referencias: PDF § a) «clases o familias» · `requerimientos-profesor.md` § 7 · `modelo-datos.md` § 2.3 · `formula-precio.md`.
Listo cuando: existe la tabla, los productos actuales quedan ligados a su familia, no se puede insertar un producto con una familia inexistente, y las pruebas SQL nuevas (A10) cubren `importacion`/`margen` nulos y la herencia en la vista.

**A4 — [BD] Migración 012: estado del producto**
Qué hacer: `producto.estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','descontinuado'))` con índice. Confirmar que las llaves foráneas de `agrega` y `producto_administra` impiden borrar un producto con historial (son `RESTRICT` por defecto): eso es lo que hace válida la eliminación física «teniendo en cuenta las relaciones». Fila C-16 en `modelo-datos.md`.
Referencias: RF-18 · documento del Sprint 1 § 2.8 opción (a) · PDF § a) «sí se podrá eliminar un producto».
Listo cuando: `UPDATE ... SET estado = 'descontinuado'` funciona, `DELETE` de un producto con ventas falla por llave foránea y `DELETE` de uno sin historial funciona; prueba SQL incluida.

**A5 — [BD] Migración 013: inventario**
Qué hacer: en `inventario.producto_administra` agregar `costo_unitario NUMERIC(12,2)` (opcional, RF-14: histórico de costos), `tipo VARCHAR(20) NOT NULL CHECK IN ('ingreso','ajuste','venta_externa','venta_en_linea','reposicion')` y `motivo TEXT` (obligatorio cuando `tipo = 'ajuste'`, RF-20, con un `CHECK`). Cambiar el `DEFAULT now()` de `fecha` a `clock_timestamp()` para que dos registros del mismo SKU en una transacción no choquen. Decidir si las ventas en línea se registran aquí: `correo_administrador` es obligatorio y una venta en línea no tiene administrador; propuesta: hacerla NULL-able con `CHECK (correo_administrador IS NOT NULL OR tipo IN ('venta_en_linea','reposicion'))`. Fila C-17.
Referencias: HU-07, HU-08 · RF-13, RF-14, RF-15, RF-19, RF-20 · `cambios-siguiente-sprint.md` fila «Requerimientos sin representación».
Listo cuando: un ajuste sin motivo es rechazado por la BD; dos ingresos del mismo SKU en una transacción se guardan; `v_registro_mercancia` muestra tipo, costo y motivo.

**A6 — [BD] Migración 014: pedidos y aceptación de términos**
Qué hacer: agregar `'en_disputa'` al `CHECK` de `historial_estado.estado`; en `pedido` agregar `canal VARCHAR(20) NOT NULL DEFAULT 'web' CHECK IN ('web','whatsapp','facebook','telefono','presencial')`, `creado_por VARCHAR(255) NULL REFERENCES admin.administrador` (quién lo registró cuando es manual) y `nombre_destinatario VARCHAR(150) NULL` (para pedidos manuales a nombre de otra persona). En `clientes.cliente` agregar `fecha_aceptacion_terminos TIMESTAMPTZ NULL` (RF-38, RNF-16). Ordenar `v_estado_pedido` por `fecha`. Filas C-18 y C-19.
Referencias: `e2-6-10-2026.md` punto 1 · `requerimientos-profesor.md` § 3 · RF-26, RF-38.
Listo cuando: se puede insertar un historial con `en_disputa`, un pedido con canal `whatsapp` y `creado_por`, y la semilla de clientes trae la fecha de aceptación.

**A7 — [BD] Migración 015: bitácora de auditoría**
Qué hacer: `admin.bitacora (id BIGSERIAL PK, fecha TIMESTAMPTZ DEFAULT clock_timestamp(), correo_usuario VARCHAR(255) NULL, evento VARCHAR(40) NOT NULL, entidad VARCHAR(40), entidad_id VARCHAR(100), valor_anterior JSONB, valor_nuevo JSONB)` con índice por `(entidad, entidad_id)` y por `fecha`; trigger de solo inserción. Es la respuesta a «dónde se guarda la bitácora». Fila C-20 con la justificación del profesor (control ante empleados malintencionados).
Referencias: RF-52, RNF-10 · `requerimientos-profesor.md` § 3 · `eventos-de-dominio.js`.
Listo cuando: la tabla existe, no se puede editar ni borrar una fila, y E8 puede escribir en ella.

**A8 — [BD] Migración 016: cuentas de empleados**
Qué hacer: quitar `ux_administrador_unico`; agregar `administrador.es_propietario BOOLEAN NOT NULL DEFAULT false` con índice único parcial `WHERE es_propietario` (sigue habiendo un solo dueño, RF-49), `creado_por` y `activo BOOLEAN DEFAULT true`. Semilla: el administrador actual queda como propietario. Fila C-21.
Referencias: entrevista 1 punto 6 · `e2-6-10-2026.md` punto 3 · `matriz-permisos.md` § 4.
Listo cuando: se pueden insertar dos administradores, solo uno propietario; prueba SQL.

**A9 — [BD] Migración 017: créditos a favor**
Qué hacer: `clientes.credito (id, correo_cliente FK, fecha, monto > 0, motivo, correo_cliente/num_carrito del pedido origen, saldo_restante)`; solo inserción (el consumo se registra como otra fila negativa o con tabla de uso; decidir). Fila C-22.
Referencias: `requerimientos-profesor.md` § 6.
Listo cuando: la tabla existe con sus restricciones y prueba SQL. Si no da tiempo, se pasa al Sprint 3 sin afectar nada más.

**A10 — [BD] Pruebas SQL de las migraciones nuevas**
Qué hacer: `database/pruebas/08_familias.sql`, `09_estado_producto.sql`, `10_inventario_s2.sql`, `11_pedidos_s2.sql`, `12_bitacora.sql` (y `13_empleados.sql` si entra A8) con `_ayudantes.sql`, una prueba por restricción. Actualizar los invariantes de `06_invariantes.sql`.
Listo cuando: `npm run db:test` pasa con todas las pruebas y el total aparece en `database/README.md`.

**A11 — [FE] Validación de formularios estándar**
Qué hacer: crear un helper compartido (por ejemplo `hooks/useFormulario.js` + `utils/validarCampos.js`) que reciba la definición de campos (obligatorio, tipo, mínimo, patrón) y devuelva **todos** los errores a la vez. Regla para toda pantalla: `noValidate` en el `<form>`; al enviar se validan todos los campos; cada obligatorio vacío se marca con borde rojo, `aria-invalid` y el mensaje «Este campo es obligatorio» debajo; el foco va al primer campo con error; el botón no envía hasta que todo esté bien; los errores que devuelve el servidor (`detalles.campos`) se muestran en el campo correspondiente. Aplicarlo a `Access.jsx`, `AddProduct.jsx` y `EditProduct.jsx` (quitar el `required` nativo). Dejar un ejemplo documentado en `apps/client/README.md`.
Referencias: PDF § a) «campos obligatorios» · `ProductForm.css` (`.product-form-error`) · `errores-de-dominio.js` (`EntradaInvalida`).
Listo cuando: enviar «Agregar producto» vacío muestra código, nombre, familia y costo en rojo al mismo tiempo; capturas para la evidencia (K3).

**A12 — [BE] Helper de validación en el servidor**
Qué hacer: extraer de `validar-producto-nuevo.js` un helper reutilizable (`shared/validacion/validar-campos.js`) que acumule todos los errores y lance `EntradaInvalida` con `campos: [{ campo, mensaje }]`. Usarlo en los validadores nuevos (familias, registro, mercancía, carrito, pedido, checkout).
Listo cuando: una petición con tres campos faltantes responde 400 con los tres en `detalles.campos`; pruebas unitarias.

**A13 — [BE] Adaptar los esqueletos al EER corregido**
Qué hacer: aplicar la lista de la fila «Adaptar al EER corregido los módulos…» de `cambios-siguiente-sprint.md`: encabezados y firmas con `sku`, `(correoCliente, numCarrito)`, `clock_timestamp()`; `inventario.routes.js` y `reportes.routes.js` con `exigirSesion` antes de `exigirRol`; `pedidos.routes.js` con `exigirRol(ROLES.CLIENTE)` en las rutas del carrito; puertos de pagos y facturación con `{ correoCliente, numCarrito }`; encabezado de `admin.repository.js` (esquema `usuarios`).
Listo cuando: ningún comentario de `apps/server` menciona el modelo anterior y las rutas sin sesión responden 401.

**A14 — [BD] Semillas del Sprint 2**
Qué hacer: pasar las semillas a dólares (`item` ya no en colones; comentarios también). Agregar 2 familias nuevas con 5 productos cada una (propuesta: «Funko Pop» y «Discos de vinilo», según el profesor) con importación y margen en la familia y al menos un producto que sobrescriba el margen. Pedidos de ejemplo: uno web colocado, uno manual por WhatsApp, uno en disputa, uno cancelado. Un empleado en la semilla si entra A8. Actualizar `scripts/cargar-cliente.js` para que la hoja del cliente cree las familias que falten.
Listo cuando: `npm run db:reset` deja la demo lista: 4 familias, productos con precio heredado y sobrescrito, pedidos en varios estados.

---

### Épica B — Productos: editar datos generales, desactivar y eliminar (HU-03 continuación, RF-18)

Historia: *Como administrador, quiero modificar cualquier dato de un producto, desactivarlo cuando ya no lo vendo y eliminarlo si nunca se vendió, para mantener el catálogo al día sin perder el historial.* Criterios: editar nombre/descripción/familia/proveedor/imagen y verlo en la tienda; desactivar lo saca del catálogo público pero sigue en reportes; eliminar un producto con ventas se rechaza con un mensaje claro; eliminar uno sin historial lo borra.

| ID | Tarea | Prioridad | Bloqueada por | Responsable sugerido | Límite |
|---|---|---|---|---|---|
| B1 | [BE] Editar los datos generales del producto (`PATCH /api/catalogo/productos/:sku`) | Must | A3, A12 | Jeferson | 27 oct |
| B2 | [BE] Desactivar y reactivar un producto; ocultarlo de la tienda; filtro y etiqueta «descontinuado» | Must | A4 | Jeferson | 28 oct |
| B3 | [BE] Eliminar un producto (`DELETE`) respetando las relaciones | Must | A4 | Jeferson | 28 oct |
| B4 | [FE] Modal de edición completo: datos generales, familia y precios heredados o propios | Must | B1, C2, A11 | Agustín | 31 oct |
| B5 | [FE] Acciones desactivar, reactivar y eliminar en la tarjeta y la tabla, con confirmación | Must | B2, B3 | Agustín | 31 oct |

**B1** — Qué hacer: aceptar `nombre`, `descripcion`, `categoria` (familia existente), `proveedor`, `imagen` en el `PATCH`, además de los campos actuales; `importacion` y `margen` admiten `null` para «heredar de la familia». Validar con A12; publicar `parametro_modificado` cuando cambian costo, importación o margen (RF-52). Listo cuando: cambiar el nombre se refleja en la ficha pública y las pruebas de `validar-cambios-de-producto` cubren los campos nuevos.

**B2** — Qué hacer: `PATCH /api/catalogo/productos/:sku/estado` con `{ estado }`; las consultas públicas (`listar`, `obtenerFicha`, `listarCategorias`, inicio) excluyen `descontinuado`; el listado administrativo acepta `disponibilidad=descontinuado` y devuelve la etiqueta. Un producto descontinuado no se puede agregar al carrito (G1). Listo cuando: descontinuar VDJ-002 lo quita de la tienda, sigue en `v_venta_por_producto` y aparece en el panel con la etiqueta; pruebas de rutas.

**B3** — Qué hacer: `DELETE /api/catalogo/productos/:sku`. Si el producto tiene filas en `agrega` o `producto_administra`, responder 409 `PRODUCTO_CON_HISTORIAL` con el mensaje «Este producto tiene ventas o movimientos; desactívelo en su lugar». Si no, borrarlo y publicar el evento. Listo cuando: borrar un producto nuevo sin historial responde 204 y desaparece; borrar PKM-001 (con ventas en la semilla) responde 409; pruebas.

**B4** — Qué hacer: ampliar `EditProduct.jsx` con los campos de texto, el selector de familia (de C1) y, en importación y margen, un control «Usar el de la familia (25 %)» / «Propio» que manda `null` o el valor. Mostrar el precio recalculado. Validación con A11. Listo cuando: se puede cambiar el nombre y la familia desde el panel y elegir heredar el margen; captura para K3.

**B5** — Qué hacer: botones «Desactivar» / «Reactivar» y «Eliminar» en la tarjeta y en la fila de la tabla, con diálogo de confirmación; al recibir 409 mostrar el mensaje del servidor y ofrecer desactivar; chip «Descontinuado» y filtro en `ProductFilters`. Listo cuando: las cuatro operaciones (ingresar, modificar, desactivar, eliminar) se demuestran desde el panel.

---

### Épica C — Familias de productos (HU-16, historia nueva)

Historia: *Como administrador, quiero administrar las familias de productos con su costo de importación y su margen, para que un cambio en la familia aplique a todos sus productos y solo tenga que ajustar los productos que son la excepción.* Criterios (Gherkin): dado una familia con 25 % de margen, cuando creo un producto sin margen propio, entonces su precio usa 25 %; cuando cambio la familia a 30 %, entonces todos sus productos sin margen propio cambian de precio; dado un producto con margen propio 50 %, cuando cambia la familia, su precio no cambia; una familia desactivada oculta sus productos de la tienda; una familia con productos no se puede eliminar.

| ID | Tarea | Prioridad | Bloqueada por | Responsable sugerido | Límite |
|---|---|---|---|---|---|
| C1 | [BE] CRUD de familias: consultar, ingresar, modificar, desactivar, eliminar | Must | A3, A12 | Jeferson | 29 oct |
| C2 | [BE] Herencia de importación y margen en el motor de precios y en la importación del Excel | Must | A3 | Jeferson | 29 oct |
| C3 | [FE] Pantalla «Familias» del panel con formulario validado | Must | C1, A11 | Agustín | 2 nov |
| C4 | [FE] Selector de familia y precios heredados en «Agregar producto» | Must | C1, C2, A11 | Agustín | 2 nov |

**C1** — Qué hacer: `GET /api/catalogo/familias` (público: solo activas, con conteo de productos visibles; reemplaza a `listarCategorias`), `GET /api/catalogo/admin/familias` (con importación, margen y total de productos), `POST`, `PATCH /:nombre` (renombrar con `ON UPDATE CASCADE`, cambiar importación/margen/descripción/activa) y `DELETE /:nombre` (409 si tiene productos). Nombre obligatorio y único sin importar mayúsculas. Listo cuando: las cinco operaciones responden y están probadas; cambiar el margen de la familia cambia el precio de sus productos en la tienda.

**C2** — Qué hacer: el repositorio de catálogo hace `JOIN familia` y entrega `importacionEfectiva`, `margenEfectivo` y de dónde salen; el motor calcula `costoTotal` con la importación efectiva (ya no viene de la BD); DTOs del listado administrativo y de la ficha exponen `heredado: true/false`. Importación del Excel: la columna «familia» crea la familia si no existe (con importación y margen de la fila, o 0) y la fila puede dejar margen vacío para heredar. Listo cuando: las pruebas del motor y de `catalogo.service` cubren heredado y sobrescrito, y PF-04 (precio igual al Excel) sigue pasando.

**C3** — Qué hacer: ruta `/admin/familias` en el menú del panel («Productos» → pestaña o sección «Familias»): tabla con nombre, descripción, importación, margen, productos, estado; modal agregar/editar con validación A11; botones desactivar/reactivar y eliminar con confirmación (409 → mensaje). Listo cuando: se demuestran las cinco operaciones y la captura para K3.

**C4** — Qué hacer: en `AddProduct.jsx` reemplazar el `datalist` de categoría por un selector de familias (con enlace «Crear familia»); importación y margen vacíos significan «heredar» y se muestra el valor de la familia como ayuda. Listo cuando: crear un producto sin margen propio muestra en el mensaje de éxito el precio calculado con el margen de la familia.

---

### Épica D — Inventario: ingreso de mercancía y alertas (HU-07, HU-08)

Historias del SRS, con sus criterios tal cual (ver `sprint_0.pdf`).

| ID | Tarea | Prioridad | Bloqueada por | Responsable sugerido | Límite |
|---|---|---|---|---|---|
| D1 | [BE] Registrar ingreso de mercancía (producto, cantidad, costo) en una transacción | Must | A5, A13, A12 | Jeferson | 29 oct |
| D2 | [BE] Ajustes de existencias con motivo y consulta del historial de movimientos | Must | D1 | Jeferson | 30 oct |
| D3 | [BE] Alertas de existencias bajas (`GET /api/inventario/alertas`) | Must | A13 | Jeferson | 30 oct |
| D4 | [FE] Pantalla «Ingreso de mercancía» en el panel (una sola pantalla) y ajustes con motivo | Must | D1, D2, A11 | Agustín | 3 nov |
| D5 | [FE] Panel «Alertas de inventario» y contador en el menú | Must | D3 | Agustín | 3 nov |

**D1** — Qué hacer: `POST /api/inventario/ingresos` `{ sku, cantidad > 0, costoUnitario }`; en una transacción: `SELECT ... FOR UPDATE` del producto, `UPDATE stock`, actualizar `item` con el costo nuevo (el histórico queda en `producto_administra.costo_unitario`, RF-14), insertar el movimiento `tipo = 'ingreso'` con el administrador de la sesión; publicar `movimiento_registrado` (dispara la alerta). Usar el helper A12 (cantidad ≤ 0 → campo inválido). Listo cuando: ingresar 10 unidades sube el stock en 10 y deja el movimiento con fecha y costo; pruebas del servicio.

**D2** — Qué hacer: `POST /api/inventario/ajustes` `{ sku, cantidad ≠ 0, motivo obligatorio }` (RF-20) y `GET /api/inventario/movimientos?sku&desde&hasta` sobre `v_registro_mercancia` (RF-19). La edición directa de `stock` en el `PATCH` de productos se mantiene por compatibilidad pero registra un movimiento `ajuste` con motivo «Corrección desde el panel» para que no haya cambios sin historial. Listo cuando: un ajuste sin motivo responde 400 con el campo, el historial se consulta y no se puede editar.

**D3** — Qué hacer: `GET /api/inventario/alertas` devuelve los productos activos con `stock ≤ umbral` (RN-04, 2 unidades) y sin contrapedido ilimitado; el suscriptor existente `alerta-de-existencias-bajas.js` escribe en la bitácora (E8) cuando un movimiento cruza el umbral. Listo cuando: vender una unidad que deja 2 hace aparecer el producto en las alertas y un ingreso lo quita.

**D4** — Qué hacer: `/admin/mercancia`: buscador de producto por código o nombre, cantidad, costo, botón «Registrar» (≤ 4 interacciones, RNF-11), mensaje «Quedan N unidades»; sección «Ajuste» con motivo obligatorio; tabla de movimientos recientes. Validación A11. Listo cuando: se registra un ingreso y un ajuste desde la pantalla y se ven en el historial; captura.

**D5** — Qué hacer: modal «Alertas de inventario» (wireframe p. 18) con la lista de productos en el umbral y enlace a «Registrar mercancía»; contador en el menú del panel. Listo cuando: la demo muestra la alerta al vender la penúltima unidad.

---

### Épica E — Seguridad: sesiones, contraseñas, empleados y bitácora (HU-02 continuación, PB-18, PB-19, PB-05)

| ID | Tarea | Prioridad | Bloqueada por | Responsable sugerido | Límite |
|---|---|---|---|---|---|
| E1 | [BE] Cerrar sesión, renovación y limpieza de sesiones vencidas, duración parametrizable | Must | — | Jeferson | 27 oct |
| E2 | [BE] Política de contraseñas del cliente y cambio de contraseña | Must | A12 | Jeferson | 28 oct |
| E3 | [FE] Botón «Cerrar sesión», aviso de sesión vencida y pantalla «Mi cuenta» con cambio de contraseña | Must | E1, E2, A11 | Juan | 31 oct |
| E4 | [BE] Recuperación de contraseña con enlace de un solo uso y vencimiento (RF-54) | Should | E2 | Jeferson | 3 nov |
| E5 | [FE] Pantallas «¿Olvidaste tu contraseña?» y «Restablecer» | Should | E4, A11 | Juan | 5 nov |
| E6 | [BE] Cuentas de empleados: crear, listar y desactivar (solo el propietario); matriz de permisos | Should | A8, E2 | Jeferson | 4 nov |
| E7 | [FE] Pantalla «Empleados» en Configuración | Should | E6, A11 | Agustín | 6 nov |
| E8 | [BE] Bitácora: suscriptor que guarda los eventos y `GET /api/admin/bitacora` | Must | A7 | Jeferson | 2 nov |
| E9 | [FE] Consulta de la bitácora en el panel | Should | E8 | Agustín | 6 nov |

**E1** — Qué hacer: `DELETE /api/admin/sesion` borra la sesión de la cookie y limpia la cookie; en `identificarPorToken`, si la sesión vence en menos de la mitad de su duración, extenderla (renovación deslizante) y dejarlo configurable (`SESION_RENOVAR=true`); tarea periódica o al iniciar sesión que borra sesiones vencidas; documentar `DURACION_SESION_MINUTOS` en `.env.example` y en la guía (es el «manejo de sesiones parametrizable» del PDF). Listo cuando: cerrar sesión deja la cookie inválida (401 después), una sesión vencida responde 401 y la duración cambia por `.env`; pruebas de `sesion.routes`.

**E2** — Qué hacer: `seguridad/politica-de-contrasenas.js`: 8 a 12 caracteres, al menos una mayúscula, un número y un carácter especial (entrevista 1, punto 15), con todos los incumplimientos en el mensaje; `PATCH /api/admin/contrasena` `{ actual, nueva }` para cualquier usuario con sesión (RF-49 «cambiar sus credenciales»); invalida las demás sesiones del usuario. Listo cuando: una contraseña sin mayúscula es rechazada con el motivo; el cambio funciona y cierra las otras sesiones; pruebas.

**E3** — Qué hacer: menú del usuario en el header con «Mi cuenta» y «Cerrar sesión» (diálogo «¿Cerrar sesión?», wireframe p. 33); `clienteHttp` detecta 401 con sesión previa y manda a `/acceso` con el aviso «Tu sesión venció»; página `/mi-cuenta` con cambio de contraseña (validación A11 con la política visible). Listo cuando: se demuestra el ciclo iniciar → cerrar → sesión vencida.

**E4** — Qué hacer: `POST /api/admin/contrasena/recuperacion` `{ correo }` genera un token aleatorio, guarda solo su hash con vencimiento (nueva tabla pequeña o columna en `usuario`, decidir en A1), y «envía» el enlace: como no hay correo real, se escribe en el log del servidor y se devuelve en respuesta solo en desarrollo; `POST /contrasena/restablecimiento` `{ token, nueva }` lo consume (un solo uso). Responde igual exista o no el correo. Listo cuando: el enlace funciona una vez y se rechaza la segunda; pruebas.

**E5** — Qué hacer: habilitar «¿Olvidaste tu contraseña?» en `/acceso`, pantalla para pedir el enlace y pantalla `/restablecer?token=` con la política de contraseñas. Listo cuando: el flujo completo se demuestra con el enlace tomado del log.

**E6** — Qué hacer: `POST /api/admin/usuarios` (solo `es_propietario`): nombre, correo, contraseña con política → `usuario` + `administrador`; `GET /api/admin/usuarios`; `PATCH /:correo/activo`. `admin.repository.buscarUsuarioPorSesion` devuelve `esPropietario`; `exigirRol` sigue igual (los empleados son administradores) y las rutas de empleados y configuración exigen propietario. Agregar la columna «Empleado» a `matriz-permisos.md` (igual que administrador salvo crear cuentas y configurar). Listo cuando: el propietario crea un empleado, el empleado entra al panel y edita un pedido (I3), y no puede crear cuentas.

**E7** — Qué hacer: sección «Empleados» en `/admin/configuracion`: tabla, modal de alta con validación A11 (política de contraseñas visible), desactivar. Listo cuando: se crea un empleado desde la pantalla y se ve en la bitácora quién hizo cada cambio.

**E8** — Qué hacer: `shared/bitacora/suscriptor-de-bitacora.js` registrado en `composicion.js` que escribe en `admin.bitacora` los eventos `acceso_denegado`, `parametro_modificado`, `movimiento_registrado`, `pedido_confirmado`, `pedido_cancelado`, `estado_pedido_cambiado` y los nuevos de la épica I (`pedido_modificado`, `pedido_creado_manual`) con usuario, entidad, valor anterior y nuevo; `GET /api/admin/bitacora?entidad&entidadId&desde&hasta` (solo administrador). Listo cuando: cambiar un margen deja una fila con usuario, fecha, valor anterior y nuevo (criterio de RF-52), y una edición de pedido deja la suya.

**E9** — Qué hacer: pestaña «Bitácora» en Configuración y, en el detalle del pedido (I5), un bloque «Historial de cambios» con lo registrado para ese pedido. Listo cuando: en la demo se ve quién cambió qué en un pedido.

---

### Épica F — Registro de clientes (HU-11)

Historia del SRS, ajustada por el PDF: el registro está disponible antes de comprar («Crear cuenta» en `/acceso`) y también desde el checkout. Criterios: registro con nombre, correo, contraseña, cédula, teléfono, dirección y aceptación de términos con fecha; sin aceptar no avanza; cliente existente recupera sus datos.

| ID | Tarea | Prioridad | Bloqueada por | Responsable sugerido | Límite |
|---|---|---|---|---|---|
| F1 | [BE] Registro de cliente (`POST /api/clientes`) con cédula, política de contraseñas y aceptación de términos | Must | A2, A6, A12, E2 | Jeferson | 28 oct |
| F2 | [BE] Mi cuenta del cliente: consultar y corregir datos de contacto | Must | F1 | Jeferson | 30 oct |
| F3 | [FE] Pestaña «Crear cuenta» en `/acceso` con todos los campos validados a la vez | Must | F1, A11 | Juan | 31 oct |
| F4 | [FE] Página «Mi cuenta» del cliente | Should | F2, E3 | Juan | 3 nov |

**F1** — Qué hacer: en una transacción crea `usuarios.usuario` (hash bcrypt), `clientes.cliente` (cédula única; 409 si el correo o la cédula ya existen) y `cliente_telefono`; exige `aceptaTerminos = true` y guarda `fecha_aceptacion_terminos` (RF-38); abre la sesión y deja la cookie (igual que iniciar sesión). Es la decisión (3) de A1: todo usuario nuevo es cliente. Listo cuando: registrar y comprar sin registro previo funciona; registrar sin aceptar términos responde 400 con el campo; pruebas de rutas.

**F2** — Qué hacer: `GET /api/clientes/me` (nombre, correo, cédula, dirección, teléfonos, número de compras, fecha de aceptación) y `PATCH /api/clientes/me` (dirección y teléfonos; la cédula solo la corrige el administrador, aprobado #3, queda para PB-21). Listo cuando: el checkout (H5) precarga la dirección del cliente.

**F3** — Qué hacer: habilitar la pestaña «Crear cuenta» y el enlace «¿Primera vez aquí?»: formulario con nombre, correo, contraseña (con la política visible y el ojo), cédula, teléfono, dirección y casilla de términos (texto placeholder, RN-19); al enviar vacío, **todos** los obligatorios en rojo a la vez (A11); errores del servidor en su campo (correo o cédula repetidos). Al registrarse entra a la tienda con sesión. Listo cuando: se demuestra el registro y la captura muestra los mensajes simultáneos.

**F4** — Qué hacer: en `/mi-cuenta` (E3) la sección de datos del cliente editable (dirección, teléfonos) y el enlace a «Mis pedidos» (H6). Listo cuando: cambiar la dirección se refleja en el siguiente checkout.

---

### Épica G — Carrito persistente (HU-10)

Historia y criterios del SRS: el carrito se conserva entre sesiones; no se puede exceder el stock salvo contrapedido; el contrapedido se indica visiblemente. Más el punto del profesor: el carrito refleja el precio actualizado.

| ID | Tarea | Prioridad | Bloqueada por | Responsable sugerido | Límite |
|---|---|---|---|---|---|
| G1 | [BE] Carrito del cliente: consultar, agregar, cambiar cantidad y quitar líneas | Must | A13, A12, F1 | Jeferson | 29 oct |
| G2 | [BE] Precio vigente y disponibilidad de cada línea al consultar el carrito | Must | G1, C2 | Jeferson | 30 oct |
| G3 | [FE] «Agregar al carrito» en la tarjeta y la ficha; contador en el header | Must | G1 | Juan | 2 nov |
| G4 | [FE] Página `/carrito` con totales, avisos y botón «Finalizar compra» | Must | G2, A11 | Juan | 3 nov |

**G1** — Qué hacer: `GET /api/pedidos/carrito`, `POST /api/pedidos/carrito/lineas` `{ sku, cantidad }`, `PATCH /carrito/lineas/:sku`, `DELETE /carrito/lineas/:sku`; solo `exigirRol(CLIENTE)`; crea el carrito `activo` del cliente al primer agregado (`num_carrito` = máximo + 1); rechaza productos descontinuados u ocultos (RN-03); si `cantidad > stock` y sin contrapedido responde 409 «El máximo disponible es N» (RN-13, RF-22); con contrapedido lo acepta y marca `contrapedido: true`; guarda `precio_unitario` y `tasa_impuesto_aplicada` al agregar (C-07). Listo cuando: los tres criterios de HU-10 pasan en pruebas del servicio y de rutas.

**G2** — Qué hacer: al consultar el carrito, recalcular el precio de cada línea con el motor y actualizar `agrega.precio_unitario` si cambió (el precio solo se congela al confirmar, H1); marcar cada línea con `disponibilidad: en_existencia | contrapedido | fuera_de_stock` según el stock actual (RF-23; profesor § 5); devolver subtotal, impuesto y total. Listo cuando: subir el margen de un producto cambia el total del carrito en la siguiente consulta; una línea cuyo stock se agotó aparece «fuera de stock».

**G3** — Qué hacer: `api/carrito.js` y hook `useCarrito` (contexto); el botón de `ProductCard` y de `ProductDetail` (con selector de cantidad) agregan y muestran confirmación; el visitante va a `/acceso` con `?volver=`; el contador del header y el de `/acceso` muestran la cantidad real; aviso de contrapedido y de tope de existencias. Listo cuando: agregar desde la ficha sube el contador y el carrito sobrevive a cerrar el navegador.

**G4** — Qué hacer: página `/carrito`: líneas con imagen, nombre, precio vigente, cantidad editable (tope de existencias), quitar, etiqueta «Por contrapedido» o «Fuera de stock» (con cantidad bloqueada), subtotal, impuesto, total y botón «Finalizar compra» (deshabilitado si hay líneas fuera de stock); estado vacío. Listo cuando: captura de los tres casos (normal, contrapedido, fuera de stock).

---

### Épica H — Confirmar el pedido, pago emulado y factura (HU-12, adelantada del Sprint 3 por el PDF)

Historia y criterios del SRS, dividida como pedía el DoR: confirmación, pago placeholder y factura placeholder.

| ID | Tarea | Prioridad | Bloqueada por | Responsable sugerido | Límite |
|---|---|---|---|---|---|
| H1 | [BE] Confirmar el pedido: transacción con candado, validación de existencias, descuento de stock y pedido en «colocado» | Must | G1, A5, A6, D1 | Jeferson | 2 nov |
| H2 | [BE] Pago emulado con aprobado, rechazado y contra entrega; referencia local | Must | H1 | Jeferson | 3 nov |
| H3 | [BE] Factura placeholder con datos fiscales del negocio y cédula del cliente | Must | H2 | Jeferson | 4 nov |
| H4 | [BE] Tarifas por modalidad de entrega y total del pedido (RF-62) | Must | — | Jeferson | 1 nov |
| H5 | [FE] Checkout: datos de entrega, pago, resumen y confirmación con número de pedido y factura | Must | H1–H4, G4, F2, A11 | Juan | 5 nov |
| H6 | [FE] «Mis pedidos» del cliente con el estado vigente (lista mínima; el historial con filtros es del Sprint 3) | Should | H1, I2 | Juan | 6 nov |

**H1** — Qué hacer: `POST /api/pedidos` `{ modalidadEntrega, direccion, metodoPago, datosTarjeta? }`; en una transacción: bloquear los productos del carrito `FOR UPDATE` ordenados por SKU (§ 7.3), verificar existencias (si otro cliente compró la última unidad, revertir y responder 409 con las líneas afectadas para que el carrito las marque «fuera de stock», profesor § 5), congelar el precio vigente en `agrega` (a partir de aquí no cambia: pedido pagado respeta el precio), descontar `stock`, registrar el movimiento `venta_en_linea` (A5), pasar el carrito a `convertido` con `fecha_cierre`, insertar `pedido` (modalidad, dirección, costo de entrega de H4, canal `web`) e `historial_estado` `colocado`, cobrar (H2) y, si el pago es rechazado, revertir todo y conservar el carrito (RF-39); publicar `pedido_confirmado`; incrementar `num_compras`. Listo cuando: los tres criterios de HU-12 y el de concurrencia (RF-30, dos confirmaciones simultáneas del último ítem) pasan en pruebas.

**H2** — Qué hacer: la pasarela simulada ya existe; agregar en `PasarelaSimulada` una forma de forzar el resultado para la demo (por ejemplo, tarjeta terminada en `0000` → rechazada) y documentarla; `pagos.repository` guarda `pagos.pago` con `num_referencia` de la pasarela o `LOCAL-<uuid>` cuando no hay (contra entrega → `pendiente`; decisión (2) de A1); `GET /api/pedidos/:numCarrito/pagos`. Listo cuando: pago aprobado crea el pedido, rechazado no lo crea y conserva el carrito, contra entrega lo crea con pago pendiente; pruebas.

**H3** — Qué hacer: configuración `negocio.razonSocial`, `negocio.cedulaJuridica`, `negocio.direccion` en `configuracion.js` y `.env.example` (decisión «datos fiscales» de `cambios-siguiente-sprint.md`); al aprobarse el pago llamar a `FacturacionSimulada.emitir` con emisor, receptor (nombre y cédula del cliente), líneas, impuesto y total, y guardar `facturacion.factura`; `GET /api/pedidos/:numCarrito/factura` devuelve el JSON de la factura (y el cliente la muestra como comprobante). Listo cuando: el criterio «la factura contiene los datos fiscales de la sociedad y mi cédula» se demuestra.

**H4** — Qué hacer: tabla de tarifas en configuración (`ENVIO_MENSAJERO`, `ENVIO_UBER_FLASH`, `ENVIO_CORREOS_CR`, `ENVIO_ENTREGA_PERSONAL=0`) hasta que el cliente las defina (aprobado #11, PB-26); `GET /api/pedidos/modalidades` devuelve modalidad y costo; el total del pedido suma el costo de entrega (RN-16). Listo cuando: cada modalidad suma su costo y queda en `pedido.costo_entrega`.

**H5** — Qué hacer: `/finalizar-compra` con tres pasos: (1) entrega: modalidad con su costo y dirección (precargada de F2; «entrega personal» no pide dirección), (2) pago: tarjeta emulada (número, vencimiento, CVV, sin guardarlos nunca, RNF-09), SINPE, contra entrega, (3) resumen y botón «Confirmar y pagar». Validación A11 en cada paso. Si el visitante no tiene sesión, el paso 0 es iniciar sesión o crear cuenta (F3). Pantalla de confirmación con número de pedido, estado y enlace a la factura; pantalla de pago rechazado con «Reintentar». Si el servidor responde 409 por existencias, volver al carrito con las líneas marcadas. Listo cuando: la demo completa una compra aprobada y una rechazada; capturas.

**H6** — Qué hacer: `/mis-pedidos`: lista con número, fecha, total y estado vigente (RF-27), detalle con líneas y factura; sin botón de cancelar (decisión del cliente, entrevista 2). Opcional: botón «Recibí mi pedido» que lo pasa a `finalizado` (profesor § 1, opcional). Listo cuando: el cliente ve cambiar el estado cuando el administrador lo cambia.

---

### Épica I — Administración de pedidos (HU-17, historia nueva; incluye HU-09 y la parte administrativa de HU-14)

Historia: *Como administrador, quiero ver los pedidos con su cliente, productos y estado, cambiarles el estado, corregirlos mientras no se hayan enviado, cancelarlos y registrar los que me llegan por otros canales, para controlar todas las ventas desde un solo lugar.* Criterios: lista con cliente, productos y estado; cambio a procesado, en tránsito, entregado, en disputa y cancelado; al cancelar vuelven las unidades; editar cantidad, quitar, agregar o reemplazar (solo por igual o menor valor) solo si no está en tránsito ni finalizado; un pedido manual registra canal y quién lo creó y descuenta el inventario; todo cambio queda en la bitácora.

| ID | Tarea | Prioridad | Bloqueada por | Responsable sugerido | Límite |
|---|---|---|---|---|---|
| I1 | [BE] Listado y detalle de pedidos para el administrador, con filtros | Must | H1, A6 | Jeferson | 2 nov |
| I2 | [BE] Cambio de estado por el administrador («en disputa» incluido), cancelación solo por el administrador y reposición del inventario | Must | I1, A6, E8 | Jeferson | 3 nov |
| I3 | [BE] Edición de las líneas del pedido: cantidad, quitar, agregar, reemplazar por igual o menor valor | Must | I2, E8 | Jeferson | 4 nov |
| I4 | [BE] Pedido manual / venta de otro canal con canal, cliente y quién lo creó (HU-09) | Must | H1, A6 | Jeferson | 4 nov |
| I5 | [FE] Pantalla «Pedidos» del panel: lista, filtros y detalle con acciones por estado | Must | I1, I2 | Agustín | 5 nov |
| I6 | [FE] Edición del pedido en el detalle | Must | I3, I5 | Agustín | 6 nov |
| I7 | [FE] «Registrar venta / pedido manual» con varios productos | Must | I4, A11 | Agustín | 6 nov |

**I1** — Qué hacer: `GET /api/pedidos/admin?estado&correo&canal&desde&hasta&q` (sobre `v_pedidos_por_cliente` + estado), `GET /api/pedidos/admin/:correo/:numCarrito` con cliente, líneas (con nombre y precio pagado), modalidad, dirección, costo de entrega, pagos, factura, historial de estados y canal/creado por. Solo administrador (`exigirSesion` + `exigirRol`). Listo cuando: el listado muestra cliente, productos y estado (profesor § 3) y se filtra por estado; pruebas.

**I2** — Qué hacer: `POST /api/pedidos/admin/:correo/:numCarrito/estado` `{ estado }`. Actualizar `maquina-de-estados.js`: `colocado → procesado → en_transito → finalizado`; `cancelado` desde colocado o procesado; `en_disputa` desde cualquier estado no final y, al resolver, vuelve al estado anterior (se lee del historial); `finalizado` = «entregado» (el administrador lo marca). Cancelar repone el stock con un movimiento `reposicion` (profesor § 5) y publica `pedido_cancelado`; el cliente **no** puede cancelar (quitar esa ruta y actualizar `matriz-permisos.md`, K10). Listo cuando: las pruebas de la máquina de estados cubren «en disputa» ida y vuelta; cancelar devuelve las unidades.

**I3** — Qué hacer: `PATCH /api/pedidos/admin/:correo/:numCarrito/lineas/:sku` (cantidad), `DELETE .../lineas/:sku`, `POST .../lineas` (agregar), `POST .../lineas/:sku/reemplazo` `{ skuNuevo }`. Solo si el estado es `colocado`, `procesado` o `en_disputa` (no enviado ni completado, profesor § 3); cada cambio ajusta el inventario en la misma transacción (quitar → repone; agregar → descuenta con candado; cambiar cantidad → la diferencia); el reemplazo solo se acepta si el precio vigente del nuevo ≤ precio pagado del original y conserva el precio pagado (entrevista 2 punto 4; no se cobra diferencia); las líneas existentes mantienen su precio pagado. Publicar `pedido_modificado` con valor anterior y nuevo para la bitácora. Si entra J1: al quitar una línea de un pedido pagado se otorga el crédito. Listo cuando: los cuatro cambios funcionan, un pedido en tránsito los rechaza con 409, y la bitácora muestra cada uno.

**I4** — Qué hacer: `POST /api/pedidos/admin` `{ correoCliente | clienteNuevo { nombre, telefono, direccion }, lineas [{ sku, cantidad }], canal, modalidadEntrega, direccion, metodoPago }`. Reutiliza la confirmación de H1 (crea el carrito convertido y el pedido en un solo paso) con `canal` y `creado_por` = administrador de la sesión; para un cliente nuevo se decide en A1 cómo registrarlo (propuesta: cuenta de cliente con cédula opcional «pendiente» o cliente genérico «Venta presencial» de la semilla con `nombre_destinatario`); pago `efectivo`, `datafono` o `sinpe_movil` aprobado de inmediato. Una venta con varios productos es **una** transacción (aprobado #5). Listo cuando: registrar una venta por WhatsApp de dos productos descuenta el inventario, aparece en el listado con su canal y en los reportes (criterios de HU-09).

**I5** — Qué hacer: `/admin/pedidos` (wireframe pp. 14–16, 27–29): tabla con número, fecha, cliente, productos (resumen), canal, total, estado de pago y estado; filtros por estado y canal y búsqueda por número o cliente; detalle con los botones según el estado («Marcar procesado», «Marcar en tránsito», «Marcar entregado», «Poner en disputa» / «Resolver disputa», «Cancelar» con confirmación), historial de estados y de cambios (E9). Listo cuando: la demo cambia un pedido de colocado a entregado y pone uno en disputa.

**I6** — Qué hacer: en el detalle, cuando el estado lo permite: editar cantidad, quitar línea, agregar producto (buscador) y «Reemplazar» con buscador que solo muestra productos de precio igual o menor; cuando no se permite, los controles aparecen bloqueados con el motivo. Listo cuando: captura de cada cambio y del bloqueo en un pedido en tránsito.

**I7** — Qué hacer: `/admin/ventas` (wireframe pp. 11–13, 25): tarjetas de productos que se agregan a la venta en curso, cliente existente (buscador) o datos mínimos, canal, modalidad, método de pago; «Confirmar venta» → «Venta registrada. Quedan N unidades.»; validación A11. Listo cuando: se demuestra una venta presencial de varios productos.

---

### Épica J — Créditos a favor del cliente (PB-31, nueva; Should, candidata al Sprint 3)

Pedido del profesor (13/10, § 6). Es alcance nuevo, así que va de último y solo si el resto está en verde el 5 de noviembre.

| ID | Tarea | Prioridad | Bloqueada por | Responsable sugerido | Límite |
|---|---|---|---|---|---|
| J1 | [BE] Otorgar un crédito al quitar un ítem de un pedido ya pagado; saldo del cliente | Should | A9, I3 | Jeferson | 6 nov |
| J2 | [BE+FE] Usar el crédito en el pago, total o parcial, y mostrarlo en «Mi cuenta» | Could → Sprint 3 | J1, H5 | — | Sprint 3 |

**J1** — Qué hacer: en I3, si el pedido tiene un pago aprobado y se quita o reduce una línea, insertar en `clientes.credito` el monto (precio pagado × cantidad, con impuesto) con motivo y pedido origen; `GET /api/clientes/me/creditos`; nunca se devuelve dinero ni se retira en efectivo. Listo cuando: quitar una línea de un pedido pagado deja el crédito y se ve en «Mi cuenta».

---

### Épica K — Cierre del Sprint 2: pruebas, evidencia, documentación y demo

| ID | Tarea | Prioridad | Bloqueada por | Responsable sugerido | Límite |
|---|---|---|---|---|---|
| K1 | [BD] Regenerar `schema.sql`, `db:reset` y `db:test` en verde con las semillas finales | Must | A2–A14 | Joaquín | 7 nov |
| K2 | [BD] Diagrama EER y mapeo actualizados; `modelo-datos.md` § 2 y § 4 (C-15 a C-22) | Must | A2–A9 | Joaquín | 7 nov |
| K3 | [Docs] Pruebas funcionales con evidencia (capturas) de todas las operaciones | Must | épicas B–I | Joaquín (todos) | 8 nov |
| K4 | [Docs] Historias de usuario y criterios de aceptación del Sprint 2 (HU-02/03 cont., HU-07, 08, 10, 11, 12, HU-16, HU-17) | Must | — | Juan | 8 nov |
| K5 | [Docs] Sprint Backlog y Product Backlog actualizados; `cambios-siguiente-sprint.md` (Sprint 2 → 3) | Must | — | Juan | 8 nov |
| K6 | [Docs] Retrospectiva del Sprint 2 | Must | — | Juan (todos) | 9 nov |
| K7 | [Docs] Documento del Sprint 2 | Must | K1–K6 | Juan | 9 nov |
| K8 | [Docs] Demo interna (6 nov) y guion de la presentación en vivo | Must | épicas B–I | Todos | 6 nov |
| K9 | [FE] Limpiezas: `sesion.js` e `importaciones.js` al `clienteHttp`; total y paginación de «Ver todo»; «Recién llegados» por fecha de ingreso | Could | D1 | Juan | 5 nov |
| K10 | [Docs] `matriz-permisos.md` (empleado, el cliente no cancela, administrador+cliente) y `arquitectura.md` § 11 con las rutas nuevas | Must | E6, I2 | Juan | 7 nov |

**K3** — Qué hacer: tabla de casos PF-xx con pasos, resultado esperado y captura, cubriendo lo que el PDF exige explícitamente (ingresar, modificar, desactivar, eliminar y consultar productos; consulta del catálogo por el cliente) y lo nuevo (familias, mercancía, alertas, registro, cerrar sesión, carrito, compra aprobada y rechazada, factura, pedidos: estados, edición, disputa, cancelación, venta manual, bitácora). Incluir las pruebas automatizadas (`npm test` del servidor y `db:test`) con su conteo. Cada integrante toma capturas de lo que implementó; Joaquín arma la tabla.

**K7** — Qué hacer: mismo índice del documento del Sprint 1: introducción, resumen de lo implementado, cambios respecto al Sprint 1 con justificación (C-15 a C-22, cambios de alcance: HU-12 adelantada, HU-09 absorbida por pedidos manuales, carrito adelantado, «en disputa», cancelación solo administrador, créditos), evidencia de pruebas, Sprint Backlog, Product Backlog, HU y criterios, retrospectiva, pendientes para el Sprint 3. Exportar a `documentos/sprint-02/sprint_2.pdf`.

**K8** — Qué hacer: guion del flujo completo para la presentación: crear familia → agregar producto que hereda el margen → cambiar el margen de la familia → registrar mercancía → ver la tienda → crear cuenta de cliente → agregar al carrito (tope y contrapedido) → finalizar compra (pago rechazado y luego aprobado) → factura → panel: el pedido aparece, cambia a procesado, se edita una línea, se pone en disputa, se marca entregado → bitácora → desactivar y eliminar producto → cerrar sesión. Demo interna el viernes 6 con todos.

---

## 5. Dependencias en una sola vista

```
A1 (decisiones, 23 oct)
 ├─ A2 A3 A4 A5 A6 A7 A8 A9  (migraciones, 24–30 oct) ─ A10 (pruebas SQL) ─ A14 (semillas) ─ K1, K2
 │     A3 ─ C1 C2 ─ C3 C4 ─ B4
 │     A4 ─ B2 B3 ─ B5
 │     A5 ─ D1 ─ D2 ─ D4 ;  D3 ─ D5
 │     A6 ─ F1 ─ F2 ─ F4 ;  F1 ─ G1 ─ G2 ─ G4 ─ H5
 │     A7 ─ E8 ─ E9, I2, I3
 │     A8 ─ E6 ─ E7
 │     A9 ─ J1
 ├─ A11 (validación FE) ─ todos los formularios nuevos (B4 C3 C4 D4 E3 E5 E7 F3 G4 H5 I7)
 ├─ A12 (validación BE) ─ B1 C1 D1 E2 F1 G1 I4
 └─ A13 (esqueletos) ─ D1 D3 G1
E1 E2 ─ E3 ;  E2 ─ E4 ─ E5 ;  E2 ─ F1
G1 + D1 + A6 ─ H1 ─ H2 ─ H3 ;  H4 ─ H5
H1 ─ I1 ─ I2 ─ I3 ─ I6 ;  I1 I2 ─ I5 ;  H1 ─ I4 ─ I7 ;  I2 ─ H6
Épicas B–I ─ K3 K8 ─ K7
```

**Camino crítico:** A1 → A6 → F1 → G1 → H1 → I1 → I2 → I3 → I6 → K3 → K7. Son casi todas de Jeferson en
el servidor: si se atrasa, Joaquín toma I4 o H3/H4, que son independientes.

---

## 6. Totales

| Épica | Tareas | Must | Should | Could |
|---|---|---|---|---|
| A Fundaciones | 14 | 12 | 2 | — |
| B Productos | 5 | 5 | — | — |
| C Familias | 4 | 4 | — | — |
| D Inventario | 5 | 5 | — | — |
| E Seguridad | 9 | 4 | 5 | — |
| F Registro | 4 | 3 | 1 | — |
| G Carrito | 4 | 4 | — | — |
| H Compra | 6 | 5 | 1 | — |
| I Pedidos | 7 | 7 | — | — |
| J Créditos | 2 | — | 1 | 1 |
| K Cierre | 10 | 9 | — | 1 |
| **Total** | **70** | **58** | **10** | **2** |

Carga aproximada por persona (tareas sugeridas): Jeferson 27, Agustín 15, Juan 15, Joaquín 13. Jeferson va
muy cargado porque casi todo el sprint es servidor; conviene que Joaquín tome parte del servidor (I4, H3, H4,
D2, D3 son buenas candidatas) y que Juan y Agustín se repartan según avancen.

---

## 7. Preguntas para Daniel (primera reunión del sprint)

1. ¿La factura y los pagos van en dólares? (RNF-17 dice colones; la tienda maneja dólares.)
2. Tarifas de envío por modalidad (mensajero, Uber Flash, Correos de CR), para no dejarlas inventadas.
3. Nombre y cédula jurídica de la sociedad para la factura.
4. En un pedido manual para alguien que no es cliente registrado, ¿basta nombre, teléfono y dirección?
5. Confirmar las dos familias nuevas de prueba (Funko, vinilos) y si quiere que la importación también se
   herede de la familia o solo el margen.

---

## 8. Claves en Jira (montado el 21 de octubre de 2026)

Todo está en el sprint «SCRUM Sprint 1» (id 3) del tablero, que hay que renombrar desde Jira a
**«Sprint 2 — Pedidos y compra»** con fechas 22 de octubre a 10 de noviembre y la meta del sprint
(la API no permite crear ni renombrar sprints). La tarea de uso del crédito (SCRUM-146) quedó en el
backlog, no en el sprint.

| Épica | Clave | Tareas |
|---|---|---|
| A Fundaciones | SCRUM-76 | A1 SCRUM-87 · A2 88 · A3 89 · A4 90 · A5 91 · A6 92 · A7 93 · A8 94 · A9 95 · A10 96 · A11 97 · A12 98 · A13 99 · A14 100 |
| B Productos | SCRUM-77 | B1 SCRUM-101 · B2 102 · B3 103 · B4 104 · B5 105 |
| C Familias | SCRUM-78 | C1 SCRUM-106 · C2 107 · C3 108 · C4 109 |
| D Inventario | SCRUM-79 | D1 SCRUM-110 · D2 111 · D3 112 · D4 113 · D5 114 |
| E Seguridad | SCRUM-80 | E1 SCRUM-131 · E2 115 · E3 116 · E4 117 · E5 118 · E6 119 · E7 120 · E8 121 · E9 122 |
| F Registro | SCRUM-81 | F1 SCRUM-123 · F2 124 · F3 125 · F4 126 |
| G Carrito | SCRUM-82 | G1 SCRUM-127 · G2 128 · G3 129 · G4 130 |
| H Compra | SCRUM-83 | H1 SCRUM-132 · H2 133 · H3 134 · H4 135 · H5 136 · H6 137 |
| I Pedidos | SCRUM-84 | I1 SCRUM-138 · I2 139 · I3 140 · I4 141 · I5 142 · I6 143 · I7 144 |
| J Créditos | SCRUM-85 | J1 SCRUM-145 · J2 146 (backlog) |
| K Cierre | SCRUM-86 | K1 SCRUM-147 · K2 148 · K3 149 · K4 150 · K5 151 · K6 152 · K7 153 · K8 154 · K9 155 · K10 156 |

Cada tarea tiene responsable, fecha límite, prioridad, etiqueta por capa (`database`, `backend`,
`frontend`, `docs`) más `sprint-2`, y los enlaces «is blocked by» de la columna «Bloqueada por».

---

Plan hecho con la ayuda de Claude a partir de las instrucciones del Sprint 2, las notas del profesor, las
entrevistas con el cliente y el estado del repositorio y de Jira al 21 de octubre de 2026.
