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

## «Mi cuenta» del cliente: prueba manual y capturas

La sección de datos de contacto de `/mi-cuenta` (SCRUM-126) ya está hecha. Lint,
build y pruebas unitarias pasan, pero falta probarla en el navegador con la base
de datos y el servidor levantados, y guardar la evidencia.

| Tarea | Estado al 3/11 |
|---|---|
| SCRUM-126: datos de contacto en «Mi cuenta» y enlace a «Mis pedidos» | Código listo, falta la prueba manual y las capturas |

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

Guardar las capturas en `evidencias/mi-cuenta/`.

### Pendiente que depende de otras tareas

- El enlace «Mis pedidos» lleva a `/mis-pedidos`, que todavía no existe (página
  en blanco). Se completa con SCRUM-137.
- El criterio de la tarea pide que el cambio de dirección se vea en el siguiente
  checkout. Se verifica cuando esté SCRUM-136, que tiene que precargar la
  dirección desde `GET /api/clientes/me`. Agregar esa captura en el mismo folder.
- Saldo a favor: no se muestra porque los créditos (SCRUM-85, SCRUM-145) siguen
  sin hacerse.

### Fecha límite

Antes del congelamiento de funcionalidades del jueves 5 de noviembre.
