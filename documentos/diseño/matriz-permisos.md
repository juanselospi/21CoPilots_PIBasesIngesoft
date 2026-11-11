# Matriz de permisos por rol

**Proyecto:** DC Hobbies Cultura Geek Online · **Equipo:** Twenty One CoPilots
**Tarea:** SCRUM-6 (HU-02 — Inicio de sesión con permisos por rol)
**Documentos relacionados:** [`arquitectura.md`](arquitectura.md) § 6.1,
[`modelo-datos.md`](modelo-datos.md) (`usuarios.usuario`, `admin.administrador`,
`clientes.cliente`)

Este documento resume lo que acordamos en las reuniones del equipo sobre qué puede
hacer cada tipo de usuario en el sistema.

---

## 1. Roles

Según RF-50, el sistema tiene **dos roles**: **Administrador** y **Cliente**. En una
versión anterior del backlog aparecían también cajero y bodeguero, pero los quitamos
porque no están en el SRS.

Además de los dos roles, en la tabla aparece el **visitante**: alguien que entra a la
tienda sin iniciar sesión. No es un rol en la base de datos (no tiene cuenta), pero
lo incluimos porque la tienda pública tiene que funcionar para esa persona.

| Rol | Quién es | Cuántas cuentas |
|---|---|---|
| Administrador (propietario) | El dueño del negocio | Una sola (RF-49) |
| Empleado | Quien le ayuda al dueño; en la base es otro administrador | Las que cree el propietario |
| Cliente | Quien compra en la tienda en línea | Las que se registren |
| Visitante | Cualquiera sin sesión | — |

---

## 2. Matriz

✅ permitido · ❌ no permitido

| Acción | Visitante | Cliente | Empleado | Administrador |
|---|:---:|:---:|:---:|:---:|
| Ver la página de inicio y el catálogo | ✅ | ✅ | ✅ | ✅ |
| Ver la ficha de un producto | ✅ | ✅ | ✅ | ✅ |
| Iniciar sesión / crear cuenta | ✅ | — | — | — |
| Ver y editar sus propios datos | ❌ | ✅ | ✅ | ✅ |
| Usar el carrito, hacer pedidos y ver sus propios pedidos | ❌ | ✅ | ❌ | ❌ |
| Consultar su saldo a favor y usarlo al pagar | ❌ | ✅ | ❌ | ❌ |
| Cancelar un pedido antes del despacho (RF-28; el cliente no, entrevista 2) | ❌ | ❌ | ✅ | ✅ |
| Entrar al panel de administración | ❌ | ❌ | ✅ | ✅ |
| Ver costos, márgenes y productos ocultos en la tienda (listado del panel) | ❌ | ❌ | ✅ | ✅ |
| Agregar, editar, desactivar, eliminar y consultar productos | ❌ | ❌ | ✅ | ✅ |
| Administrar las familias de productos | ❌ | ❌ | ✅ | ✅ |
| Importar el catálogo desde Excel y descargar la plantilla (RF-57 a RF-59) | ❌ | ❌ | ✅ | ✅ |
| Cambiar precios y márgenes (RF-51) y gestionar ofertas de descuento (aprobado #10) | ❌ | ❌ | ✅ | ✅ |
| Registrar ingresos y salidas de mercancía (RF-13, RF-14) | ❌ | ❌ | ✅ | ✅ |
| Registrar ventas y gestionar pedidos (estado, edición de líneas y pedidos manuales) | ❌ | ❌ | ✅ | ✅ |
| Consultar clientes y reportes | ❌ | ❌ | ✅ | ✅ |
| Corregir los datos de un cliente (aprobado #3) | ❌ | ❌ | ✅ | ✅ |
| Configurar tarifas de envío, datos fiscales y términos (aprobados #11 a #13) | ❌ | ❌ | ❌ | ✅ |
| Crear, listar y desactivar cuentas de empleados | ❌ | ❌ | ❌ | ✅ |
| Ver la bitácora de auditoría (RF-52) | ❌ | ❌ | ✅ | ✅ |

Todavía no tienen ruta en el servidor: gestionar ofertas, consultar la lista de
clientes y los reportes, corregir los datos de un cliente, y configurar tarifas, datos fiscales y
términos. Se implementan en sprints posteriores; la matriz las incluye para que la
regla quede definida desde ahora.

En resumen: **el cliente solo ve la parte pública de la tienda y lo suyo**; todo lo
que está dentro del panel es del administrador y sus empleados, salvo crear cuentas y
configurar el negocio, que solo hace el propietario.

---

## 3. Cómo se aplica

- **En la base de datos:** el rol sale de la especialización de `usuarios.usuario`:
  es administrador si está en `admin.administrador` y cliente si está en
  `clientes.cliente`. Además:
  - un índice único parcial impide que exista más de un propietario (RF-49); los
    empleados son otras filas de `admin.administrador` (§ 4);
  - la especialización es traslapada, como en el EER: una misma cuenta puede estar
    en las dos tablas. El 26/10 se decidió que esa cuenta tenga **los dos permisos**,
    pero eso **todavía no está implementado**: hoy el servidor le da un solo rol
    (`ROL_DEL_USUARIO` en `admin.repository.js`). Si es administrador activo gana ese
    rol y las rutas de cliente le responden 403; si su cuenta de administrador está
    desactivada, queda como cliente
    (ver [`cambios-siguiente-sprint.md`](../requerimientos/cambios-siguiente-sprint.md));
  - el carrito y el pedido apuntan a `clientes.cliente`, así que solo un cliente
    puede tenerlos;
  - el registro de mercancía (`inventario.producto_administra`) apunta a
    `admin.administrador`, así que solo el administrador puede hacerlo.
- **En el servidor:** `identificarUsuario` corre en todas las peticiones (`app.js`) y
  deja al usuario de la cookie en la petición, sin bloquear. Cada ruta protegida
  agrega la cadena `exigirSesion → exigirRol(ADMINISTRADOR)`
  ([`arquitectura.md`](arquitectura.md) § 6.1). Sin sesión se responde 401 y con un
  rol sin permiso, 403. Las rutas del servidor son las de la tabla de abajo.
  «Administrador» incluye a los empleados; lo que solo hace el dueño lleva
  `exigirPropietario`.

  | Quién | Ruta | Acción |
  |---|---|---|
  | Público | `GET /api/salud` | Estado del servidor |
  | Público | `GET /api/catalogo/productos` | Catálogo de la tienda |
  | Público | `GET /api/catalogo/productos/:sku` | Ficha de un producto |
  | Público | `GET /api/catalogo/familias` y `GET /api/catalogo/categorias` | Familias visibles |
  | Público | `GET /api/pedidos/modalidades` | Modalidades de entrega con su costo |
  | Público | `POST /api/clientes` | Crear cuenta de cliente |
  | Público | `POST /api/admin/sesion` | Iniciar sesión |
  | Público | `DELETE /api/admin/sesion` | Cerrar sesión |
  | Público | `POST /api/admin/contrasena/recuperacion` | Pedir el enlace de recuperación |
  | Público | `POST /api/admin/contrasena/restablecimiento` | Cambiar la contraseña con el enlace |
  | Con sesión | `GET /api/admin/sesion` | Consultar la sesión propia |
  | Con sesión | `PATCH /api/admin/contrasena` | Cambiar la contraseña propia |
  | Cliente | `GET /api/clientes/me` | Ver sus datos |
  | Cliente | `PATCH /api/clientes/me` | Corregir dirección y teléfonos |
  | Cliente | `GET /api/clientes/me/creditos` | Ver su saldo a favor |
  | Cliente | `GET /api/pedidos/carrito` | Ver su carrito |
  | Cliente | `POST /api/pedidos/carrito/lineas` | Agregar un producto al carrito |
  | Cliente | `PATCH /api/pedidos/carrito/lineas/:sku` | Cambiar la cantidad |
  | Cliente | `DELETE /api/pedidos/carrito/lineas/:sku` | Quitar una línea |
  | Cliente | `POST /api/pedidos` | Confirmar la compra |
  | Cliente | `GET /api/pedidos` | Listar sus pedidos |
  | Cliente | `GET /api/pedidos/:numCarrito` | Ver un pedido suyo |
  | Cliente | `GET /api/pedidos/:numCarrito/pagos` | Ver los pagos de un pedido suyo |
  | Cliente | `GET /api/pedidos/:numCarrito/factura` | Ver la factura de un pedido suyo |
  | Administrador | `GET /api/catalogo/admin/productos` | Listado del panel, con costos y márgenes |
  | Administrador | `POST /api/catalogo/productos` | Agregar un producto |
  | Administrador | `PATCH /api/catalogo/productos/:sku` | Editar un producto |
  | Administrador | `PATCH /api/catalogo/productos/:sku/estado` | Desactivar o reactivar un producto |
  | Administrador | `DELETE /api/catalogo/productos/:sku` | Eliminar un producto que no está en un pedido sin finalizar (su historial se conserva) |
  | Administrador | `GET /api/catalogo/admin/familias` | Listado de familias del panel |
  | Administrador | `POST /api/catalogo/familias` | Agregar una familia |
  | Administrador | `PATCH /api/catalogo/familias/:nombre` | Editar o desactivar una familia |
  | Administrador | `DELETE /api/catalogo/familias/:nombre` | Eliminar una familia sin productos |
  | Administrador | `POST /api/admin/importaciones` | Importar el Excel |
  | Administrador | `GET /api/admin/importaciones/plantilla` | Descargar la plantilla |
  | Administrador | `GET /api/admin/bitacora` | Consultar la bitácora |
  | Administrador | `GET /api/clientes/admin` | Buscar clientes para registrar una venta |
  | Administrador | `GET /api/inventario/alertas` | Alertas de existencias bajas |
  | Administrador | `POST /api/inventario/ingresos` | Registrar un ingreso de mercancía |
  | Administrador | `POST /api/inventario/ajustes` | Registrar un ajuste con motivo |
  | Administrador | `GET /api/inventario/movimientos` | Historial de movimientos |
  | Administrador | `GET /api/pedidos/admin` | Listado de pedidos con filtros |
  | Administrador | `POST /api/pedidos/admin` | Registrar un pedido manual |
  | Administrador | `GET /api/pedidos/admin/:correo/:numCarrito` | Detalle de un pedido |
  | Administrador | `POST /api/pedidos/admin/:correo/:numCarrito/estado` | Cambiar el estado o cancelar |
  | Administrador | `POST /api/pedidos/admin/:correo/:numCarrito/lineas` | Agregar una línea |
  | Administrador | `PATCH /api/pedidos/admin/:correo/:numCarrito/lineas/:sku` | Cambiar la cantidad de una línea |
  | Administrador | `DELETE /api/pedidos/admin/:correo/:numCarrito/lineas/:sku` | Quitar una línea |
  | Administrador | `POST /api/pedidos/admin/:correo/:numCarrito/lineas/:sku/reemplazo` | Reemplazar una línea por igual o menor valor |
  | Propietario | `POST /api/admin/usuarios` | Crear una cuenta de empleado |
  | Propietario | `GET /api/admin/usuarios` | Listar administradores y empleados |
  | Propietario | `PATCH /api/admin/usuarios/:correo/activo` | Activar o desactivar un empleado |

  Todo `/api/reportes` exige ser administrador, pero todavía no tiene rutas (HU-15).
  Las pruebas de rutas de cada módulo verifican el 401 y el 403.
- **En la bitácora:** cada intento no autorizado publica el evento `acceso_denegado`
  (RNF-10), que se guarda en `admin.bitacora` (migración 015).
- **En el cliente web:** `AdminRoute` manda al visitante a `/acceso` y al cliente de
  vuelta a la tienda, y el encabezado solo muestra el enlace al panel al
  administrador. `SessionRoute` pide sesión sin importar el rol, y `ClientRoute`
  deja pasar solo al cliente. Esto es solo para la experiencia
  de uso; la protección real es la del servidor, porque cualquiera puede escribir la
  URL a mano.

No usamos tablas de `rol`, `permiso` y `rol_permiso`: con solo dos roles, una matriz
en la base de datos sería más compleja que lo que resuelve.

---

## 4. Cuentas para empleados

En la entrevista del 24 de setiembre ([`e1-24-9-2026.md`](../entrevistas/e1-24-9-2026.md),
punto 6) el cliente aprobó crear **cuentas para empleados**. Decidimos implementarlo en
el Sprint 2, junto con ventas y pedidos, que es donde los empleados lo van a usar
(documento del Sprint 1, § 3.5, y
[`cambios-siguiente-sprint.md`](../requerimientos/cambios-siguiente-sprint.md)).

Cómo quedó (migración 016, SCRUM-119):

- Un empleado es otra fila de `admin.administrador` con `es_propietario = false`, así
  que para `exigirRol` es un administrador más. Lo que solo hace el dueño lleva
  además `exigirPropietario`, que responde 403 y registra el intento en la bitácora
  igual que `exigirRol`.
- El propietario crea las cuentas (`POST /api/admin/usuarios`), las lista
  (`GET /api/admin/usuarios`) y las activa o desactiva
  (`PATCH /api/admin/usuarios/:correo/activo`). La contraseña sigue la misma política
  que las demás.
- Una cuenta desactivada no se borra, para no perder quién hizo qué: deja de tener el
  rol de administrador y sus sesiones se cierran. La del propietario no se puede
  desactivar.
- `GET /api/admin/sesion` devuelve `esPropietario`, para que el panel muestre la
  gestión de empleados solo al dueño.
