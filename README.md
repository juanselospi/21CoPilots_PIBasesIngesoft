# Hobbies Cultura Geek Online

Plataforma de comercio electrónico para una tienda de cultura geek, con **módulo de inventario
único y compartido entre todos los canales de venta** como núcleo del sistema.

**Equipo** Twenty One CoPilots
**Curso** CI0128 Proyecto Integrador Inge-Bases
**Cliente / Stakeholder** Daniel Cabezas
**Marco de trabajo** Scrum (sprints de 2 semanas)
**Documento base** `Documentos/sprint_0.pdf`

### Integrantes

| Integrante             | Carné  | Rol Scrum        |
| Joaquín Rodríguez      | C4J075 | Product Owner    |
| Juan Loaiza            | B74200 | Scrum Master     |
| Agustín Soto           | C4K199 | Developer        |
| Jeferson Marín         | C24549 | Developer        |

---

## Stack tecnológico

> **Estado:** decisión del equipo.

| Capa               | Tecnología                 | Responsabilidades |
| **Frontend**       | React + JavaScript         | Catálogo, ficha de producto, carrito, login/registro, panel de usuario, checkout, panel administrativo |
| **Backend**        | Node.js + Express          | API REST, autenticación, lógica de negocio (motor de precios, inventario, niveles de fidelidad), gestión de usuarios, productos, carrito y órdenes |
| **Base de datos**  | PostgreSQL                 | Usuarios, clientes, administrador, productos, categorías, inventario, carrito, pedidos, detalles de pedido, pagos, historial de estados y bitácora de auditoría |
