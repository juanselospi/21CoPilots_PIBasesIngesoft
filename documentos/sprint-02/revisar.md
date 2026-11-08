# Pendientes a revisar antes de entregar el Sprint 2

Fecha: 2 de noviembre de 2026 · Entrega: 10 de noviembre de 2026

## Los servicios que usan correo tienen que enviar correos de verdad

Antes de entregar el sprint, todo lo que dependa de mandar un correo tiene que
funcionar con un envío real, no solo dejando el enlace en el log del servidor.
Escribir el enlace en el log sirve para desarrollar y probar, pero no cuenta como
funcionalidad terminada.

| Servicio | Tareas | Estado al 2/11 |
|---|---|---|
| Recuperar contraseña (RF-54): enlace de un solo uso y con vencimiento | SCRUM-117 (servidor), SCRUM-118 (pantallas) | Las pantallas están hechas. El servidor todavía no tiene las rutas ni el envío del correo |

Si en el sprint aparece otro servicio que mande correos, se agrega a esta tabla.

### Qué tiene que quedar listo

- El servidor manda el correo de recuperación con un proveedor real (SMTP o un
  servicio de correo). Las credenciales van en `apps/server/.env` y no se suben a
  Git; en `.env.example` quedan los nombres de las variables.
- El enlace del correo apunta a la dirección del cliente web
  (`/restablecer?token=...`), configurable para desarrollo y para la demo.
- El mensaje al pedir el enlace sigue siendo neutro: no dice si el correo existe.
- El enlace se puede usar una sola vez y vence.

### Cómo se verifica

1. Pedir el enlace desde `/recuperar-contrasena` con el correo de una cuenta real
   del equipo.
2. Confirmar que el correo llega a la bandeja de entrada (revisar también spam).
3. Abrir el enlace, cambiar la contraseña e iniciar sesión con la nueva.
4. Volver a abrir el mismo enlace y confirmar que se rechaza.
5. Pedir el enlace con un correo que no existe y confirmar que la pantalla muestra
   el mismo mensaje.
6. Guardar capturas en `evidencias/`.

### Fecha límite

Antes del congelamiento de funcionalidades del jueves 5 de noviembre, para que la
demo interna del viernes 6 use el envío real.

## «Mi cuenta» del cliente: probado, con capturas

La sección de datos de contacto de `/mi-cuenta` (SCRUM-126) ya está hecha y se
probó en el navegador con la base de datos y el servidor levantados.

| Tarea | Estado al 6/11 |
|---|---|
| SCRUM-126: datos de contacto en «Mi cuenta» y enlace a «Mis pedidos» | Probado, con capturas |

### Cómo se verifica

Como cliente:

1. Entrar a `/mi-cuenta` y confirmar que nombre, correo y cédula se ven pero no se
   pueden editar.
2. Abrir «Datos de contacto», cambiar la dirección, guardar y recargar la página:
   la dirección nueva tiene que seguir ahí.
3. Escribir un teléfono inválido (por ejemplo `8888-888`) y confirmar que el error
   sale en ese campo y no se guarda.
4. Dejar la dirección vacía y confirmar que se marca como obligatoria.
5. Agregar teléfonos hasta llegar a 5 y confirmar que el botón «Agregar teléfono»
   desaparece; quitar uno y guardar. Con un solo teléfono no aparece el botón de
   quitar.
6. Guardar un teléfono escrito sin guion (`88888888`) y confirmar que se muestra
   como `8888-8888`.
7. Abrir el formulario, no cambiar nada y guardar: se cierra sin errores.
8. Cambiar algo y darle «Cancelar»: se descartan los cambios.
9. Revisar la vista en celular (los campos se apilan).

Como administrador:

10. Entrar a `/mi-cuenta` y confirmar que solo se ven nombre, correo y la sección
    de contraseña, sin datos de contacto ni «Mis pedidos».

Las capturas están en `evidencias/mi-cuenta/datos-de-contacto/`. La dirección
nueva ya se ve en el checkout (`direccion-nueva-en-el-checkout.png`).

### Pendiente

- Saldo a favor: la tarea pide mostrarlo si entraba la épica de créditos. El servidor
  ya lo manda en `saldoCredito` y el checkout lo usa, pero Mi cuenta todavía no lo
  muestra.

## «Agregar al carrito» y contador: probado, con capturas

El botón de la tarjeta y de la ficha, y los contadores del header y de `/acceso`
(SCRUM-129) ya están hechos y se probaron en el navegador con la base de datos y
el servidor levantados.

| Tarea | Estado al 6/11 |
|---|---|
| SCRUM-129: «Agregar al carrito» en la tarjeta y la ficha; contador del carrito | Probado, con capturas |

### Cómo se verifica

Como visitante (sin sesión):

1. Darle «Agregar al carrito» en una tarjeta del inicio o del catálogo: lleva a
   `/acceso?volver=` con la página donde estaba.
2. Iniciar sesión como cliente: regresa a esa misma página. El producto no se
   agrega solo, hay que volver a darle al botón.

Como cliente:

3. Agregar desde una tarjeta: sale «Agregado al carrito», se quita solo y el
   contador del header sube en 1.
4. En la ficha, subir la cantidad con «+» (o escribirla) y agregar: el contador
   sube esa cantidad y el selector vuelve a 1.
5. Agregar el mismo producto otra vez: el contador suma las unidades (cuenta
   unidades, no productos distintos).
6. Con un producto que no admite contrapedido, pedir más de lo que hay: sale el
   mensaje del servidor «El máximo disponible es N.» y el contador no cambia.
7. Con un producto por contrapedido, pedir más de lo que hay: se agrega y sale el
   aviso de cuántas unidades van por contrapedido.
8. Entrar a `/acceso` con la sesión abierta: «Carrito (N)» muestra la misma
   cantidad que el header.
9. Cerrar el navegador, volver a abrirlo y entrar a la tienda: el contador sigue
   igual. Cerrar sesión (queda en 0), volver a iniciar sesión y confirmar que
   el carrito sigue ahí.

Como administrador:

10. En la tienda el botón «Agregar al carrito» se ve pero no hace nada, y el
    contador queda en 0. El carrito del administrador queda para un sprint
    posterior (ver `cambios-siguiente-sprint.md`).

Las capturas están en `evidencias/carrito/agregar/`.

## Página `/carrito`: probado, con capturas

La página del carrito (SCRUM-130) ya está hecha. Lint, build y pruebas unitarias
pasan, y se recorrió en el navegador con la base de datos y el servidor
levantados.

| Tarea | Estado al 6/11 |
|---|---|
| SCRUM-130: página `/carrito` con totales, avisos y botón «Finalizar compra» | Probado, con capturas |

### Cómo se verifica

Como visitante (sin sesión):

1. Entrar a `/carrito`: sale «Tu carrito está vacío» con el enlace al catálogo y
   el de iniciar sesión, que regresa a `/carrito` después de entrar.

Como cliente:

2. Con productos en el carrito, cada línea muestra imagen, nombre, precio de la
   unidad con impuesto, cantidad, total y «Quitar»; a la derecha el resumen con
   subtotal, impuesto y total.
3. Subir o bajar la cantidad con «+» y «−», o escribirla y salir del campo: cambian
   el total de la línea, el resumen y el contador del header.
4. Dejar la cantidad vacía o en 0: sale el error en la línea y no se guarda.
5. Con un producto que no admite contrapedido, pedir más de lo que hay: sale
   «El máximo disponible es N.» y la cantidad vuelve a la que tenía.
6. Con un producto por contrapedido, pedir más de lo que hay: la línea queda con
   la etiqueta «Por contrapedido» y cuántas unidades van por contrapedido.
7. Dejar en 0 las existencias de un producto del carrito que no admite
   contrapedido (desde el panel) y volver a `/carrito`: la línea sale «Fuera de
   stock» con la cantidad bloqueada y «Finalizar compra» queda deshabilitado
   hasta quitarla.
8. Cambiar el precio de un producto del carrito (por ejemplo el margen, desde el
   panel) y volver a `/carrito`: cambian el precio de la línea y el total.
9. Quitar todas las líneas: sale «Tu carrito está vacío» y el contador queda en 0.

Como administrador:

10. `/carrito` sale vacío, el carrito del administrador queda para un sprint
    posterior (ver `cambios-siguiente-sprint.md`).

Las capturas que pide la tarea están en `evidencias/carrito/pagina/`: línea normal,
línea por contrapedido, línea fuera de stock, y el total antes y después de cambiar
un precio. Para esos casos el precio y las existencias se cambiaron directo en la
base de datos local, no desde el panel.

### Pendiente que depende de otras tareas

- El tope de existencias se conoce hasta que el servidor responde (409), porque
  el carrito no dice si el producto admite contrapedido. Si se quiere deshabilitar
  el «+» al llegar al tope, el servidor tendría que mandar `admiteContrapedido`
  en cada línea.

## Finalizar la compra: probado, con capturas

El checkout en `/finalizar-compra`, la confirmación y la factura (SCRUM-136) ya
están hechos y se probaron en el navegador con la base de datos y el servidor
levantados. La demo completa una compra aprobada y una rechazada, y muestra la
factura.

| Tarea | Estado al 6/11 |
|---|---|
| SCRUM-136: checkout, pago emulado, confirmación y factura | Probado, con capturas |

Las capturas de cada paso están en `evidencias/checkout/compra/`.

### Cómo repetir la prueba

Con `cliente@correo.test` / `Cliente123!` y algo en el carrito:

- **Compra aprobada:** cualquier tarjeta de 12 a 19 dígitos con un vencimiento
  futuro, por ejemplo `4242 4242 4242 4242`. SINPE Móvil siempre se aprueba.
- **Compra rechazada:** una tarjeta que termine en `0000`. El carrito queda igual.
- **Contra entrega:** queda pendiente de cobro y sin factura.
- **Sin existencias:** dejar el resumen abierto, bajar a 0 las existencias de un
  producto del carrito que no admita contrapedido y confirmar: vuelve a `/carrito`
  con la línea marcada «Fuera de stock».

### Pendientes

- **Datos del emisor:** la factura dice «POR DEFINIR» en la cédula jurídica y la
  dirección del negocio. Faltan los datos reales del cliente, antes de la entrega
  hay que cargarlos en `facturacion.emisor`.
- **Contra entrega por nivel de fidelidad:** hoy lo pueden escoger todos los
  clientes, porque el nivel todavía no existe. Ver `cambios-siguiente-sprint.md`.

## «Mis pedidos» del cliente: probado, con capturas

La lista `/mis-pedidos` y el detalle de cada pedido (SCRUM-137) ya están hechos y se
probaron en el navegador con la base de datos y el servidor levantados. El estado
se cambió desde el panel del administrador y el cliente lo vio cambiar. La lista
trae los últimos 100 pedidos; el historial con filtros es del Sprint 3.

| Tarea | Estado al 8/11 |
|---|---|
| SCRUM-137: «Mis pedidos» con el estado vigente y su detalle | Probado, con capturas |

Las capturas están en `evidencias/pedidos/mis-pedidos/`. Las del criterio de la
tarea son `estado-antes-del-cambio.png`, `administrador-cambia-el-estado.png` y
`estado-despues-del-cambio.png`.

### Cómo repetir la prueba

Con `cliente@correo.test` / `Cliente123!`:

1. Entrar a «Mis pedidos» desde el menú de la cuenta o desde Mi cuenta: salen los
   pedidos con número, fecha, estado y total, del más nuevo al más viejo.
2. Abrir un pedido: salen la entrega, las líneas, los totales, los pagos y el enlace
   a la factura. No hay botón de cancelar.
3. Con `admin@dchobbies.test` / `Admin123!`, entrar a `/admin/pedidos`, abrir el
   pedido n.º 4 y darle «Marcar procesado». Recargar «Mis pedidos»: sale «Procesado».

### Pendientes

- El botón «Recibí mi pedido» (opcional en la tarea) se dejó fuera de este sprint.
- `documentos/diseño/matriz-permisos.md` todavía dice que el cliente puede cancelar
  su pedido, lo que contradice la entrevista 2, punto 2. Se corrige con SCRUM-156.
