# Base de datos — DC Hobbies Cultura Geek Online

> **Esta base de datos sigue al pie de la letra el EER y el mapeo del equipo**
> (`EER 21 CoPilots.drawio`), más la entidad débil **Sesión** para el login: llaves
> naturales (correo, SKU, número de referencia, número de factura), especialización
> Usuario → Administrador / Cliente, Carrito, Pedido e Historial como entidades débiles,
> y Stock, Costo Total y Tasa de impuesto guardados en Producto. En `apps/server` ya
> está adaptado el inicio de sesión; los demás módulos todavía usan el modelo anterior
> (ver `documentos/diseño/modelo-datos.md` § 4).

Guía para levantar, cambiar y probar la base de datos (PostgreSQL 17). Léala completa
una vez; después use la [chuleta de comandos](#9-chuleta-de-comandos).

¿Solo quiere levantarla en su computadora? Siga la [guía rápida](guia.md).

- Criterios de diseño: [`documentos/diseño/arquitectura.md`](../documentos/diseño/arquitectura.md) § 9
- Diccionario de datos y cambios al modelo: [`documentos/diseño/modelo-datos.md`](../documentos/diseño/modelo-datos.md)

Las herramientas vienen del prototipo `kit-bd-21copilots_4`; el esquema es nuevo
(DD-17).

---

## 0. Decisiones del equipo (resumen)

| Tema | Decisión | Por qué |
|---|---|---|
| ¿Docker? | **Sí, pero solo para PostgreSQL.** Backend y frontend corren con `npm` normal. | Todos tienen la misma versión de PostgreSQL (17) sin instalarla, en Linux o Windows. Backend y frontend fuera de Docker = recarga en caliente y depuración más simples. |
| ¿Cómo se comparte la BD? | **No se comparte una BD; se comparten los scripts.** Cada quien tiene su BD local, reconstruible con un comando. | Nadie rompe el trabajo del otro, se puede trabajar sin internet y Git guarda la historia de cada cambio al modelo. |
| ¿Cómo cambia el esquema? | **Migraciones SQL numeradas** en `database/migraciones/`. Nunca se edita una que ya está en `main`. | Cada cambio queda documentado, revisado en PR y aplicable en todas las máquinas con `npm run db:migrate`. |
| Organización | **Un esquema de PostgreSQL por módulo** (`catalogo`, `inventario`, `pedidos`…). | Refleja los módulos de `apps/server/` (DD-11). |
| Datos de prueba | **Semillas** en `database/semillas/`: `referencia/` (necesarias para arrancar) y `demo/` (de prueba). | Todos ven los mismos productos y usuarios; sirven para las capturas de evidencia. |
| Pruebas | **Pruebas SQL** en `database/pruebas/` (`npm run db:test`). | Cada restricción se comprueba; si alguien la rompe, se entera antes del PR. |
| DDL para entregar | `database/schema.sql` **generado** con `npm run db:dump`. | Siempre coincide con lo que realmente hay; no hay dos fuentes de verdad. |

---

## 1. Requisitos (una sola vez)

| Herramienta | Versión | Linux (Zorin/Ubuntu/Fedora) | Windows |
|---|---|---|---|
| Git | cualquiera reciente | gestor de paquetes | [git-scm.com](https://git-scm.com) |
| Node.js | **22 LTS** (ver `.nvmrc`) | con [nvm](https://github.com/nvm-sh/nvm): `nvm install 22` | instalador LTS de nodejs.org (o nvm-windows) |
| Docker | Engine + Compose v2 | ver abajo | **Docker Desktop** con backend WSL 2 |
| Cliente SQL (opcional) | — | DBeaver, o la extensión *PostgreSQL* de VS Code | igual |

**Docker en Zorin OS / Ubuntu** (Zorin se basa en Ubuntu, por eso se usa `UBUNTU_CODENAME`):

```bash
sudo apt update && sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $UBUNTU_CODENAME) stable" \
 | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER     # para no usar sudo; cierre sesión y vuelva a entrar
docker run --rm hello-world       # prueba
```

**Docker en Fedora** (desde los repositorios oficiales de Fedora, sin repositorios externos):

```bash
sudo dnf install -y moby-engine docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER     # cierre sesión en Fedora y vuelva a entrar
```

Use esos nombres exactos: `sudo dnf install docker` a secas puede instalar otro
paquete. `moby-engine` es el motor de Docker compilado por Fedora; se actualiza con
`sudo dnf upgrade`.

---

## 2. Primer día: de cero a la BD funcionando

Todo lo de la base de datos vive en `database/`, y los comandos `npm run db:*` se
corren **dentro de esa carpeta**.

```bash
git clone https://github.com/juanselospi/21CoPilots_PIBasesIngesoft.git
cd 21CoPilots_PIBasesIngesoft/database

cp .env.example .env       # en Windows PowerShell: copy .env.example .env
npm install                # instala las herramientas de BD (pg, dotenv)
npm run db:up              # descarga y levanta PostgreSQL 17 en Docker (puerto 5433)
npm run db:reset           # crea todos los esquemas y tablas y carga las semillas
npm run db:test            # debe terminar con "✔ N prueba(s) aprobada(s)"
```

Desde la raíz del repositorio también funciona con `--prefix`, por ejemplo
`npm --prefix database run db:reset`.

Compruebe que ve datos:

```bash
npm run db:psql
dchobbies=# SELECT sku, stock FROM reportes.v_existencias ORDER BY sku;
dchobbies=# \dn          -- lista los esquemas: admin, catalogo, inventario, ...
dchobbies=# \q
```

**Usuarios de prueba:** `admin@dchobbies.test` / `Admin123!` · `cliente@correo.test` /
`Cliente123!` · `presencial@correo.test` / `Presencial123!` (hash bcrypt, compatible con `bcrypt`/`bcryptjs` en Node).

**Casos de prueba preparados en las semillas:**

| SKU | Caso | Requerimiento |
|---|---|---|
| `MTG-002` | Sin stock, admite contrapedido: debe verse | RF-07, RN-03 |
| `FUN-003` | Sin stock ni contrapedido: no debe verse | RF-08, RN-03 |
| `LIQ-001` | Margen negativo (liquidación) | RN-02, RF-43 |
| `FUN-001`, `ANI-001` | En 2 unidades: disparan la alerta | RF-16, RN-04 |
| `PKM-001` | Dos ingresos a costos distintos | RN-06, RF-14 |

Hay además un pedido en línea finalizado, pagado y facturado, y una venta presencial,
para ver los reportes con datos.

**Conectarse con DBeaver / VS Code:** host `localhost`, puerto `5433`, BD `dchobbies`,
usuario `dchobbies`, clave `dchobbies_dev`. O levante Adminer con
`docker compose --profile tools up -d` y abra <http://localhost:8080> (servidor: `db`).

> **¿Por qué el puerto 5433?** Varios tenemos PostgreSQL instalado para el curso de
> Bases, y ese usa el 5432. Con 5433 no chocan. Si igual está ocupado, cambie
> `DB_PORT` en su `.env`.

> **¿Tenía levantado el prototipo?** Usa el mismo puerto. Bájelo antes con
> `docker compose down` dentro de `kit-bd-21copilots_4/`.

---

## 3. Estructura

```
database/
├── package.json                   comandos npm run db:* y dependencias (pg, dotenv)
├── docker-compose.yml             PostgreSQL 17 (y Adminer opcional)
├── .env.example                   plantilla de variables (el .env real NO se sube)
├── .nvmrc                         versión de Node (22)
├── migraciones/                   001 … 008: un archivo por módulo, en orden de dependencias
├── semillas/
│   └── demo/                      usuarios, productos, mercancía, ofertas y pedidos de prueba
├── pruebas/                       pruebas SQL de las restricciones
├── scripts/                       migrate, seed, reset, probar, dump, new-migration
└── schema.sql                     DDL completo GENERADO (entregable)
```

| Migración | Esquema | Tablas del mapeo |
|---|---|---|
| `001_esquemas_y_utilidades.sql` | todos | Crea los esquemas y dos funciones técnicas: `fijar_fecha_actualizacion()` y `rechazar_modificacion()` |
| `002_admin.sql` | `admin` | `USUARIO`, `ADMINISTRADOR` |
| `003_clientes.sql` | `clientes` | `CLIENTE`, `CLIENTE_TELEFONO` y la especialización disjunta |
| `004_catalogo.sql` | `catalogo` | `PRODUCTO` |
| `005_inventario.sql` | `inventario` | `PRODUCTO_ADMINISTRA` |
| `006_pedidos.sql` | `pedidos` | `CARRITO`, `AGREGA`, `OFERTA`, `PEDIDO`, `HISTORIAL_ESTADO` |
| `007_pagos_facturacion.sql` | `pagos`, `facturacion` | `PAGO`, `FACTURA` |
| `008_reportes.sql` | `reportes` | vistas de solo lectura y atributos derivados (estado del pedido, montos) |
| `009_sesion.sql` | `admin` | `SESION`, entidad débil de `USUARIO` para el inicio de sesión (agregada al EER) |

---

## 4. Flujo de trabajo con Git

```
Jira: tome la tarea (SCRUM-12) y muévala a "En curso"
  │
  ├─ git checkout main && git pull
  ├─ npm --prefix database run db:migrate   ← aplica lo que otros agregaron
  ├─ git checkout -b feature/SCRUM-12-crear-producto
  │
  ├─ ...programar, commits pequeños:  git commit -m "SCRUM-12: valida SKU duplicado"
  │
  ├─ git pull --rebase origin main      ← antes de abrir el PR
  ├─ git push -u origin feature/SCRUM-12-crear-producto
  └─ Abrir Pull Request → 1 compañero revisa → "Squash and merge" → Jira a "Hecho"
```

1. **Nadie hace push directo a `main`.** En GitHub → *Settings → Branches → Add rule*:
   *Require a pull request before merging* + *Require approvals: 1*.
2. **Nombres de rama:** `feature/SCRUM-<n>-descripcion`, `fix/SCRUM-<n>-…`, `docs/…`.
3. **Commits con la llave de Jira** (`SCRUM-12: …`).
4. **Un PR = una historia o tarea.**
5. **Quien revisa un PR que toca `database/`** corre `npm run db:reset` y
   `npm run db:test` en la rama antes de aprobar.
6. **Al cerrar el sprint:** `git tag v1.0-sprint1 && git push --tags`.

---

## 5. La base de datos, paso a paso

### 5.1 Principio

> **Git es la fuente de verdad del esquema. Su BD local es desechable.**

Nunca cambie la estructura de la BD "a mano" (desde DBeaver, pgAdmin, psql). Si no
está en una migración, para el resto del equipo no existe.

### 5.2 Cómo hacer un cambio al modelo (ejemplo)

Supongamos que se definen las tarifas de envío (DEP-07):

```bash
git checkout -b feature/SCRUM-40-tarifas-envio
npm run db:new -- tarifas de envio
# ✔ Creado database/migraciones/010_tarifas_de_envio.sql
```

Escriba el SQL, **siempre con el nombre del esquema**:

```sql
CREATE TABLE pedidos.tarifa_envio (
    modalidad_entrega  VARCHAR(20)    PRIMARY KEY,
    monto              NUMERIC(12,2)  NOT NULL CHECK (monto >= 0)
);
```

Aplíquelo y pruebe:

```bash
npm run db:migrate
npm run db:test
```

¿Se equivocó y quiere corregir **su** migración (que todavía no está en `main`)?
Edítela y corra `npm run db:reset`.

Antes del PR:

1. Agregue una fila en `documentos/diseño/modelo-datos.md` § 4 explicando **qué**
   cambió y **por qué**, y refleje el cambio en el diagrama EER y en el mapeo.
2. Si agregó una restricción, agregue su prueba en `database/pruebas/`.
3. Si cambió una tabla que usan las semillas, actualícelas.
4. Corra `npm run db:dump` para regenerar `database/schema.sql` y súbalo en el mismo PR.

### 5.3 Reglas de oro

| ✅ Hacer | ❌ No hacer |
|---|---|
| Una migración nueva por cada cambio | Editar una migración que ya está en `main` (el script lo detecta y se detiene) |
| Nombres calificados: `catalogo.producto` | Crear tablas en `public` |
| Pensar en los datos existentes al cambiar una tabla | `DROP TABLE` sin migrar los datos |
| `npm run db:migrate` después de cada `git pull` | Cambios manuales en la BD |
| Reglas de negocio en `apps/server` (DD-10) | Triggers o procedimientos con reglas de negocio |
| Corregir un movimiento con otro movimiento | Intentar editar o borrar registros históricos (la BD lo rechaza) |

### 5.4 Choque de números (dos personas crean la `010` a la vez)

Es normal. El script lo detecta:

```
✖ Dos migraciones con el número 010: "010_a.sql" y "010_b.sql".
```

Quien **todavía no hizo merge** renombra la suya a `010_…`, corre `npm run db:reset` y sigue.

### 5.5 ¿Cuándo usar cada comando?

| Situación | Comando |
|---|---|
| Hice `git pull` y alguien agregó migraciones | `npm run db:migrate` |
| Cambié de rama y la BD quedó rara | `npm run db:reset` |
| Estoy iterando sobre mi propia migración | editar + `npm run db:reset` |
| Quiero ver qué está aplicado | `npm run db:status` |
| Agregué datos de prueba nuevos | `npm run db:seed` (o `db:reset`) |
| Quiero comprobar que las restricciones funcionan | `npm run db:test` |
| Necesito una BD sin datos de prueba | `npm run db:reset -- --solo-referencia` |
| Quiero la BD con el catálogo real del cliente | `npm run db:cliente` (ver § 6) |
| Voy a entregar / cambió el esquema | `npm run db:dump` |

`db:reset` **solo** corre contra `localhost`; si su `.env` apunta a otro servidor, se
niega (a propósito, porque borra todo).

### 5.6 Pruebas SQL

Cada archivo de `database/pruebas/` corre en su propia transacción, precedido por
`_ayudantes.sql`, y al final se **revierte**: las pruebas nunca dejan datos y funcionan
con o sin semillas. Para agregar una prueba:

```sql
SELECT pg_temp.producto_prueba('PRB-X', 3);   -- producto de prueba con 3 de stock

SELECT pg_temp.debe_fallar('Un registro con cantidad cero se rechaza',
    $$INSERT INTO inventario.producto_administra (sku, correo_administrador, cantidad)
      VALUES ('PRB-X', pg_temp.admin_prueba(), 0)$$, '23514');

SELECT pg_temp.debe_funcionar('El margen negativo se acepta (RN-02)',
    $$UPDATE catalogo.producto SET margen_ganancia = -10 WHERE sku = 'PRB-X'$$);
```

Códigos de error más usados: `23505` unicidad, `23514` `CHECK`, `23503` llave
foránea, `23001` registro de solo inserción.

---

## 6. "¿Y cómo compartimos los datos?"

| Necesidad | Solución |
|---|---|
| Todos necesitan los mismos productos de prueba | Agréguelos a `database/semillas/demo/` vía PR. |
| Probar con los datos **reales** del cliente (Excel de ~200 SKU) | **No se suben al repositorio** (tiene costos y márgenes). Compártalo por Drive/Teams y póngalo en `database/datos-cliente/`, que está en `.gitignore`. Con el servidor corriendo, `npm run db:cliente` reconstruye la BD, oculta los productos de prueba (quedan en 0 y sin contrapedido, RN-03), importa el Excel por el servidor (RF-57) y le da 1 unidad de existencia a cada producto importado. |
| Demo del sprint | En la laptop de quien presenta: `npm run db:reset`, para partir de un estado conocido. |
| Ambiente compartido de staging (opcional, sprints futuros) | Un PostgreSQL alojado al que **solo** se le aplican cambios con `npm run db:migrate` y `npm run db:seed -- --solo-referencia`, usando otro `.env`. Nunca se desarrolla contra él. |

---

## 7. Conexión desde `apps/server`

El servidor tiene su propio `apps/server/.env` con los mismos valores `DB_*` que
`database/.env`. Lo lee **solo** `configuracion.js`, y el pool se crea una vez en
`composicion.js` y se inyecta en los repositorios (arquitectura § 4.5, sin Singleton):

```js
// apps/server/configuracion.js — único lector de variables de entorno
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
};
```

```js
// apps/server/modules/catalogo/catalogo.repository.js
class CatalogoRepository {
  constructor(pool) {
    this.pool = pool; // inyectado desde composicion.js
  }

  // Entradas del precio; el precio lo calcula el motor de precios (DD-13)
  async listarActivos() {
    const { rows } = await this.pool.query(
      `SELECT sku, nombre, categoria, item, importacion, costo_total,
              margen_ganancia, tasa_impuesto, contrapedido, stock
       FROM   catalogo.producto
       ORDER  BY nombre`
    );
    return rows;
  }
}

module.exports = { CatalogoRepository };
```

Reglas para el código de acceso a datos:

- **Siempre use parámetros** (`$1`, `$2`); nunca arme SQL concatenando texto.
- **Traduzca los errores de PostgreSQL a mensajes de negocio**, usando el nombre de la
  restricción (`err.constraint`): `23505` en `producto_pkey` → "El código ya existe"
  (RF-01); `23514` en `ck_producto_stock` → "No hay suficiente stock";
  `23001` → "Este registro es histórico y no se puede modificar".
- **Valide también en el servidor.** Las restricciones de la BD son la última línea de
  defensa, no los mensajes al usuario.
- **Toda escritura que toque varias tablas va en una transacción** (`enTransaccion`),
  y el stock se bloquea en orden de `sku` (arquitectura § 7.3).

---

## 8. Entregables del curso que salen de aquí

| Entregable | De dónde sale |
|---|---|
| Script de BD (DDL) | `npm run db:dump` → `database/schema.sql` |
| Datos de prueba | `database/semillas/` |
| Cambios respecto al Sprint 0 y su justificación | `documentos/diseño/modelo-datos.md` § 4 |
| Diagrama ER actualizado | `EER 21 CoPilots.drawio` (EER + mapeo). Para verificarlo contra la BD real: DBeaver → clic derecho en la base → *View Diagram* |
| Evidencia de pruebas | Salida de `npm run db:test` y capturas con los productos de las semillas |

---

## 9. Chuleta de comandos

```bash
npm run db:up        # levantar PostgreSQL
npm run db:down      # apagarlo (los datos se conservan)
npm run db:migrate   # aplicar migraciones pendientes
npm run db:status    # ver qué migraciones están aplicadas
npm run db:reset     # borrar todo y reconstruir (migraciones + semillas)
npm run db:seed      # recargar solo las semillas
npm run db:cliente   # BD con el catálogo real del cliente (servidor corriendo)
npm run db:test      # correr las pruebas SQL
npm run db:new -- descripcion   # crear la siguiente migración
npm run db:dump      # regenerar database/schema.sql
npm run db:psql      # consola SQL dentro del contenedor
```

---

## 10. Problemas comunes

| Síntoma | Solución |
|---|---|
| `permission denied ... docker.sock` (Linux) | `sudo usermod -aG docker $USER`, luego cierre sesión y vuelva a entrar. |
| `port is already allocated` / `address already in use` | Otro PostgreSQL (¿el del prototipo?) usa el puerto. Bájelo, o cambie `DB_PORT` en `.env` y vuelva a correr `npm run db:up`. |
| `No se pudo conectar a PostgreSQL` | ¿Corrió `npm run db:up`? ¿Existe `.env`? En Windows: ¿Docker Desktop está abierto? |
| `password authentication failed` después de cambiar la clave en `.env` | El volumen guarda la clave original. Corra `docker compose down -v` (borra la BD local), luego `db:up` y `db:reset`. |
| `✖ Estas migraciones ... su contenido cambió` | Alguien editó una migración aplicada. Si es suya y no está en `main`: `db:reset`. Si está en `main`: revierta la edición y cree una migración nueva. |
| `relation "producto" does not exist` | Falta el esquema: use `catalogo.producto`. |
| `La tabla ... es de solo inserción` | Es intencional (RF-19). Registre un nuevo registro compensatorio (p. ej. mercancía con cantidad negativa) en lugar de editar. |
| Todo raro después de cambiar de rama | `npm run db:reset` |
