# Cambios para el siguiente sprint

Aquí anotamos los requerimientos y cambios que surgen durante un sprint pero que
decidimos no hacer en ese momento: cosas aprobadas por el cliente, trabajo diferido,
dudas por confirmar, etc.

**Cómo usarlo:**

1. Cuando surja algo que no entra en el sprint actual, se agrega una fila en la tabla
   del sprint con lo mínimo: qué es, de dónde salió y por qué se pasa.
2. En la sprint review se revisa la lista y cada punto se lleva al documento del
   sprint siguiente (y a Jira, si corresponde).
3. Los puntos que ya se incorporaron se marcan como ✅ y se dejan como historial.

---

## Sprint 1 → Sprint 2

| Cambio | Origen | Motivo para pasarlo | Estado |
|---|---|---|---|
| Cuentas para empleados: nuevo rol `empleado` y creación de cuentas por el administrador.<br>• **Por definir:** qué puede hacer un empleado. Cuando se defina, agregar su columna en [`matriz-permisos.md`](../diseño/matriz-permisos.md) y el rol `empleado` en una migración nueva | Entrevista del 24/09, punto 6 (aprobado) | Los empleados usan sobre todo ventas y pedidos, que se implementan después; el Sprint 1 es de productos | Pendiente |
| Movimientos de inventario y alerta de existencias bajas | Planificación del Sprint 1 (SCRUM-55) | No caben en el Sprint 1 | Pendiente |
| Recuperación de contraseña (RF-54) | HU-02 (SCRUM-3) | Es _Should_ y se dejó para el Sprint 2 | Pendiente |
| Cierre de sesión y expiración (SCRUM-13) | Backlog | No corresponde a ningún RF del SRS; se reevalúa junto con RF-54 | Pendiente |
| Bloque "Recién llegados" de la página de inicio | Wireframe de Inicio, bloque 5 (SCRUM-60) | Depende de la fecha de ingreso de mercancía (HU-07) | Pendiente |
| Total de productos en la respuesta de `GET /api/catalogo/productos`.<br>• **Por definir:** si "Ver todo" usa números de página o un botón "Cargar más". Mientras tanto, el cliente sabe que hay otra página cuando recibe tantos productos como pidió en `limite` | Plan de SCRUM-69 (cliente HTTP y `useCatalogo`) | Cambia el contrato del endpoint (SCRUM-40, ya cerrado); para SCRUM-51 alcanza con saber si hay otra página | Pendiente |
| Pasar `api/sesion.js` y `api/importaciones.js` al `clienteHttp`, y que `ImportExcel` reciba la llamada por props en vez de importar de `api/` | Plan de SCRUM-69 (cliente HTTP y `useCatalogo`) | Se dejó fuera de SCRUM-69 para limitarla a lo nuevo. Mientras no se haga, `ImportExcel.jsx` incumple la regla de [`arquitectura.md` § 11.1](../diseño/arquitectura.md) (ningún componente importa de `api/`) | Pendiente |

## Sprint 2 → Sprint 3

| Cambio | Origen | Motivo para pasarlo | Estado |
|---|---|---|---|
| Buscador de la barra superior | Wireframe de Inicio, bloque 1 (SCRUM-60) | Corresponde a HU-06, búsqueda y filtrado del cliente | Pendiente |
| Carrito, contador y botón "Agregar al carrito" | Wireframe de Inicio (SCRUM-60) | Depende del modelo de carrito | Pendiente |

## Por confirmar con el cliente

| Duda | Origen | Afecta a |
|---|---|---|
| ¿El registro de clientes ("Crear cuenta") está disponible antes de comprar o solo al hacer la primera compra? | Notas del wireframe de Acceso | Pantalla de login y registro (SCRUM-11) |
| ¿De dónde sale la subcategoría de un producto importado? La hoja real no la trae; mientras tanto se toma del prefijo de `codigo_item` (PS5, NSW, LEG, PKM, YGO) | Hoja real de productos (DEP-01) | Importación del Excel (SCRUM-33, SCRUM-34) |
