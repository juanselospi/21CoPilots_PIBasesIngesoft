# Matriz de permisos por rol

**Proyecto:** DC Hobbies Cultura Geek Online · **Equipo:** Twenty One CoPilots
**Tarea:** SCRUM-6 (HU-02 — Inicio de sesión con permisos por rol)
**Documentos relacionados:** [`arquitectura.md`](arquitectura.md) § 6.1,
[`modelo-datos.md`](modelo-datos.md) (`admin.usuario`)

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
| Hacer pedidos y ver sus propios pedidos | ❌ | ✅ | ❌ |
| Entrar al panel de administración | ❌ | ❌ | ✅ |
| Agregar, editar, excluir y consultar productos | ❌ | ❌ | ✅ |
| Importar el catálogo desde Excel (RF-57 a RF-59) | ❌ | ❌ | ✅ |
| Cambiar precios, márgenes y descuentos (RF-51) | ❌ | ❌ | ✅ |
| Registrar ventas y gestionar pedidos | ❌ | ❌ | ✅ |
| Consultar clientes y reportes | ❌ | ❌ | ✅ |
| Ver la bitácora de auditoría (RF-52) | ❌ | ❌ | ✅ |

Algunas de estas acciones (carrito, pedidos, reportes) se implementan en sprints
posteriores; la matriz las incluye para que la regla quede definida desde ahora.

En resumen: **el cliente solo ve la parte pública de la tienda y lo suyo**; todo lo
que está dentro del panel es exclusivo del administrador.

---

## 3. Cómo se aplica

- **En la base de datos:** `admin.usuario.rol` solo acepta `'administrador'` o
  `'cliente'`, y un índice único impide que exista más de un administrador (RF-49).
- **En el servidor:** las rutas del panel pasan por la cadena de middlewares
  `identificarUsuario → exigirSesion → exigirRol(ADMINISTRADOR)`
  ([`arquitectura.md`](arquitectura.md) § 6.1). Sin sesión se responde 401 y con un
  rol sin permiso, 403.
- **En la bitácora:** cada intento no autorizado queda registrado (RNF-10).
- **En el cliente web:** el menú no muestra opciones del panel a quien no es
  administrador (SCRUM-12). Esto es solo para la experiencia de uso; la protección
  real es la del servidor, porque cualquiera puede escribir la URL a mano.

No usamos tablas de `rol`, `permiso` y `rol_permiso`: con solo dos roles, una matriz
en la base de datos sería más compleja que lo que resuelve.

---

## 4. Cuentas para empleados

En la entrevista del 24 de setiembre ([`e1-24-9-2026.md`](../entrevistas/e1-24-9-2026.md),
punto 6) el cliente aprobó crear **cuentas para empleados**. Decidimos implementarlo en
el Sprint 2, junto con ventas y pedidos, que es donde los empleados lo van a usar
(ver [`cambios-siguiente-sprint.md`](../requerimientos/cambios-siguiente-sprint.md)).
