# AGENTS.md

Guía para agentes que trabajen en este repositorio. Léela completa antes de tocar código.

## Qué es este proyecto

App Expo/React Native (`manga-spawn`) para leer **mangas, libros y comics**, más un **servidor propio** que envía notificaciones push. Es un **monorepo npm workspaces**:

- `src/` — app Expo (Expo Router).
- `packages/content-sources/` — fuentes de contenido compartidas (app + servidor). TS puro.
- `server/` — servidor de push (Hono + `node:sqlite` + `node-cron`).

## Reglas de Expo (no confíes en tu memoria)

Expo cambia APIs en cada SDK. Antes de escribir código que use APIs de Expo/EAS/React Native:

1. Lee la versión mayor de `expo` en `package.json` (hoy `~57`).
2. Consulta los docs de esa versión: `https://docs.expo.dev/versions/v57.0.0/`.
3. Para lo demás, `https://docs.expo.dev/llms.txt`.

- **Expo Router** para navegación. Rutas en `src/app/`; `_layout.tsx` define navegadores. Código no-route fuera de `src/app/`.
- No edites `ios/` ni `android/` a mano (CNG). Configura en `app.json` y config plugins.
- Tras añadir una librería nativa, usa un development build (`npx expo run:*` o `eas build`).

## Comandos

```bash
# App
npx expo start --clear        # dev server (usar --clear tras cambiar workspaces/config)
npx expo lint                 # lint (solo src/)
npx tsc --noEmit              # typecheck app
npx expo export --platform android   # verifica que Metro empaqueta

# Paquete compartido
npx tsc --noEmit -p packages/content-sources/tsconfig.json

# Servidor
npm run dev -w @manga-spawn/server
npx tsc --noEmit -p server/tsconfig.json
cd server && docker compose up --build
```

**Antes de dar una tarea por terminada**: corre `npx tsc --noEmit`, `npx tsc --noEmit -p packages/content-sources/tsconfig.json`, `npx tsc --noEmit -p server/tsconfig.json` y `npx expo lint`.

## Arquitectura de la app

- `src/domain/` — modelos, interfaces de repositorios, servicios, `providers/manga-source.ts`.
- `src/data/` — implementaciones: `remote/` (fuentes), `repositories/`, `storage/`.
- `src/features/` — hooks de React Query por dominio.
- `src/core/di/container.ts` — **única** fábrica de repositorios (singleton). Añade dependencias aquí.
- `src/core/di/provider.tsx` — `useRepositories()`.
- `src/core/di/source-registry.ts` — fuentes activas **por tipo** (`manga`/`book`/`comic`).

### Modelo de contenido

- `ContentKind = 'manga' | 'book' | 'comic'`.
- `Content` (= `Manga` en la app) tiene `kind`; `Release` (= `Chapter`) es un capítulo/número.
- `ReaderContent` es una unión: `{type:'images'}` o `{type:'text'|'html'}`.
- Los **ids** de contenido son `sourceId:rawId` (p. ej. `mangadex:uuid`). Los ids de release **no deben contener `/`** (rompen el routing): usa `~` como separador (ver `madara.ts`, `megabanana.ts`).

### Fuentes

- Viven en `packages/content-sources/src/sources/` e implementan `ContentSource` (`content-source.ts`).
- Se registran en `src/core/di/container.ts` (app) y `server/src/sources.ts` (servidor).
- Exporta desde `packages/content-sources/src/index.ts`.
- Fuente de comics por defecto en `src/domain/source-id.ts` (`DEFAULT_SOURCE_IDS`).

## Arquitectura del servidor

- `server/src/app.ts` — rutas Hono. `devices.ts` y `admin.ts`.
- `server/src/db/` — `node:sqlite` (NO `better-sqlite3`, no compila en Node 26).
- `server/src/jobs/` — `chapter-checker.ts` (cron de novedades) y `receipt-checker.ts`.
- `server/src/services/expo-push.ts` — envío vía `expo-server-sdk`.
- Notificaciones: `POST /v1/devices`, `PUT /v1/devices/:id/subscriptions`, `POST /v1/admin/announce` (todos), `POST /v1/admin/notify/:deviceId` (uno).

## Trampas conocidas (importantes)

1. **Monorepo**: SDK 54+ auto-configura Metro para workspaces; **no** crees `metro.config.js` para watchFolders/nodeModulesPaths.
2. **Paquete compartido**: es TS fuente (`"main": "src/index.ts"`, `"type": "module"`). No importes `react-native`/`expo-*`/alias `@/` dentro de él. El servidor lo consume con `tsx`.
3. **Reanimated + React Compiler**: mutar shared values (`.value =`) dispara `react-hooks/immutability`. Desactiva la regla por archivo con `/* eslint-disable react-hooks/immutability */` (ver `src/components/zoomable-image.tsx`).
4. **VirtualizedList**: nunca cambies `onViewableItemsChanged` entre función y `undefined` en la misma lista. Pasa las props siempre y usa `key` para remontar (ver `src/components/image-reader.tsx`).
5. **No uses `setState` dentro de `useEffect`** (regla `react-hooks/set-state-in-effect`). Deriva el valor o usa estado con `key`.
6. **Webtoons**: portadas y páginas requieren header `Referer: https://www.webtoons.com/`. El modelo `Content` tiene `coverHeaders`; úsalo al renderizar portadas. Las páginas van con `headers` por `ContentPage`.
7. **xoxocomic** fue descartado: sirve HTML falso en vez de imágenes a clientes no-navegador.
8. **Marmota** es tema WordPress **Madara**: búsqueda por `?s=...&post_type=wp-manga`, capítulos por `POST /comic/{slug}/ajax/chapters/`, páginas en `img.wp-manga-chapter-img[data-src]` (forzar `https`).
9. **MegaBanana** es API REST de WordPress: `/wp-json/megabanana/v1/catalog` y `/reader/{postId}?chapter=N`; portada/descripción vía `/wp-json/wp/v2/posts/{id}?_embed`.
10. **SQLite del servidor**: `node:sqlite` requiere Node 24+. `page/nX.jpg` de archive.org no da 404 fuera de rango; calcula el total con `_page_numbers.json`.

## Convenciones

- TypeScript estricto. Sin `any` innecesario.
- **No añadas comentarios** salvo que se pidan o sean directivas de lint.
- Componentes UI reutilizables en `src/components/`; hooks de datos en `src/features/`.
- Estado del servidor con React Query; claves en `*Keys`.
- Persistencia local con `appStore`/`secureStore` (`src/data/storage/key-value-store.ts`), no AsyncStorage directo.

## Flujo de notificaciones (resumen)

- La app crea un `deviceId` (expo-crypto) y sincroniza token + títulos seguidos (outbox local-first).
- Si `EXPO_PUBLIC_NOTIFICATIONS_API_URL` está vacío, se usan notificaciones locales (`NewChapterChecker`).
- Si está configurado, el servidor rastrea capítulos y envía push; el chequeo local se desactiva para evitar duplicados.
