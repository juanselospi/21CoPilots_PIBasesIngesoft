# Guía rápida: levantar la base de datos local

Pasos para tener la base de datos de DC Hobbies funcionando en su computadora.
Antes de empezar, revise que tenga instalado lo de la sección
[Qué necesita tener instalado](#qué-necesita-tener-instalado).

---

## Pasos

Abra una terminal **dentro de la carpeta `database/`** y ejecute, en orden:

**1. Cree su archivo de configuración**

```bash
cp .env.example .env
```

En Windows (PowerShell): `copy .env.example .env`

**2. Instale las herramientas**

```bash
npm install
```

**3. Levante PostgreSQL**

```bash
npm run db:up
```

La primera vez tarda un poco porque descarga la imagen de PostgreSQL 17.

**4. Cree las tablas y cargue los datos de prueba**

```bash
npm run db:reset
```

Debe terminar con `✔ BD reconstruida desde cero.`

**5. Compruebe que todo funciona**

```bash
npm run db:test
```

Debe terminar con `✔ 53 prueba(s) aprobada(s).`

Listo: la base de datos está corriendo.

---

## Cómo conectarse

Con DBeaver, pgAdmin o la extensión *PostgreSQL* de VS Code:

| Dato | Valor |
|---|---|
| Host | `localhost` |
| Puerto | `5433` |
| Base de datos | `dchobbies` |
| Usuario | `dchobbies` |
| Contraseña | `dchobbies_dev` |

O desde la terminal, dentro de `database/`:

```bash
npm run db:psql
```

Pruebe con `SELECT sku, existencias FROM reportes.v_existencias;` y salga con `\q`.

**Usuarios de prueba de la aplicación:** `admin@dchobbies.test` / `Admin123!` y
`cliente@correo.test` / `Cliente123!`.

---

## Para el día a día

| Quiero… | Comando |
|---|---|
| Apagar la base de datos (los datos se conservan) | `npm run db:down` |
| Volver a encenderla | `npm run db:up` |
| Borrar todo y empezar de cero | `npm run db:reset` |
| Aplicar cambios que bajé con `git pull` | `npm run db:migrate` |

---

## Si algo falla

| Mensaje | Qué hacer |
|---|---|
| `port is already allocated` o `address already in use` | Otro programa usa el puerto 5433. Cierre ese programa, o cambie `DB_PORT` en su `.env` (por ejemplo a `5434`) y repita el paso 3. |
| `No se pudo conectar a PostgreSQL` | Haga el paso 3. En Windows y Mac, revise que Docker Desktop esté abierto. |
| `permission denied ... docker.sock` (Linux) | Ejecute `sudo usermod -aG docker $USER`, cierre sesión y vuelva a entrar. |
| `password authentication failed` | Ejecute `docker compose down -v` (borra la base local) y repita desde el paso 3. |
| `npm: command not found` o `docker: command not found` | Falta instalar algo: vea la sección siguiente. |

Para más detalle (cómo cambiar el modelo, crear migraciones, reglas del equipo), lea
[`README.md`](README.md).

---

## Qué necesita tener instalado

| Programa | Versión | Para qué | Cómo comprobar que está |
|---|---|---|---|
| **Docker** con **Docker Compose v2** | reciente | Corre PostgreSQL dentro de un contenedor, sin instalarlo en su computadora | `docker compose version` |
| **Node.js** (incluye npm) | 22 o superior | Ejecuta los comandos `npm run db:*` que crean las tablas y cargan los datos | `node --version` |

No hace falta instalar PostgreSQL: Docker lo descarga solo.

### Windows

1. **Docker Desktop:** descárguelo de [docker.com](https://www.docker.com/products/docker-desktop/)
   e instálelo con la opción **WSL 2** activada. Ábralo y espere a que diga que está
   corriendo.
2. **Node.js:** descargue el instalador **LTS** de [nodejs.org](https://nodejs.org) y
   siga el asistente.

### Mac

1. **Docker Desktop:** descárguelo de [docker.com](https://www.docker.com/products/docker-desktop/)
   (elija Apple Silicon o Intel según su Mac) y ábralo.
2. **Node.js:** instalador **LTS** de [nodejs.org](https://nodejs.org), o con Homebrew:
   `brew install node@22`.

### Linux (Ubuntu, Zorin, Mint)

```bash
# Docker
sudo apt update && sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $UBUNTU_CODENAME) stable" \
 | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER     # luego cierre sesión y vuelva a entrar

# Node.js 22 (con nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# cierre y vuelva a abrir la terminal
nvm install 22
```

### Linux (Fedora)

Docker viene en los repositorios oficiales de Fedora (paquete `moby-engine`), así que
no hace falta agregar repositorios externos:

```bash
# Docker
sudo dnf install -y moby-engine docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER     # luego cierre sesión en Fedora y vuelva a entrar

# Node.js 22
sudo dnf install -y nodejs
```

Use esos nombres exactos: `sudo dnf install docker` a secas puede instalar otro paquete.
Cerrar y abrir la terminal no basta; hay que cerrar la sesión completa (o reiniciar).
Para comprobar que quedó bien: `groups` debe incluir `docker`, y
`docker run --rm hello-world` debe imprimir `Hello from Docker!`.

Cuando termine, compruebe ambos con `docker compose version` y `node --version`, y
vuelva a los [pasos](#pasos).
