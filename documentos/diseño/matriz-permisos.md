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
| Administrador | El dueño del negocio | Una sola (RF-49) |
| Cliente | Quien compra en la tienda en línea | Las que se registren |
| Visitante | Cualquiera sin sesión | — |

---

## 2. Matriz

✅ permitido · ❌ no permitido

| Acción | Visitante | Cliente | Administrador |
|---|:---:|:---:|:---:|
| Ver la página de inicio y el catálogo | ✅ | ✅ | ✅ |
| Ver la ficha de un producto | ✅ | ✅ | ✅ |
| Iniciar sesión / crear cuenta | ✅ | — | — |
| Ver y editar sus propios datos | ❌ | ✅ | ✅ |
| Usar el carrito, hacer pedidos y ver sus propios pedidos | ❌ | ✅ | ❌ |
| Cancelar su propio pedido antes del despacho (RF-28) | ❌ | ✅ | ❌ |
| Entrar al panel de administración | ❌ | ❌ | ✅ |
| Ver costos, márgenes y productos ocultos en la tienda (listado del panel) | ❌ | ❌ | ✅ |
| Agregar, editar, excluir y consultar productos | ❌ | ❌ | ✅ |
| Importar el catálogo desde Excel y descargar la plantilla (RF-57 a RF-59) | ❌ | ❌ | ✅ |
| Cambiar precios y márgenes (RF-51) y gestionar ofertas de descuento (aprobado #10) | ❌ | ❌ | ✅ |
| Registrar ingresos y salidas de mercancía (RF-13, RF-14) | ❌ | ❌ | ✅ |
| Registrar ventas y gestionar pedidos | ❌ | ❌ | ✅ |
| Consultar clientes y reportes | ❌ | ❌ | ✅ |
| Corregir los datos de un cliente (aprobado #3) | ❌ | ❌ | ✅ |
| Configurar tarifas de envío, datos fiscales y términos (aprobados #11 a #13) | ❌ | ❌ | ✅ |
| Ver la bitácora de auditoría (RF-52) | ❌ | ❌ | ✅ |

Algunas de estas acciones (carrito, pedidos, mercancía, ofertas, reportes y
configuración) se implementan en sprints posteriores; la matriz las incluye para que
la regla quede definida desde ahora.

En resumen: **el cliente solo ve la parte pública de la tienda y lo suyo**; todo lo
que está dentro del panel es exclusivo del administrador.

---

## 3. Cómo se aplica

- **En la base de datos:** el rol sale de la especialización de `usuarios.usuario`:
  es administrador si está en `admin.administrador` y cliente si está en
  `clientes.cliente`. Además:
  - un índice único impide que exista más de un administrador (RF-49);
  - la especialización es traslapada, como en el EER: una misma cuenta puede estar
    en las dos tablas. Cómo se combinan los permisos de esa cuenta está por definir
    (ver [`cambios-siguiente-sprint.md`](../requerimientos/cambios-siguiente-sprint.md));
  - el carrito y el pedido apuntan a `clientes.cliente`, así que solo un cliente
    puede tenerlos;
  - el registro de mercancía (`inventario.producto_administra`) apunta a
    `admin.administrador`, así que solo el administrador puede hacerlo.
- **En el servidor:** `identificarUsuario` corre en todas las peticiones (`app.js`) y
  deja al usuario de la cookie en la petición, sin bloquear. Cada ruta protegida
  agrega la cadena `exigirSesion → exigirRol(ADMINISTRADOR)`
  ([`arquitectura.md`](arquitectura.md) § 6.1). Sin sesión se responde 401 y con un
  rol sin permiso, 403. Las rutas protegidas hoy son:

  | Ruta | Acción |
  |---|---|
  | `GET /api/catalogo/admin/productos` | Listado del panel, con costos y márgenes |
  | `POST /api/catalogo/productos` | Agregar un producto |
  | `PATCH /api/catalogo/productos/:sku` | Editar precio, existencias o contrapedido |
  | `POST /api/admin/importaciones` | Importar el Excel |
  | `GET /api/admin/importaciones/plantilla` | Descargar la plantilla |

  `GET /api/admin/sesion` solo exige sesión: cualquier rol puede consultar la suya.
  Las pruebas API-01 a API-03 del documento del Sprint 1 verifican el 401 y el 403.
- **En la bitácora:** cada intento no autorizado publica el evento `acceso_denegado`
  (RNF-10). Dónde se guarda está por definir
  (ver [`cambios-siguiente-sprint.md`](../requerimientos/cambios-siguiente-sprint.md)).
- **En el cliente web:** `AdminRoute` manda al visitante a `/acceso` y al cliente de
  vuelta a la tienda, y el encabezado solo muestra el enlace al panel al
  administrador. Esto es solo para la experiencia de uso; la protección real es la
  del servidor, porque cualquiera puede escribir la URL a mano.

No usamos tablas de `rol`, `permiso` y `rol_permiso`: con solo dos roles, una matriz
en la base de datos sería más compleja que lo que resuelve.

---

## 4. Cuentas para empleados

En la entrevista del 24 de setiembre ([`e1-24-9-2026.md`](../entrevistas/e1-24-9-2026.md),
punto 6) el cliente aprobó crear **cuentas para empleados**. Decidimos implementarlo en
el Sprint 2, junto con ventas y pedidos, que es donde los empleados lo van a usar
(documento del Sprint 1, § 3.5, y
[`cambios-siguiente-sprint.md`](../requerimientos/cambios-siguiente-sprint.md)).
