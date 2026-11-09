# Historias de usuario y criterios de aceptación del Sprint 2

Estado al 9 de noviembre de 2026 · Entrega: 10 de noviembre de 2026

Estas son las historias que trabajamos en el Sprint 2, con el mismo formato de la sección 7 del documento del Sprint 1: historia, épica, requerimientos, puntos, criterios en formato Gherkin, estado y evidencia. Esta sección pasa tal cual al documento del Sprint 2.

**Cómo leer las tablas:**

- **Cumplido:** el criterio se cumple y la evidencia de la fila lo respalda. **Parcial:** funciona solo una parte, y la nota dice qué falta. **Pendiente:** no se hizo.
- **Ajustado:** el criterio cambió respecto al SRS por una decisión del cliente, del profesor o del PDF del sprint.
- **Captura:** archivo dentro de `documentos/sprint-02/evidencias/`.
- **Prueba:** nombre de una prueba automatizada del servidor. «Sin captura» significa que hoy esa prueba es la única evidencia.

## Resumen

De las 10 historias, 8 quedaron terminadas (54 de 72 puntos). De los 45 criterios, 43 están cumplidos, 2 parciales y 0 pendientes.

| Historia | Puntos | Estado | Criterios cumplidos |
|---|---|---|---|
| HU-02 — Iniciar sesión con permisos por rol (continuación) | 5 | Parcial | 5 de 6 |
| HU-03 — Registrar y clasificar productos (continuación) | 5 | Terminada | 4 de 4 |
| HU-07 — Ingresar mercancía en una sola pantalla | 5 | Terminada | 3 de 3 |
| HU-08 — Recibir alerta de existencias bajas | 5 | Terminada | 2 de 2 |
| HU-10 — Conservar el carrito con contrapedido | 8 | Terminada | 5 de 5 |
| HU-11 — Registrarme como cliente | 5 | Terminada | 4 de 4 |
| HU-12 — Confirmar el pedido, pagar y facturar | 13 | Parcial | 4 de 5 |
| HU-16 — Familias de productos con importación y margen heredados (nueva) | 8 | Terminada | 6 de 6 |
| HU-17 — Administración de pedidos (nueva) | 13 | Terminada | 7 de 7 |
| PB-31 — Créditos a favor del cliente (nueva) | 5 | Terminada | 3 de 3 |

## HU-02 — Iniciar sesión con permisos por rol (continuación) · Parcial

Como usuario del sistema, quiero iniciar sesión con mi cuenta, para acceder únicamente a las funciones que corresponden a mi rol. · EP-07 · RF-49, RF-50, RF-52, RF-53, RF-54, RNF-10 · 5 puntos (vienen del Sprint 1)

En este sprint se completó lo que pide el PDF en § c) «Seguridad básica» y lo aprobado el 24/09: cierre de sesión, sesiones parametrizables, política de contraseñas, recuperación, empleados (PB-18) y bitácora (PB-05).

| Criterio | Estado | Evidencia y notas |
|---|---|---|
| Dado que tengo sesión<br>Cuando cierro sesión<br>Entonces la cookie deja de servir y el panel responde 401 | Cumplido | Captura `acceso/cierre-de-sesion/confirmar-cierre.png`, `acceso/cierre-de-sesion/sesion-cerrada.png`. Prueba «RF-53: cerrar sesión borra la cookie y después responde 401». |
| Dado que pasa el tiempo configurado sin actividad<br>Cuando vuelvo<br>Entonces el sistema me avisa que la sesión venció | Cumplido | Captura `acceso/sesion-vencida/aviso-de-sesion-vencida.png`. Prueba «una sesión vencida ya no identifica a nadie», «la duración de la sesión sale de la configuración». La duración se ajusta con `DURACION_SESION_MINUTOS`. |
| Dado que elijo una contraseña sin mayúscula, número o carácter especial<br>Cuando la guardo<br>Entonces el sistema la rechaza indicando qué falta | Cumplido | Captura `mi-cuenta/contrasena/no-cumple-la-politica.png`, `mi-cuenta/contrasena/contrasena-actualizada.png`. Prueba «una contraseña sin mayúscula se rechaza con ese motivo», «dice todo lo que falta en un solo mensaje». |
| Dado que olvidé mi contraseña<br>Cuando solicito recuperarla<br>Entonces recibo un enlace de un solo uso con vencimiento | Parcial | Prueba «RF-54: el enlace sirve una vez, cambia la contraseña y cierra las sesiones», «un enlace vencido o inventado no sirve». El enlace funciona, pero **no se envía por correo**: se escribe en el log del servidor. Falta el envío real (ver `revisar.md`). |
| Dado que soy el propietario<br>Cuando creo una cuenta de empleado<br>Entonces esa persona entra al panel y cada cambio que hace queda con su nombre en la bitácora | Cumplido | Prueba «el propietario crea un empleado con la contraseña guardada como hash», «solo el propietario gestiona empleados: un empleado recibe 403 y queda registrado», «el administrador avanza el pedido y queda en el historial con quién lo hizo». Sin captura. |
| Dado que cambio un margen o edito un pedido<br>Cuando consulto la bitácora<br>Entonces veo usuario, fecha, valor anterior y nuevo | Cumplido | Prueba «RF-52: un cambio de margen se guarda con usuario, entidad, valor anterior y nuevo», «cada cambio queda en la bitácora con la línea anterior y la nueva». Se consulta en Configuración y en el detalle del pedido. Sin captura. |

## HU-03 — Registrar y clasificar productos (continuación) · Terminada

Como administrador, quiero modificar cualquier dato de un producto, desactivarlo cuando ya no lo vendo y eliminarlo si nunca se vendió, para mantener el catálogo al día sin perder el historial. · EP-01 · RF-18 · 5 puntos (vienen del Sprint 1)

Completa lo que quedó parcial en el Sprint 1 y agrega eliminar, que el PDF del Sprint 2 ahora pide.

| Criterio | Estado | Evidencia y notas |
|---|---|---|
| Dado un producto<br>Cuando edito nombre, descripción, familia, proveedor o imagen desde el panel<br>Entonces el cambio se ve en la tienda | Cumplido | Captura `productos/edicion/modal-edicion-completo.png`, `productos/edicion/producto-actualizado.png`. Prueba «cambia el nombre, la descripción y el proveedor del producto», «mueve el producto a otra familia con el nombre como está guardado». |
| Dado un producto activo<br>Cuando lo desactivo<br>Entonces desaparece del catálogo público, pero sigue en los reportes y en el panel con la etiqueta «Descontinuado» | Cumplido | Captura `productos/acciones/producto-descontinuado.png`. Prueba «RF-18: descontinuar un producto lo saca de la tienda, la ficha y las familias», «en el panel sale con disponibilidad y etiqueta descontinuado, y se puede filtrar». La pantalla de reportes es de HU-15 (Sprint 3); el producto se conserva en las vistas que la van a alimentar. |
| Dado un producto con ventas o movimientos<br>Cuando intento eliminarlo<br>Entonces el sistema lo rechaza con un mensaje claro y me ofrece desactivarlo | Cumplido | Captura `productos/acciones/rechazo-por-historial.png`. Prueba «un producto con ventas o movimientos no se borra y pide desactivarlo». |
| Dado un producto sin historial<br>Cuando lo elimino<br>Entonces desaparece del sistema | Cumplido | Captura `productos/acciones/confirmar-eliminacion.png`, `productos/acciones/producto-eliminado.png`. Prueba «borra un producto sin historial y lo publica para la bitácora». |

## HU-07 — Ingresar mercancía en una sola pantalla · Terminada

Como administrador, quiero registrar la mercancía que llega indicando solo producto, cantidad y costo, para no perder tiempo en formularios largos cada vez que recibo un pedido. · EP-02 · RF-13, RF-14, RF-15 · 5 puntos

| Criterio | Estado | Evidencia y notas |
|---|---|---|
| Dado que recibí 10 unidades<br>Cuando registro el ingreso en una sola pantalla<br>Entonces las existencias suben en 10 y el movimiento queda con su fecha | Cumplido | Prueba «HU-07: ingresar 10 unidades sube el stock en 10 y deja el movimiento con su costo». Sin captura. |
| Dado que el producto ya tenía compras a otro costo<br>Cuando registro el nuevo ingreso<br>Entonces se conservan ambos costos con su fecha | Cumplido | Prueba «RF-14: el costo de la compra pasa a ser el del producto». Cada movimiento guarda su costo en `inventario.producto_administra`. Sin captura. |
| Dado que ingreso una cantidad cero o negativa<br>Cuando confirmo<br>Entonces el sistema rechaza el registro indicando el campo | Cumplido | Prueba «una cantidad cero o negativa responde con el campo». Sin captura. |

## HU-08 — Recibir alerta de existencias bajas · Terminada

Como administrador, quiero que el sistema me avise cuando un producto quede en dos unidades o menos, para reponer antes de quedarme sin inventario. · EP-02 · RF-16, RF-19, RF-20 · 5 puntos

| Criterio | Estado | Evidencia y notas |
|---|---|---|
| Dado un producto con 3 unidades<br>Cuando se vende una y quedan 2<br>Entonces aparece una alerta en el panel<br>Y un ingreso que supera el umbral la cierra | Cumplido | Captura `inventario/alertas/alertas-de-inventario.png`, `inventario/alertas/contador-de-alertas-en-el-menu.png`. Prueba «RN-04: un producto que queda en 2 unidades aparece en las alertas», «HU-08: un ingreso que sube el stock sobre el umbral quita la alerta». |
| Dado un ajuste por merma o corrección<br>Cuando confirmo<br>Entonces el sistema exige el motivo y guarda el movimiento en el historial no modificable | Cumplido | Prueba «RF-20: un ajuste resta unidades y deja el motivo y quién lo hizo», «RF-20: un ajuste sin motivo responde con el campo». Que no se pueda modificar lo prueba `database/pruebas/02_inventario.sql`. Sin captura. |

## HU-10 — Conservar el carrito con contrapedido · Terminada

Como cliente, quiero que mi carrito se conserve aunque cierre la página, para no volver a armarlo cada vez que entro. · EP-03 · RF-21, RF-22, RF-23, RF-24 · 8 puntos

| Criterio | Estado | Evidencia y notas |
|---|---|---|
| Dado que agregué productos al carrito<br>Cuando abandono la sesión y vuelvo días después<br>Entonces el carrito conserva su contenido con el total recalculado | Cumplido | Captura `carrito/agregar/carrito-despues-de-cerrar-el-navegador.png`. Prueba «HU-10: el carrito se conserva y agregar el mismo producto suma a su línea». |
| Dado un producto con 3 unidades y sin contrapedido<br>Cuando intento agregar 5<br>Entonces el sistema lo impide y me informa que el máximo es 3 | Cumplido | Captura `carrito/agregar/tope-de-existencias.png`, `carrito/pagina/tope-de-existencias.png`. Prueba «RN-13: sin contrapedido no deja pasar de las existencias y dice el máximo». |
| Dado un producto sin existencias que admite contrapedido<br>Cuando lo agrego<br>Entonces el sistema lo acepta y me indica visiblemente que es un contrapedido | Cumplido | Captura `carrito/agregar/aviso-de-contrapedido.png`, `carrito/pagina/linea-por-contrapedido.png`. Prueba «RF-23: con contrapedido acepta más de lo que hay y marca la línea». |
| Dado que cambió el precio de un producto<br>Cuando consulto el carrito<br>Entonces veo el precio actualizado | Cumplido<br>Ajustado | Captura `carrito/pagina/total-antes-de-cambiar-el-precio.png`, `carrito/pagina/total-despues-de-cambiar-el-precio.png`. Prueba «subir el margen cambia el total del carrito en la siguiente consulta y guarda el precio nuevo». Criterio agregado por el profesor (13/10). |
| Dado que otra persona compró la última unidad<br>Cuando consulto el carrito<br>Entonces la línea aparece como «fuera de stock» | Cumplido<br>Ajustado | Captura `carrito/pagina/linea-fuera-de-stock.png`. Prueba «una línea cuyo stock se agotó aparece fuera de stock». Criterio agregado por el profesor (13/10). |

## HU-11 — Registrarme como cliente · Terminada

Como cliente nuevo, quiero crear mi cuenta con mis datos y aceptar los términos, para poder comprar en la tienda. · EP-04 · RF-32, RF-33, RF-38 · 5 puntos

En el SRS el registro era al momento de la primera compra. El PDF del Sprint 2 pide registrarse como cliente nuevo, así que «Crear cuenta» está en `/acceso` y también desde el checkout.

| Criterio | Estado | Evidencia y notas |
|---|---|---|
| Dado que no tengo cuenta<br>Cuando ingreso nombre, correo, contraseña, cédula, teléfono y dirección y acepto los términos<br>Entonces el sistema crea mi cuenta de cliente, guarda la fecha de aceptación y me deja con sesión iniciada | Cumplido<br>Ajustado | Captura `acceso/registro/cuenta-creada.png`. Prueba «HU-11: crear la cuenta responde 201 con el usuario y deja la cookie de sesión», «RF-32: guarda el cliente con la contraseña en hash y deja la sesión abierta como cliente». |
| Dado que no acepto los términos<br>Cuando intento continuar<br>Entonces el sistema no me permite avanzar | Cumplido | Captura `acceso/registro/terminos-sin-aceptar.png`. Prueba «sin aceptar los términos responde 400 con el campo». |
| Dado que envío el formulario con campos vacíos<br>Entonces todos los obligatorios se marcan en rojo a la vez | Cumplido | Captura `acceso/registro/validacion-todos-los-campos.png`. Prueba «informa todos los campos con problemas a la vez». |
| Dado que ya soy cliente<br>Cuando vuelvo a comprar<br>Entonces el sistema recupera mis datos sin pedirlos de nuevo | Cumplido | Captura `checkout/compra/paso-1-entrega-con-direccion-precargada.png`, `mi-cuenta/datos-de-contacto/direccion-nueva-en-el-checkout.png`. |

## HU-12 — Confirmar el pedido, pagar y facturar · Parcial

Como cliente, quiero confirmar mi pedido y pagarlo en línea, para completar la compra sin tener que coordinar por mensajes. · EP-03 y EP-05 · RF-25, RF-30, RF-31, RF-39, RF-40, RF-41 · 13 puntos

Se adelantó del Sprint 3 porque el PDF del Sprint 2 pide completar la compra con pago emulado.

| Criterio | Estado | Evidencia y notas |
|---|---|---|
| Dado que tengo productos en el carrito y mis datos completos<br>Cuando confirmo y el pago simulado resulta aprobado<br>Entonces se crea el pedido en «colocado» con identificador único, se descuentan las unidades, se registran modalidad y dirección de entrega y se genera la factura placeholder | Cumplido | Captura `checkout/compra/paso-3-resumen.png`, `checkout/compra/pedido-confirmado.png`. Prueba «HU-12: confirmar crea el pedido colocado, descuenta el stock y suma la compra». |
| Dado que la pasarela simula un rechazo<br>Cuando se resuelve el pago<br>Entonces no se crea el pedido, se conserva el carrito y puedo reintentar | Cumplido | Captura `checkout/compra/pago-rechazado.png`, `checkout/compra/reintentar-pago.png`, `checkout/compra/pedido-confirmado-despues-del-rechazo.png`. Prueba «RF-39: un pago rechazado revierte todo y el carrito queda como estaba». |
| Dado que otro cliente compró la última unidad mientras tanto<br>Cuando confirmo<br>Entonces el sistema me avisa qué línea quedó fuera de stock y no crea el pedido | Cumplido<br>Ajustado | Captura `checkout/compra/sin-existencias-vuelve-al-carrito.png`. Prueba «RF-30: si otro cliente se llevó las unidades, responde con las líneas y no crea nada». Criterio agregado por el profesor (13/10). |
| Dado un pedido pagado<br>Cuando consulto su factura<br>Entonces contiene los datos fiscales de la sociedad y mi cédula | Parcial | Captura `checkout/compra/factura.png`. Prueba «RF-41: con el pago aprobado se emite la factura con el emisor y la cédula del cliente». Trae la razón social y la cédula del cliente, pero la cédula jurídica y la dirección del negocio dicen «POR DEFINIR» hasta que el cliente pase los datos. |
| Dado un pedido pagado<br>Cuando después cambia el precio del producto<br>Entonces el pedido conserva el precio pagado | Cumplido<br>Ajustado | Prueba «el precio queda congelado y el total suma el envío». Criterio agregado por el profesor (13/10). Sin captura. |

## HU-16 — Familias de productos con importación y margen heredados · Terminada

Como administrador, quiero administrar las familias de productos con su costo de importación y su margen, para que un cambio en la familia aplique a todos sus productos y solo tenga que ajustar los productos que son la excepción. · EP-01 · Nueva, sin RF en el SRS (PDF del Sprint 2 § a; profesor, 13/10) · 8 puntos

| Criterio | Estado | Evidencia y notas |
|---|---|---|
| Dada una familia con 25 % de margen<br>Cuando creo un producto sin margen propio<br>Entonces su precio se calcula con 25 % | Cumplido | Captura `productos/alta/producto-sin-margen-propio.png`, `productos/alta/producto-agregado-con-precio-heredado.png`. Prueba «un producto sin valores propios toma la importación y el margen de su familia». |
| Dada esa familia<br>Cuando le cambio el margen a 30 %<br>Entonces todos sus productos sin margen propio cambian de precio | Cumplido | Captura `familias/administracion/familia-modificada.png`, `productos/edicion/margen-heredado-de-la-familia.png`. Prueba «sin valores propios usa los de la familia y lo marca como heredado». |
| Dado un producto con margen propio de 50 %<br>Cuando cambia el margen de su familia<br>Entonces su precio no cambia | Cumplido | Prueba «un margen propio sobrescribe el de la familia y la importación se sigue heredando». Sin captura. |
| Dada una familia<br>Cuando la desactivo<br>Entonces sus productos dejan de verse en la tienda | Cumplido | Captura `familias/administracion/confirmar-desactivacion.png`, `familias/administracion/familia-desactivada.png`. Prueba «una familia inactiva saca sus productos de la tienda y los marca ocultos en el panel». |
| Dada una familia con productos<br>Cuando intento eliminarla<br>Entonces el sistema lo rechaza | Cumplido | Captura `familias/administracion/rechazo-por-productos-asociados.png`. Prueba «no elimina una familia con productos y dice cuántos tiene». |
| Dado el panel<br>Cuando administro las familias<br>Entonces puedo consultarlas, ingresarlas, modificarlas, desactivarlas y eliminarlas | Cumplido | Captura `familias/administracion/consultar-familias.png`, `familias/administracion/familia-agregada.png`, `familias/administracion/familia-modificada.png`, `familias/administracion/familia-desactivada.png`, `familias/administracion/familia-eliminada.png`. |

## HU-17 — Administración de pedidos · Terminada

Como administrador, quiero ver los pedidos con su cliente, productos y estado, cambiarles el estado, corregirlos mientras no se hayan enviado, cancelarlos y registrar los que me llegan por otros canales, para controlar todas las ventas desde un solo lugar. · EP-03 · RF-26, RF-28 y los de HU-09 (RF-15, RF-17, RF-19) · 13 puntos

Historia nueva. Absorbe HU-09 (ventas de otros canales), PB-23 (buscar pedidos) y la parte del administrador de HU-14.

| Criterio | Estado | Evidencia y notas |
|---|---|---|
| Dado el panel<br>Cuando abro «Pedidos»<br>Entonces veo cada pedido con cliente, productos, canal y estado, y puedo filtrar por estado | Cumplido | Prueba «el listado acepta el estado en disputa y rechaza estados, canales y fechas que no existen», «el detalle junta cliente, líneas con el precio pagado, pagos, factura e historial». Sin captura de la lista. |
| Dado un pedido<br>Cuando lo paso a procesado, en tránsito o entregado<br>Entonces el cambio queda en el historial con su fecha y el cliente lo ve | Cumplido | Captura `pedidos/mis-pedidos/estado-antes-del-cambio.png`, `pedidos/mis-pedidos/administrador-cambia-el-estado.png`, `pedidos/mis-pedidos/estado-despues-del-cambio.png`. Prueba «el administrador avanza el pedido y queda en el historial con quién lo hizo». |
| Dado un pedido con un problema<br>Cuando lo pongo «en disputa»<br>Entonces se mantiene así hasta que lo resuelvo y queda en el historial que pasó por ese estado | Cumplido | Captura `pedidos/mis-pedidos/pedido-en-disputa.png`. Prueba «una disputa vuelve al estado en que estaba el pedido». |
| Dado un pedido no enviado<br>Cuando cambio la cantidad, quito, agrego o reemplazo un producto<br>Entonces el inventario se ajusta y el cambio queda en la bitácora<br>Y el reemplazo solo se acepta por un producto de igual o menor valor, sin cobrar diferencia | Cumplido<br>Ajustado | Prueba «el reemplazo por uno de igual o menor precio conserva el precio pagado», «el reemplazo por uno más caro se rechaza, aunque sea por un centavo», «cada cambio queda en la bitácora con la línea anterior y la nueva». Regla de reemplazo decidida por el cliente (entrevista 2, punto 4). Probado en el panel el 9/11: cambiar la cantidad, reemplazar, agregar y quitar. Sin captura. |
| Dado un pedido en tránsito o entregado<br>Cuando intento editarlo<br>Entonces el sistema lo rechaza | Cumplido | Prueba «un pedido en tránsito o finalizado ya no se edita y nada cambia». En el panel los controles quedan bloqueados con el motivo (probado el 9/11). Sin captura. |
| Dado un pedido<br>Cuando lo cancelo<br>Entonces las unidades vuelven al inventario<br>Y solo el administrador puede cancelar, el cliente no | Cumplido<br>Ajustado | Captura `pedidos/mis-pedidos/pedido-cancelado.png`. Prueba «RF-28: cancelar devuelve lo que salió del inventario y no lo que quedó en contrapedido», «solo el administrador cambia el estado: el cliente no puede cancelar su pedido». Decisión del cliente (entrevista 2, punto 2): en el SRS el cliente podía cancelar. |
| Dada una venta por WhatsApp, Facebook, teléfono o presencial<br>Cuando la registro con sus productos<br>Entonces se crea un pedido con su canal y quién lo creó, y descuenta el inventario | Cumplido | Captura `ventas/registro/venta-en-curso.png`, `ventas/registro/venta-registrada-con-alerta.png`, `ventas/registro/venta-presencial-en-pedidos.png`. Prueba «HU-09: una venta por WhatsApp de dos productos es un solo pedido que descuenta el inventario». |

## PB-31 — Créditos a favor del cliente · Terminada

Como cliente, quiero que cuando la tienda quite un producto de un pedido que ya pagué me quede un crédito a favor, para usarlo en mi siguiente compra. · EP-05 · Nueva, sin RF en el SRS (profesor, 13/10) · 5 puntos

Usar el crédito en el pago estaba planeado para el Sprint 3, pero entró en este sprint (SCRUM-146), incluido el pago parcial.

| Criterio | Estado | Evidencia y notas |
|---|---|---|
| Dado un pedido pagado<br>Cuando el administrador quita o reduce una línea<br>Entonces se registra un crédito por el monto pagado de esa línea y no se devuelve dinero | Cumplido | Captura `pedidos/mis-pedidos/pedido-cancelado.png`. Prueba «en un pedido pagado, lo que se quita queda como crédito con impuesto», «cancelar un pedido pagado deja a favor lo cobrado que no se había acreditado». Probado en el panel el 9/11: bajar la cantidad de una línea dejó el crédito. |
| Dado que tengo crédito<br>Cuando entro a «Mi cuenta»<br>Entonces veo mi saldo y de qué pedido salió | Cumplido | Captura `mi-cuenta/saldo-a-favor/saldo-y-movimientos.png`, `mi-cuenta/saldo-a-favor/sin-saldo-a-favor.png`, `mi-cuenta/saldo-a-favor/saldo-en-celular.png`. Prueba «el cliente ve su saldo a favor con lo que le otorgaron y lo que usó». |
| Dado que tengo crédito<br>Cuando quiero retirarlo<br>Entonces no se puede retirar en efectivo | Cumplido | Prueba «con crédito suficiente el pedido se paga sin pasarela y sin medio de pago», «con crédito parcial se cobra solo la diferencia con el otro medio». No hay ninguna ruta ni pantalla para retirarlo, solo se usa al pagar. |

## Historias nuevas en el Product Backlog

Las tres historias que no venían del Sprint 0, con su estimación. La actualización completa del backlog va en su propia tarea (SCRUM-151).

| ID | Historia | Prioridad | Puntos | Sprint | Origen |
|---|---|---|---|---|---|
| HU-16 | Familias de productos con importación y margen heredados | Alta (M) | 8 | S2 | PDF del Sprint 2 § a) y profesor (13/10) |
| HU-17 | Administración de pedidos | Alta (M) | 13 | S2 | PDF del Sprint 2 § a), entrevista 2 y profesor (13/10). Absorbe HU-09, PB-23 y la parte del administrador de HU-14 |
| PB-31 | Créditos a favor del cliente | Media (S) | 5 | S2 | Profesor (13/10). El uso en el pago se adelantó del S3 al S2 |

## Criterios ajustados por decisiones

| Historia | Ajuste | Decisión |
|---|---|---|
| HU-17 (antes HU-14) | Solo el administrador cancela un pedido; el cliente ya no puede | Cliente, entrevista 2, punto 2 |
| HU-17 | El reemplazo de un producto solo se acepta por uno de igual o menor valor, sin cobrar diferencia | Cliente, entrevista 2, punto 4 |
| HU-11 | «Crear cuenta» está disponible antes de comprar, no solo en la primera compra | PDF del Sprint 2 § b) |
| HU-10 | El carrito muestra el precio vigente y marca las líneas «fuera de stock» | Profesor, 13/10, § 4 y § 5 |
| HU-12 | Las existencias se validan al confirmar y el pedido conserva el precio pagado | Profesor, 13/10, § 4 y § 5 |

## Lo que falta para cerrar las historias parciales

| Historia | Falta | Tarea |
|---|---|---|
| HU-02 | Enviar el correo de recuperación de verdad, hoy el enlace va al log del servidor | Sin tarea propia, ver `revisar.md` |
| HU-12 | Cargar la cédula jurídica y la dirección del negocio en `facturacion.emisor` | Depende de los datos del cliente |

Si alguna de estas entra antes de la entrega, hay que actualizar el estado del criterio y su evidencia.

Los criterios marcados «Sin captura» tienen prueba automatizada, pero les falta la captura de pantalla. Eso se completa con las pruebas funcionales del sprint (SCRUM-149).
