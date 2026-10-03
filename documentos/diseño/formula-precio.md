# Fórmula del precio de venta

**Tarea:** SCRUM-22 · **Relacionado con:** HU-04, SCRUM-43, INC-05
**Estado:** validada contra el Excel del cliente.

## 1. Cómo se calcula

El precio de venta de un producto se obtiene en tres pasos, siempre en este orden:

| Paso | Qué se hace | Resultado |
|---|---|---|
| 1 | Al costo del producto se le suma el porcentaje de importación | Costo total |
| 2 | Al costo total se le suma el margen de ganancia | Precio sin impuesto |
| 3 | Al precio sin impuesto se le suma el 13 % de impuesto de venta | Precio final |

**Ejemplo:** un producto que cuesta $100, con 20 % de importación y 25 % de margen.

| Paso | Cálculo | Resultado |
|---|---|---|
| Costo total | 100 + 20 % | $120,00 |
| Precio sin impuesto | 120 + 25 % | $150,00 |
| Precio final | 150 + 13 % | **$169,50** |

El impuesto cobrado es la diferencia entre los dos últimos: $19,50.

## 2. Datos que usa la fórmula

| Dato | Quién lo define | Regla |
|---|---|---|
| Costo del producto | Administrador, por producto | No puede ser negativo |
| Porcentaje de importación | Administrador, por producto | No puede ser negativo |
| Margen de ganancia | Administrador, por producto | Puede ser negativo, pero mayor que −100 % |
| Impuesto de venta | Fijo | 13 % para todo el catálogo |

En el Excel del cliente los porcentajes aparecen como decimales (0,20 es 20 %). En el
sistema se ingresan y se muestran como porcentaje; el resultado es el mismo.

## 3. Margen de ganancia

El margen se calcula **sobre el costo total**, no sobre el precio de venta. Un margen
de 25 % sobre un costo de $120 da $150. Así lo hace el Excel del cliente.

**Margen negativo.** Se permite para productos en liquidación o defectuosos, que se
venden por debajo de su costo. Con el mismo producto del ejemplo y un margen de −10 %:

| Paso | Cálculo | Resultado |
|---|---|---|
| Costo total | 100 + 20 % | $120,00 |
| Precio sin impuesto | 120 − 10 % | $108,00 |
| Precio final | 108 + 13 % | **$122,04** |

El margen no puede llegar a −100 %, porque el producto quedaría gratis o con precio
negativo.

## 4. Redondeo

Los montos se muestran con **2 decimales**, pero el sistema calcula con el valor
exacto y redondea solo lo que se muestra. Es lo mismo que hace el Excel del cliente.

Ejemplo real del Excel: costo $49,99, importación 20 %, margen 20 %.

| Paso | Valor exacto | Se muestra |
|---|---|---|
| Costo total | 59,988 | $59,99 |
| Precio sin impuesto | 71,9856 | $71,99 |
| Precio final | 81,343728 | **$81,34** |

Si se redondeara en cada paso, el precio final daría $81,35 y no coincidiría con el
Excel.

## 5. Lo que la fórmula no incluye

- **Descuentos:** el descuento por nivel de cliente frecuente se aplica después, sobre
  el pedido, al confirmar la compra.
- **Cambios en pedidos ya hechos:** al confirmar un pedido se guarda el precio de ese
  momento. Si después cambia el costo, el margen o la importación, los pedidos
  anteriores no se modifican.
