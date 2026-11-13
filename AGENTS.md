# AGENTS.md — La Bombonerita FC

## Qué es

Aplicación web para que futbolistas y capitanes conozcan y reserven canchas, y encuentren jugadores; el complejo también la usa para administrar reservas e instalaciones.

## Tecnologías

- JavaScript con React 19 y Vite para la aplicación; Tailwind CSS y CSS del proyecto para estilos.
- Node.js y Express para servir la aplicación.
- Supabase Auth y PostgreSQL para cuentas y datos compartidos.
- GSAP para animaciones y Supabase CLI para migraciones y funciones.
- No agregar librerías o servicios externos sin consultar primero.

## Estructura

- `frontend/src/App.jsx`: landing, reservas y autenticación.
- `frontend/src/AdminPanel.jsx`: panel de administración.
- `frontend/src/Fichajes.jsx`: mercado público de jugadores y avisos.
- `frontend/src/*.css`: estilos globales, de administración y de Fichajes.
- `public/`: configuración pública y recursos estáticos; `/v1` conserva la app Vanilla histórica.
- `server.js`, `scripts/` y `vite.config.js`: servidor y desarrollo local.
- `supabase/schema.sql`, `supabase/migrations/` y `supabase/functions/`: esquema, cambios de base de datos y funciones Edge.
- `Docs/`: roadmap, especificaciones, auditorías y guías de prueba para Obsidian.

## Reglas de producto y estilo

- Interfaz y documentación en español argentino, con tono cálido, claro y directo.
- Priorizar uso móvil, accesibilidad y flujos simples.
- Colores principales: verde `#245d3e` y dorado `#c29b54`; respetar las variables CSS existentes.
- Explicar cada cambio en pocas líneas.
- Nunca escribir claves privadas, `service_role`, tokens ni secretos en el código. La clave publicable de Supabase puede estar en la configuración pública; los secretos van en Supabase Secrets/Vault o en variables locales ignoradas por Git.

## Reglas de trabajo del proyecto

Estas reglas aplican a todo cambio realizado con agentes o colaboradores en este repositorio.

## Ramas y Git

- Trabajar siempre en una rama específica para la tarea; nunca implementar cambios directamente en `main`.
- Reutilizar la rama activa cuando el trabajo sea continuación de la misma tarea. Crear otra rama para una tarea distinta, con prefijo `codex/` salvo que el usuario indique otro.
- Antes de editar, revisar la rama activa y el estado del árbol de trabajo. No sobrescribir ni descartar cambios existentes del usuario.
- Consultar al usuario y obtener su aprobación explícita antes de cada commit y antes de cada push. No asumir que aprobar uno autoriza el otro.
- No hacer merge, rebase, reset, cherry-pick ni borrar ramas sin autorización explícita.
- No incluir claves privadas, `service_role`, tokens ni otros secretos en commits, documentación pública o frontend.

## Documentación

- Documentar cada cambio funcional o técnico en `Docs/04 - Log Tecnico y Cambios.md`, con fecha, cambio, motivo, archivos afectados y verificación.
- Actualizar también la especificación, guía de pruebas o roadmap relacionados cuando el cambio altere su alcance, comportamiento o estado.
- Registrar únicamente verificaciones realizadas. Diferenciar pruebas pendientes, limitaciones del entorno y resultados confirmados por el usuario.
- Mantener la documentación en español y conservar las notas históricas; aclarar cuáles decisiones posteriores están vigentes.

## Alcance e implementación

- Limitar cada tarea a lo solicitado y a lo necesario para que funcione; evitar refactorizaciones o cambios visuales no pedidos.
- Preferir la solución más simple que conserve seguridad, accesibilidad y comportamiento existente.
- No cambiar esquema, políticas RLS, dependencias o servicios externos sin que sean necesarios para la tarea.
- Proteger los cambios existentes: inspeccionar el diff antes de finalizar y no restablecer archivos para limpiar el árbol de trabajo.

## Verificación y entrega

- Ejecutar solo las verificaciones relevantes y permitidas para la tarea. Informar qué se ejecutó y qué queda pendiente.
- No afirmar que un flujo con Supabase, roles, correo o un dispositivo real fue probado si no se verificó en ese entorno.
- Al terminar, resumir los cambios, la documentación actualizada, la rama activa y el resultado de verificación. Dejar commit y push pendientes hasta consultar al usuario.
