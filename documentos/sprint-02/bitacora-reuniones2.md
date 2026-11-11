# Bitácora de Reuniones

---

## Reunión — [15/09/2026]

**Integrantes:** Jeferson Marin, Juan Loaiza, Agustin Soto, Joaquin Rodriguez

**Se habló:** Se revisaron ideas para los wireframes del sitio para cerrar su diseño.

- Se hizo un prototipo de la base de datos y se probó inicialmente.

**Acuerdos:**
- Hacer otra reunión para definir bien el diseño.
- Revisar el prototipo de la base de datos con base al esquema.

---

## Reunión — [17/09/2026]

**Integrantes:** Jeferson Marin, Juan Loaiza, Agustin Soto.

**Se habló:** Revisión del progreso del sprint y del estado de las tareas en curso.

- Se discutió cómo manejar la sesión de los usuarios en el servidor.

**Acuerdos:**
- Usar una cookie que almacene un token de sesión por usuario.
- Registrar ese token en un campo de una tabla del servidor, para validar la sesión en cada petición.

---

## Reunión — [18/09/2026]

**Integrantes:** Jeferson Marin, Juan Loaiza, Agustin Soto.

**Se habló:** Revisión de los wireframes del sitio para cerrar su diseño.

- Se definieron las versiones finales de los wireframes.

**Acuerdos:**
- Dar por terminada la versión final de los wireframes por parte del equipo.
- Queda pendiente presentarlos al cliente para su validación.

---

## Reunión — [22/09/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Reunión con el cliente para validar decisiones de diseño y de funcionamiento del sitio.

- Se le consultó al cliente cuánto tiempo prefería que durara la sesión de un usuario.
- Se presentaron los wireframes finales del sitio.
- Se propuso el nombre de la página.

**Acuerdos:**
- La sesión de usuario tendrá una duración de 25 minutos.
- El cliente aprobó los wireframes del sitio.
- Se aprobó el nombre **DC Hobbies** para la página.
- Preparar para la siguiente reunión la lista de funcionalidades de los wireframes que no están en el SRS del Sprint 0.

---

## Reunión — [24/09/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Entrevista 1 con el cliente (Daniel) sobre los requerimientos que salen de los wireframes y no están en el SRS, y cómo mostrar el precio de los productos.

- Se revisaron 16 puntos: lista y ficha de clientes, búsqueda y filtros de pedidos, venta presencial, cuentas para empleados, tablero del administrador, vitrina de inicio, configuración (niveles, tarifas de envío, datos fiscales, términos) y cierre de sesión.
- Se planteó si el precio debía mostrarse antes o después de aplicar el IVA. El Product Owner indicó que cualquiera de las dos opciones era aceptable.

**Acuerdos:**
- El cliente aprobó los 16 puntos (registro en `documentos/entrevistas/e1-24-9-2026.md`).
- Las cuentas para empleados quedan aprobadas como cambio de alcance para un sprint posterior.
- El precio se mostrará con el IVA incluido.

---

## Reunión — [26/09/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Organización técnica y forma de trabajo del equipo.

- Estructura del proyecto y del servidor.
- Uso de React y Vite para el desarrollo del cliente.
- Flujos de trabajo y modalidad de trabajo del equipo.

**Acuerdos:**
- Se actualizaron/asignaron las responsabilidades de cada integrante.
- Se repartieron las historias y tareas de JIRA entre los integrantes.

---

## Reunión — [30/09/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Revisión de la base de datos y del servidor contra el EER corregido.

- Se ajustó el modelo de la base de datos, la guía y el README al EER corregido.
- Se revisó qué partes del servidor (inicio de sesión, catálogo e importación) había que adaptar al modelo nuevo.
- Se encontraron puntos del EER que no cubren todo lo que pide el SRS: pagos sin número de referencia, usuarios que no son administrador ni cliente, bitácora de auditoría y cómo descontinuar un producto.

**Acuerdos:**
- Adaptar el inicio de sesión, el catálogo y la importación al EER corregido en este sprint.
- Anotar en `cambios-siguiente-sprint.md` lo que no cabe en el Sprint 1, para decidirlo al inicio del Sprint 2.
- Los módulos del servidor que todavía son esqueletos se adaptan cuando se implementen.

---

## Reunión — [3/10/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Se revisaron las últimas tareas del Sprint pendientes y el estado del proyecto.

- La edición del costo, la importación y el margen de un producto desde el servidor (SCRUM-19).
- La conexión del listado del panel de productos y de la ficha de producto con la API.
- El flujo que se va a mostrar en la demostración: el administrador edita un producto y el cambio se ve en la tienda.

**Acuerdos:**
- Se reasignaron las responsabilidades de cada integrante.
- Integrar a `develop` las tareas del panel y del servidor antes de la entrega.

---

## Reunión — [5/10/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Se habló del estado del proyecto final y cada uno habló de sus aportes para estar en la misma página.

- Posibles puntos para tomar en cuenta al presentar.
- Retrospectiva del Sprint 1: se terminaron 53 de 55 tareas y se integraron más de 40 PR a `develop`.
- Se revisó la documentación del código (comentarios de la importación y del catálogo).

**Acuerdos:**
- Se vieron los aportes de cada integrante.
- Se confirmó el estado del proyecto.
- Para el Sprint 2: hacer una reunión de decisiones del modelo al inicio del sprint e integrar el flujo completo a mitad del sprint, no al final.

---

## Reunión — [6/10/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Entrevista 2 con el cliente (Daniel) sobre pedidos y cuentas, antes de arrancar el Sprint 2.

- Un estado para los pedidos con problemas.
- Quién puede cancelar un pedido ya hecho.
- Si los empleados pueden editar pedidos.
- Qué pasa con la diferencia de precio al reemplazar un producto de un pedido.

**Acuerdos:**
- Se agrega el estado «en disputa», que se mantiene hasta resolver el problema y queda en el historial.
- Solo el administrador cancela un pedido; el cliente no puede cancelarlo una vez terminada la compra.
- Los empleados con cuenta de administrador sí pueden editar pedidos.
- Un producto solo se reemplaza por otro de igual o menor valor; no se cobra la diferencia.
- Registro en `documentos/entrevistas/e2-6-10-2026.md`.

---

## Reunión — [13/10/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Sesión de clase con el profesor sobre los requerimientos del Sprint 2.

- Estados del pedido y cambio a «entregado» por el administrador.
- Administración de pedidos: editar, cambiar, eliminar y agregar productos; pedidos manuales con su canal y creador; bitácora de cambios.
- Créditos a favor del cliente cuando se quita un producto de un pedido pagado.
- Familias de productos con margen y costo de importación, con excepción por producto.

**Acuerdos:**
- Pasar los requerimientos a `requerimientos-profesor.md`, con el minuto de la grabación de cada punto.
- Confirmar en equipo los tramos poco claros del audio.
- Usar estos requerimientos para armar el Sprint 2.

---

## Reunión — [22/10/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Planificación del Sprint 2 (21 de octubre – 10 de noviembre).

- Roles del equipo para el Sprint 2.
- Sprint Backlog y Product Backlog actualizados, con las épicas A a J.
- Fechas clave del sprint.

**Acuerdos:**
- Se mantienen los roles del Sprint 1 (votado por el equipo): Joaquín como Product Owner, Juan como Scrum Master, Agustín y Jeferson como Developers.
- Reparto: Joaquín base de datos y decisiones del modelo, Jeferson servidor, Juan tienda del cliente y documentación, Agustín panel del administrador.
- Hacer la reunión de decisiones del modelo antes de empezar las migraciones.
- Tener el flujo de punta a punta en `develop` el 3 de noviembre y congelar funcionalidades el 5 de noviembre.

---

## Reunión — [26/10/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Se tomaron varias decisiones sobre el estado de un producto, el sistema de pagos, el sistema de cliente.

- Se preparó un documento con las decisiones, de D1 a D9.

**Acuerdos:**
- Se rellenó el documento con las decisiones y se refleja en un documento del Sprint 2.
- Se confirmó el estado del proyecto.
- Decisiones principales:
  - Un producto tiene estado `activo` o `descontinuado`; uno sin historial se puede eliminar.
  - Si la pasarela no devuelve referencia, el servidor genera `LOCAL-<uuid>`.
  - Todo usuario registrado es cliente; el registro pide la cédula.
  - La bitácora de auditoría va en una tabla de la base de datos (`admin.bitacora`).
  - El historial del pedido guarda solo estado y fecha, para que «en disputa» pueda repetirse.
  - Una cuenta que es administrador y cliente tiene los dos permisos.
  - Los empleados son cuentas de administrador adicionales; hay un solo propietario.
  - Las familias de productos son una entidad, y el producto hereda su importación y margen.
  - Las tarifas de envío y los datos del negocio van en la base de datos.

---

## Reunión — [27/10/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Otra Sesión de clase con el profesor sobre los requerimientos del Sprint 2.

- Estados del pedido y cambio a «entregado» por el administrador.
- Administración de pedidos: editar, cambiar, eliminar y agregar productos; pedidos manuales con su canal y creador; bitácora de cambios.
- Créditos a favor del cliente cuando se quita un producto de un pedido pagado.
- Familias de productos con margen y costo de importación, con excepción por producto.

**Acuerdos:**
- Pasar los requerimientos a `requerimientos-profesor.md`.
- Confirmar en equipo los requerimientos entendidos. 
- Usar estos requerimientos para ajustar el Sprint 2.

---

## Reunión — [29/10/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Se habló del estado del proyecto y cada uno habló de sus aportes para estar en la misma página.

- Posibles puntos para tomar en cuenta al hacer merge.
- Tareas Pendientes y cargas de trabajo de cada persona. 
- Se revisó la documentación del código (comentarios de la importación y del catálogo).

**Acuerdos:**
- Se vieron los aportes de cada integrante.
- Se confirmó el estado del proyecto.
- Mover un poco las tareas asignadas en Jira. 

---

## Reunión — [2/11/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Seguimiento del Sprint 2 y pendientes antes de la entrega.

- Estado de las migraciones: 010 a 014 integradas en `develop`; 015 a 017 (bitácora, empleados y créditos) en revisión.
- Avance del servidor: validación de campos, cierre de sesión y herencia de la familia en el precio.
- Servicios que dependen de enviar correos, como recuperar la contraseña.

**Acuerdos:**
- Antes de entregar, la recuperación de contraseña tiene que enviar un correo real, no solo dejar el enlace en el log.
- Confirmar en equipo cómo se usa un crédito a favor (C-22) antes de fusionar las migraciones 015 a 017.
- Guardar las capturas de las pruebas en `documentos/sprint-02/evidencias/`.

---

## Reunión — [9/11/2026]

**Integrantes:** Joaquin Rodriguez, Juan Loaiza, Agustin Soto, Jeferson Marin.

**Se habló:** Se habló del estado del proyecto final y cada uno habló de sus aportes para estar en la misma página.

- Posibles puntos para tomar en cuenta al presentar.
- Retrospectiva del Sprint 2: viendo la cantidad de tasks y pr's a`develop`.
- Se revisó la documentación del código (comentarios de la importación y del catálogo).

**Acuerdos:**
- Se vieron los aportes de cada integrante.
- Se confirmó el estado del proyecto.
- Para el Sprint 3: hacer una reunión de decisiones del modelo al inicio del sprint e integrar el flujo completo a mitad del sprint, no al final.

---
