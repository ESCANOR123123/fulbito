# fulbito

Cancha de fútbol para La Bombonerita FC. El proyecto presenta el complejo, permite reservar canchas y conecta jugadores con equipos. La aplicación moderna usa React 19, Vite, Tailwind CSS, Express y Supabase (Auth y PostgreSQL).

## Desarrollo

```sh
npm ci
npm run dev
```

Abrí la URL que indique Vite. La página pública de Fichajes está en `/fichajes`.

## Servidor local integrado

```sh
npm run build
npm start
```

Express sirve React en `http://localhost:3000`; `/v1` conserva la versión Vanilla como respaldo histórico.

## Supabase

La configuración pública del cliente se encuentra en `public/supabase-config.js`. No agregues claves `service_role` ni secretos al repositorio. Las tablas y políticas se definen en `supabase/schema.sql` y `supabase/migrations/`.

## Documentación

Las especificaciones, roadmap y guías de prueba están en `Docs/`. Las pruebas manuales multiusuario de Fichajes están descritas en `Docs/13 - Guia Test Etapa 5.md`.
