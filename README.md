# manga-spawn

Lector multi-contenido para móvil (**mangas, libros y comics**) con **notificaciones push enviadas desde tu propio servidor**.

Construido con Expo/React Native (app), un paquete compartido de fuentes de contenido y un servidor Node que rastrea novedades y envía push vía Expo Push Service.

## Características

- **Multi-tipo**: mangas, libros y comics, con **selector de fuente por tipo**.
- **Multi-fuente**: MangaDex, WeebCentral, Project Gutenberg, Internet Archive (libros y comics), WEBTOON, Marmota y MegaBanana.
- **Lector de imágenes** con:
  - Modo **Paginado** (deslizar para anterior/siguiente) y modo **Scroll** (tira vertical), alternables en el lector.
  - **Zoom**: pellizcar, arrastrar y doble toque.
- **Lector de libros** cómodo: tamaño de letra, altura de línea, tema (claro/sepia/oscuro), progreso y reanudación.
- **Multi-lectura**: se guardan varios títulos en curso a la vez (carrusel "Continuar leyendo").
- **Local-first**: los datos del usuario viven en el dispositivo; la sincronización con el servidor es best-effort.
- **Notificaciones push** desde servidor propio (novedades de capítulos + anuncios manuales), con fallback local.
- **Opcional**: anuncios broadcast y a un dispositivo específico desde el servidor.

## Estructura (monorepo npm workspaces)

```
.
├── src/                        # App Expo (Expo Router)
│   ├── app/                    # Rutas (pantallas)
│   ├── core/                   # config, DI, auth, query, environment
│   ├── domain/                 # modelos, repositorios, servicios, providers
│   ├── data/                   # implementaciones (remoto, storage, repos)
│   ├── features/               # hooks por dominio (manga, library, notifications…)
│   └── components/             # UI (incluye reader, zoom, grid)
├── packages/content-sources/   # Fuentes de contenido compartidas app/servidor
└── server/                     # Servidor de notificaciones (Hono + SQLite + cron)
```

## Requisitos

- Node.js **24+** (el servidor usa `node:sqlite`; en Node 26 también funciona).
- npm 10+ (workspaces).
- Para builds nativos: `npx expo run:ios|android` o EAS. Expo Go sirve para desarrollo, con limitaciones de notificaciones (ver más abajo).

## Puesta en marcha

### 1. App

```bash
npm install
cp .env.example .env            # opcional: configura la URL del servidor
npx expo start --clear
```

### 2. Servidor de notificaciones (opcional)

```bash
cd server
cp .env.example .env            # define ADMIN_API_KEY (y EXPO_ACCESS_TOKEN si usas push seguro)
cd ..
npm run dev -w @manga-spawn/server
# -> http://localhost:8787
```

Con Docker (SQLite persistido en un volumen):

```bash
cd server
docker compose up --build
```

## Variables de entorno

### App (`.env`)

| Variable | Descripción |
|---|---|
| `EXPO_PUBLIC_NOTIFICATIONS_API_URL` | URL del servidor de push. Si está vacía, solo notificaciones locales. |
| `EXPO_PUBLIC_EXPO_GO_NOTIFICATIONS` | `1` para habilitar notificaciones locales en Expo Go (Android) con el patch aplicado. |
| `EXPO_PUBLIC_MANGADEX_PROXY` | Proxy opcional para MangaDex en web (CORS). |

### Servidor (`server/.env`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP (por defecto `8787`). |
| `DATABASE_PATH` | Ruta del archivo SQLite. |
| `EXPO_ACCESS_TOKEN` | Token de Expo (Enhanced Push Security). Opcional. |
| `ADMIN_API_KEY` | Clave para `/v1/admin/*`. **Obligatoria**. |
| `CHECK_INTERVAL_MINUTES` | Frecuencia del rastreo de capítulos (por defecto `30`). |
| `RECEIPT_INTERVAL_MINUTES` | Frecuencia de revisión de recibos (por defecto `15`). |
| `CORS_ORIGIN` | Origen permitido (por defecto `*`). |

## Fuentes de contenido

| id | Tipo | Método | Lector |
|---|---|---|---|
| `mangadex` | manga | API | imágenes |
| `weebcentral` | manga | scraping | imágenes |
| `gutenberg` | libro | API (Gutendex) | texto/HTML |
| `internet-archive` | libro | API (archive.org) | texto |
| `marmota` | comic | scraping (Madara) | imágenes |
| `megabanana` | comic | REST API | imágenes |
| `webtoons` | comic | scraping | imágenes |
| `internet-archive-comics` | comic | API (archive.org) | imágenes |

Fuente de comics por defecto: `marmota`. Se cambia en **Ajustes → Fuente de comics**.

## Notificaciones push

Flujo: la app registra un `deviceId` anónimo + su Expo push token en tu servidor y sincroniza los títulos seguidos. Un cron del servidor revisa novedades y envía push por Expo Push Service; otro job limpia tokens inválidos (`DeviceNotRegistered`).

Endpoints del servidor:

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/health` | Estado del servidor. |
| `POST` | `/v1/devices` | Registrar/actualizar dispositivo `{deviceId, token, platform}`. |
| `DELETE` | `/v1/devices/:id` | Dar de baja un dispositivo. |
| `PUT` | `/v1/devices/:id/subscriptions` | Reemplazar la lista de títulos seguidos. |
| `POST` | `/v1/admin/announce` | Anuncio a **todos** (header `x-admin-key`). |
| `POST` | `/v1/admin/notify/:deviceId` | Anuncio a **un dispositivo** (header `x-admin-key`). |

Ejemplo:

```bash
curl -X POST http://localhost:8787/v1/admin/announce \
  -H 'Content-Type: application/json' \
  -H 'x-admin-key: TU_CLAVE' \
  -d '{"title":"Novedad","body":"Nuevo capítulo disponible","url":"/"}'
```

Para entrega real en iOS/Android configura credenciales **FCM V1** y **APNs** con `eas credentials`.

## Scripts

```bash
npx expo start --clear                          # app (limpia caché)
npx expo lint                                   # lint app
npx tsc --noEmit                                # typecheck app
npx tsc --noEmit -p packages/content-sources/tsconfig.json
npx tsc --noEmit -p server/tsconfig.json
npx expo export --platform android              # bundle de prueba
npm run dev -w @manga-spawn/server              # servidor en dev
```

## Aviso legal

Varias fuentes (WeebCentral, Marmota, MegaBanana, WEBTOON) alojan contenido con derechos de autor. El uso que hagas de ellas es tu responsabilidad.
