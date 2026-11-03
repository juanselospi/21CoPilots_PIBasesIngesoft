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
