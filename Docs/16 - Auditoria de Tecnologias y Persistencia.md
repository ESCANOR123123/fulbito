# Auditoría de tecnologías y persistencia

**Revisión:** 2026-10-30  
**Proyecto:** Turnos Canchas / La Bombonerita Fútbol Club

## Resumen

- El lenguaje principal es **JavaScript**. El frontend moderno usa React con JSX; el servidor usa Node.js y CommonJS. No se encontró TypeScript.
- La base de datos prevista y utilizada por el código es **PostgreSQL en Supabase**. El navegador accede con `@supabase/supabase-js`; Express sirve archivos, no implementa una API de datos propia.
- La versión moderna en React contiene landing, reservas, Fichajes público y panel administrativo. La versión Vanilla permanece en `public/` y se expone en `/v1` como respaldo histórico.
- La versión anterior conserva almacenamiento local con IndexedDB y `localStorage` como fallback. `public/fields.json` funciona como dato inicial/fallback.
- El script de pruebas de npm todavía es un placeholder; no hay suite automatizada declarada.

## Lenguajes y formatos

| Tecnología | Uso detectado |
|---|---|
| JavaScript | Lógica de React, sitio Vanilla, servidor Express y configuración de Vite. |
| JSX | Componentes React de `frontend/src/`. |
| HTML | Entradas del cliente React y páginas Vanilla. |
| CSS | Estilos propios, tokens y responsive; convive con Tailwind instalado. |
| SQL | `supabase/schema.sql` y migraciones 002/003: tablas, funciones, triggers y RLS. |
| Python | Script auxiliar `generar_tp5_word.py`; no es necesario para arrancar la aplicación web. |
| JSON | `package.json`, configuración de build y `public/fields.json`. |
| Markdown | Documentación de producto y roadmap en esta bóveda de Obsidian. |

## Frameworks, librerías y entorno

| Tecnología | Uso |
|---|---|
| Node.js | Runtime del servidor y scripts de desarrollo. No se fija una versión en `package.json`. |
| Express 5 | Sirve `frontend/dist`, recursos públicos, `/v1` y `/fichajes`. |
| React 19 / React DOM | UI moderna, reservas, autenticación y panel admin. |
| Vite 8 | Servidor de desarrollo, proxy local y build de React. |
| Tailwind CSS 4 + `@tailwindcss/vite` | Integración de estilos con Vite. El código visible usa sobre todo clases propias y CSS escrito en `styles.css`/`admin.css`. |
| `@supabase/supabase-js` 2 | Cliente de navegador para Supabase Auth y consultas a tablas. No se detectó ORM. |
| GSAP + `@gsap/react` + ScrollTrigger | Animaciones y efectos de scroll en el cliente React. |
| `python-docx` | Dependencia importada por el generador auxiliar de documentos Word. No está declarada en `package.json`. |
| Módulos nativos de Node (`fs`, `path`, `child_process`) | Servir archivos y levantar los procesos de desarrollo. |

React y Vite compilan la experiencia moderna. Express sirve la aplicación compilada; la app usa Supabase directamente desde el cliente para autenticación y operaciones de datos.

## Base de datos y datos persistidos

**Base de datos:** PostgreSQL administrado por Supabase.

| Servicio/tabla | Datos o función |
|---|---|
| Supabase Auth | Registro, inicio, recuperación y sesiones de usuarios. |
| `profiles` | Perfil de cuenta, nombre, teléfono y rol (`customer` / `admin`). |
| `bookings` | Reservas, datos del turno, cliente y titularidad. |
| `booking_slots` | Ocupación de cancha/fecha/hora, sin datos personales del cliente. |
| `fields` | Canchas, sede, superficie, capacidad, precio y estado. |
| `blocked_slots` | Bloqueos administrativos de turnos. |
| `player_profiles` | Perfiles deportivos publicados/moderados. |
| `urgent_notices` | Avisos para buscar jugadores. |
| `player_profile_reports` | Denuncias sobre perfiles. |
| Supabase Storage `profile-photos` | Fotos privadas de cuenta; cada persona solo puede acceder a su carpeta. La ruta se guarda en los metadatos de Supabase Auth. |

El esquema define **Row Level Security (RLS)** para limitar lectura y escritura según usuario/rol. No hay credenciales de servicio en el frontend: se usa una clave publishable en `public/supabase-config.js`.

## Persistencia local y legado

- **IndexedDB:** almacén del sitio Vanilla para reservas/configuración local cuando Supabase no está disponible o antes de su integración.
- **`localStorage`:** fallback de la versión Vanilla cuando IndexedDB no está disponible.
- **`public/fields.json`:** valores iniciales/fallback para la lista de canchas.
- El frontend React usa Supabase para cuentas, reservas y datos compartidos; la versión Vanilla sigue teniendo la lógica heredada de almacenamiento local.

Estos datos locales no se importan automáticamente a Supabase. La documentación indica que la migración/importación de datos antiguos requiere un flujo separado.

## Herramientas y comandos

- `npm run dev`: inicia Express y Vite para desarrollo.
- `npm run build`: compila React a `frontend/dist`.
- `npm start`: inicia Express para servir la build si existe o el sitio estático en caso contrario.
- `npm test`: no ejecuta pruebas; el script actual termina con `Error: no test specified`.
- `Docs/` y `.obsidian/`: documentación y configuración de la bóveda, no dependencias de runtime de la app.

## Estado y puntos por verificar

1. **Supabase 002:** el usuario confirmó que los pasos 1 y 2 están listos.
2. **Supabase 003:** el usuario confirmó aplicada `003_fichajes.sql` y listo el panel de moderación.
3. **Prueba por rol:** probar sesión cliente y admin, y validar RLS con ambos usuarios.
4. **Pruebas automáticas:** aún no hay suite de tests configurada.
5. **Python auxiliar:** `python-docx` no figura en dependencias npm ni se encontró un manifiesto Python; instalarlo/configurarlo solo si se necesita regenerar el Word.

## Fuentes del inventario

- `package.json`, `vite.config.js`, `server.js`, `scripts/dev.js`
- `frontend/src/`, `frontend/index.html`
- `public/app.js`, `public/index.html`, `public/fichajes.html`, `public/fields.json`
- `supabase/schema.sql`, `supabase/migrations/002_shared_venue_configuration.sql`, `supabase/migrations/003_fichajes.sql`
- `generar_tp5_word.py`, `PRODUCT.md`, `Docs/15 - Autenticacion y Reservas por Cuenta.md`

---
Ver [[00 - Hub Central del Proyecto]], [[03 - Etapas y Roadmap]], [[14 - Auditoria de Nuevas Funcionalidades y Migracion a Stack Moderno]] y [[15 - Autenticacion y Reservas por Cuenta]].
