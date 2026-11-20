# Log de Decisiones Técnicas y Cambios

## 2026-10-09 - Inicio Proyecto (Etapa 1)

### Stack Elegido
| Tecnología | Versión/Espec | Por qué |
|------------|---------------|---------|
| HTML5 | Semántico | Accesibilidad, SEO, sin build |
| CSS3 | Variables, Grid, Flexbox | Moderno, sin preprocesador |
| JS Vanilla | ES6+ (const, arrow, template literals) | Zero deps, corre en cualquier navegador |
| Storage | localStorage | Sincrónico, simple, 5MB suficiente |

### Estructura de Archivos
```
/TurnosCanchas
  ├── index.html    (estructura + contenido)
  ├── style.css     (todo el styling)
  └── app.js        (toda la lógica)
```

### Decisiones de Diseño (CSS)
- **Mobile-first**: `min-width` en media queries solo para desktop
- **Variables CSS**: Colores, sombras, radios, transiciones centralizados
- **Sistema de espaciado**: 0.25rem base (4px), escala 1-2-4-8
- **Tipografía**: System font stack (rendimiento, nativo)
- **Shadows**: 2 niveles (reposo / hover) para profundidad

### Decisiones de Lógica (JS)
- **Estado global mínimo**: `selectedFieldId`, `bookings[]`
- **Datos quemados**: `FIELDS` array + `TIME_SLOTS` array
- **IDs únicos**: `Date.now()` para bookings (suficiente para localStorage)
- **Filtrado reactivo**: `updateTimeSlots()` recalcula al cambiar fecha
- **Persistencia**: `saveBookings()` / `loadBookings()` wrappers

### Accesibilidad Básica Implementada
- Labels asociados a inputs (`for` + `id`)
- Contraste AA (WCAG) en colores primarios
- Focus visible en inputs y botones
- Semántica HTML: `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`
- `disabled` real en slots ocupados (no solo visual)

### Known Issues / Tech Debt (Intencional para MVP)
1. **No hay validación servidor** - Solo cliente, aceptable para MVP local
2. **Race condition localStorage** - Si 2 pestañas abiertas, última gana
3. **Timezone naive** - Fechas como strings, sin zona horaria
4. **Hardcoded fields** - Etapa 2 moverá a JSON
5. **No hay tests** - Manual testing only por ahora

### Próximas Decisiones a Tomar (Etapa 2)
- [ ] ¿IndexedDB o seguir localStorage + sync manual?
- [ ] ¿fetch() a JSON local o módulo ES6 import?
- [ ] ¿Librería de validación (zod/yup) o regex caseras?
- [ ] ¿Toast library (Sonner) o implementación propia ligera?

---

## 2026-10-09 - Etapa 1 - Corrección de Bugs Críticos, Validación y Cierre de MVP

### Cambio
- Corrección de SyntaxError crítico en `app.js` (comillas mal cerradas en template string de `renderFields`).
- Corrección de cálculo de fecha mínima (`setMinDate`) en `app.js` utilizando la fecha local del navegador en vez de UTC.
- Incorporación de opción default `"Selecciona un horario"` en `updateTimeSlots()` para que la validación nativa `required` bloquee envíos sin hora seleccionada.
- Validación de prevención de doble reserva en `handleBookingSubmit`.
- Refresco dinámico de franjas horarias en `cancelBookingById` si se cancela una reserva mientras el selector está abierto.
- Envoltura de botones del formulario en `<div class="form-actions">` dentro de `index.html` para aplicar estilos CSS flex y comportamiento responsive mobile-first.
- Agregado de atributo `pattern` en input de teléfono en `index.html` para cumplir caso edge E2 de validación HTML5.
- Agregado de estilo explícito para opciones deshabilitadas (`select option:disabled`) en `style.css`.
- Eliminación de nota plantilla `Bienvenido.md` en la bóveda de Obsidian según sus instrucciones.

### Por qué
- La aplicación no ejecutaba debido al error sintáctico en `app.js`.
- Las validaciones de casos borde especificadas en `05 - Guia Test Etapa 1.md` no estaban completamente cubiertas.
- Los botones no respetaban la disposición en columna en pantallas móviles por falta del contenedor `.form-actions`.

### Archivos afectados
- `TurnosCanchas/app.js`
- `TurnosCanchas/index.html`
- `TurnosCanchas/style.css`
- `Readme/Turnos Canchas/05 - Guia Test Etapa 1.md`
- `Readme/Turnos Canchas/Bienvenido.md` (eliminado)

### Testing
- Ejecución de suite de pruebas automatizadas sobre DOM, LocalStorage, CSS y flujos de reserva.
- 10/10 casos Happy Path pasados.
- 6/6 casos Edge pasados.
- 0 errores sintácticos o de consola (`node -c` OK).

---

## 2026-10-09 - Etapa 2 - Mejora de Datos y UX (IndexedDB, fields.json, Toasts, Validación Regex y Modal)

### Cambio
- Creación de `fields.json` para desacoplar el listado de canchas del código y adición del campo `complex` ("Sede Central", "Sede Norte").
- Implementación de carga asíncrona mediante `fetch('fields.json')` con respaldo nativo `DEFAULT_FIELDS` para funcionamiento transparente tanto en servidores como mediante protocolo local `file://`.
- Implementación de motor de persistencia asíncrono con `IndexedDB` (`TurnosCanchasDB`, versión 1, objectStore `bookings`), con migración automática de datos existentes desde `localStorage` y mecanismo de fallback.
- Sistema de validación de teléfonos argentinos con expresión regular (`^(?:(?:\+|00)?54)?(?:9)?(?:0)?([1-9]\d{1,3})(?:15)?(\d{6,8})$`) con feedback visual interactivo (`.is-invalid`, `.input-hint`).
- Reemplazo completo de `alert()` nativo por un sistema de notificaciones Toast dinámico y accesible (`.toast-container`, `.toast-success`, `.toast-error`, `.toast-info`) con auto-cierre y animaciones CSS fluidas.
- Reemplazo de `confirm()` nativo por un diálogo modal de confirmación accesible (`#confirm-modal`) para cancelación de turnos.
- Implementación de estado de carga visual en el botón de confirmación (`.spinner`, texto "Confirmando...") y prevención estricta de doble submit (`isSubmitting` flag + `disabled`).
- Badge visual de Sede/Complejo en las tarjetas de canchas y en el historial de reservas.

### Por qué
- Mayor escalabilidad de datos al separar configuración de canchas en JSON.
- Capacidad de almacenamiento y robustez superiores con IndexedDB respecto al límite de 5MB síncrono de localStorage.
- Experiencia de usuario (UX) moderna y no intrusiva al eliminar los diálogos nativos bloqueantes del navegador (`alert`/`confirm`).
- Calidad de datos garantizada al asegurar números telefónicos válidos en formato argentino.
- Prevención de duplicación accidental de turnos por doble clic.

### Archivos afectados
- `TurnosCanchas/fields.json` (nuevo)
- `TurnosCanchas/index.html`
- `TurnosCanchas/style.css`
- `TurnosCanchas/app.js`
- `Readme/Turnos Canchas/03 - Etapas y Roadmap.md`
- `Readme/Turnos Canchas/04 - Log Tecnico y Cambios.md`
- `Readme/Turnos Canchas/06 - Guia Test Etapa 2.md` (nuevo)

### Testing
- Ejecución de `test_stage2.js` verificando estructura de `fields.json`, integración DOM, estilos CSS, pruebas unitarias de regex telefónica argentina (números válidos e inválidos) y ciclo de vida de persistencia y notificaciones.
- 100% de tests aprobados.

---

## 2026-10-09 - Etapa 3 - Panel Admin Básico (CRUD Canchas, Bloqueo de Franjas, Filtros y Exportación CSV)

### Cambio
- Implementación de navegación superior con conmutador de vistas (`#client-view` vs `#admin-view`), con soporte para hash en URL (`#admin`).
- Sistema de autenticación de administrador ligero con clave predeterminada (`admin123`) y cierre de sesión seguro.
- Panel de control estructurado en tres pestañas:
  1. **Canchas (CRUD)**: Creación de canchas, edición en línea, borrado con confirmación y conmutación de estado Activa/Inactiva (las canchas inactivas se ocultan automáticamente del flujo de reserva del cliente).
  2. **Bloqueo de Franjas Horarias**: Asignación de bloqueos por cancha, fecha y hora con motivo descriptivo (mantenimiento, torneo, clima) que deshabilitan y etiquetan los slots en el selector de turnos del cliente. Desbloqueo interactivo.
  3. **Todas las Reservas**: Visualización tabular de turnos con filtros dinámicos (Todas, Hoy, Próximos 7 días y filtro por cancha), métricas automáticas de cantidad de turnos e ingresos estimados, y cancelación administrativa directa.
- Exportador a formato CSV (`exportBookingsToCSV`) nativo con codificación UTF-8 con BOM (`\uFEFF`), escape de comillas RFC 4180 y descarga directa en el navegador.
- Actualización de IndexedDB a versión 2 con creación de almacenes dedicados `fields` y `blocked_slots`, respaldados en `localStorage`.

### Por qué
- Permite al propietario del complejo gestionar su negocio en tiempo real desde cualquier dispositivo sin necesidad de modificar archivos de código.
- Da flexibilidad operativa para suspender canchas o cancelar horarios por lluvia o reparaciones.
- Brinda visibilidad financiera de ingresos y facilita la conciliación de turnos mediante exportación a Excel / Google Sheets vía CSV.

### Archivos afectados
- `TurnosCanchas/index.html`
- `TurnosCanchas/style.css`
- `TurnosCanchas/app.js`
- `Readme/Turnos Canchas/03 - Etapas y Roadmap.md`
- `Readme/Turnos Canchas/04 - Log Tecnico y Cambios.md`
- `Readme/Turnos Canchas/07 - Guia Test Etapa 3.md` (nuevo)

### Testing
- Ejecución de suite automatizada `test_stage3.js` validando renderizado de componentes, navegación entre vistas, autenticación admin, estructura CSV y coherencia de datos.
- 100% de tests aprobados.

---

## 2026-10-09 - Expansión de Producto - Definición de Landing Comercial y Módulo de Fichaje

### Cambio
- Registro y documentación del nuevo alcance del proyecto solicitado por el usuario:
  1. **Vitrina Comercial / Publicidad**: Sección visual para publicitar el predio, instalaciones, comodidades y servicios.
  2. **Motor de Reservas**: Conservación y enlace directo al sistema de turnos existente.
  3. **Módulo "Fichaje"**: Espacio donde jugadores libres publican su "CV Deportivo" y equipos buscan refuerzos para sus partidos.
- Creación de la especificación técnica y funcional completa en `08 - Modulo Fichaje y Landing - Especificacion y Consultas.md`.
- Formulación y auditoría de 4 consultas clave de negocio y arquitectura (contacto por WhatsApp, gestión/edición del CV, bidireccionalidad de avisos y arquitectura visual SPA).
- Actualización de `01 - Idea del Proyecto.md`, `02 - Prompt y Decisiones.md` y `03 - Etapas y Roadmap.md` (reestructuración de Etapas 4 y 5).
- Congelamiento temporal de código: ninguna línea de código implementada en esta fase por directiva expresa del usuario ("por ahora nada de código, solo documentación y consultas para pasar después").

### Por qué
- Asegurar alineación completa con la visión del usuario antes de desarrollar.
- Evitar sobreingeniería o retrabajo en interfaces y flujos de datos.
- Mantener la bóveda de Obsidian como fuente única de verdad para auditoría técnica y funcional.

### Archivos afectados
- `Readme/Turnos Canchas/01 - Idea del Proyecto.md`
- `Readme/Turnos Canchas/02 - Prompt y Decisiones.md`
- `Readme/Turnos Canchas/03 - Etapas y Roadmap.md`
- `Readme/Turnos Canchas/04 - Log Tecnico y Cambios.md`
- `Readme/Turnos Canchas/08 - Modulo Fichaje y Landing - Especificacion y Consultas.md` (nuevo)

### Decisiones Auditadas con el Usuario
1. **Contacto WhatsApp Directo**: Generación de enlaces con mensaje pre-rellenado para contacto inmediato de capitanes a jugadores.
2. **Gestión con PIN de 4 dígitos**: Permite al jugador editar o pausar su CV desde cualquier dispositivo sin crear contraseñas pesadas.
3. **Módulo Bidireccional**: Soporte para CVs de jugadores libres y pizarra de avisos de urgencia ("Falta 1 hoy").
4. **Arquitectura SPA**: Navegación fluida por scroll y barra superior fija (`Complejo`, `Reservas`, `Fichajes`, `Admin`).

---

## 2026-10-09 - Auditoría de UI/UX - Frameworks, Skills Instaladas y Referencias de Mercado

### Cambio
- Realización de una auditoría comparativa completa de UI/UX registrada en `09 - Auditoria UI-UX - Frameworks Skills y Referencias.md`.
- Identificación de las 3 skills instaladas más potentes para el proyecto:
  1. `ui-ux-pro-max` (tokens deportivos, accesibilidad, layouts mobile-first, chip filters).
  2. `impeccable` (calidad y jerarquía visual, feedback interactivo).
  3. `ponytail` (prevención de sobreingeniería y garantía de velocidad).
- Evaluación técnica de frameworks recomendados (Modern Vanilla CSS con tokens vs Tailwind CSS vs Alpine.js) y descarte fundado de frameworks pesados (React/Next.js).
- Selección de plataformas referentes de mercado para benchmarking:
  - Reservas: *Alquilatucancha (ATC)* y *Playtomic*.
  - Fichaje: *EA Sports FC Player Cards* (diseño de cartas de jugadores), *Sofascore* y *Falta Uno*.
  - Vitrina Comercial: *Topgolf / Complejos deportivos modernos* (Hero-Centric con valorización del tercer tiempo).

### Por qué
- Garantizar que la interfaz final compita con plataformas profesionales del sector deportivo amateur.
- Mantener la coherencia con los principios de simpleza y rendimiento sin dependencias innecesarias.

### Archivos afectados
- `Readme/Turnos Canchas/04 - Log Tecnico y Cambios.md`
- `Readme/Turnos Canchas/09 - Auditoria UI-UX - Frameworks Skills y Referencias.md` (nuevo)

### Testing
- Validación de consultas mediante el motor local de `ui-ux-pro-max` con Python (`search.py`).

---

## 2026-10-09 - Política Operativa - Chat Exclusivo de Documentación y Consultas

### Cambio
- Fijación de directriz explícita del usuario: *"Este chat solo será de documentación y consultas"*.
- Congelamiento definitivo de modificaciones de código en `TurnosCanchas/` dentro de este hilo de conversación.
- Enfoque exclusivo en:
  1. Redacción, profundización y estructuración de especificaciones en la bóveda de Obsidian.
  2. Resolución de dudas técnicas, arquitectónicas y de experiencia de usuario (UI/UX).
  3. Auditoría continua de decisiones de diseño y producto.

### Por qué
- Delimitar con absoluta claridad las fases de diseño conceptual/documentación de la fase de construcción de código.
- Garantizar que todo esté completamente cerrado, validado y auditado antes de programar.

### Archivos afectados
- `Readme/Turnos Canchas/02 - Prompt y Decisiones.md`
- `Readme/Turnos Canchas/04 - Log Tecnico y Cambios.md`

---

## 2026-10-16 - Resolución de Preguntas de Negocio y Configuración del Predio

### Cambio
- Validación y auditoría de los 7 parámetros de negocio y alcance del proyecto:
  - Nombre oficial del predio: **"La Bombonerita Fútbol Club"** (identidad deportiva de fantasía).
  - Ubicación de referencia: **Salta Capital (Zona Sur - Av. Ex Combatientes de Malvinas / Limache)**.
  - WhatsApp de contacto comercial: **`+54 387 4797240`**.
  - Alcance territorial: **Sede Central única**, con arquitectura extensible a multisede (`sede` field).
  - Recursos visuales: **Placeholders y gradientes modernos en CSS**, prescindiendo de imágenes pesadas.
  - Notificaciones diferidas para definición en Etapa 6.
  - Backlog priorizado inicial: **Modo Oscuro** y **QR de Cancha**.
- Actualización de `02 - Prompt y Decisiones.md`, `08 - Modulo Fichaje y Landing - Especificacion y Consultas.md` y artefacto `plan_proyecto_completo.md`.

### Por qué
- Dejar asentados los parámetros requeridos para la maquetación del Hero, navbar, enlaces de WhatsApp y visuales de la Landing comercial sin cabos sueltos antes del paso a código.

### Archivos afectados
- `Docs/02 - Prompt y Decisiones.md`
- `Docs/08 - Modulo Fichaje y Landing - Especificacion y Consultas.md`
- `Docs/04 - Log Tecnico y Cambios.md`
- `brain/plan_proyecto_completo.md`

---

## 2026-10-16 - Etapa 4 - Vitrina Comercial (Landing) & Navegación SPA

### Cambio
- Implementación de la barra de navegación fija superior (`position: sticky`) con identidad deportiva *"La Bombonerita FC"*, badge en vivo (`🟢 Abierto hoy`), enlaces con scroll suave y conmutador unificado **`[👤 Iniciar Sesión]`**.
- Sección Hero Banner de alto impacto visual con degradado radial verde césped/slate, tipografía *Barlow Condensed* y botones de acción rápida directos (Reservar, Fichajes y WhatsApp).
- Grilla responsiva de 6 instalaciones y servicios del predio con iconos y descripciones detalladas (Césped Sintético Pro, Iluminación LED Estadio, Vestuarios con agua caliente, Quinchos/Parrillas, Buffet con TV y Estacionamiento privado).
- Bloque destacado de valor social *"El Tercer Tiempo"* enfocado en el asado y la reserva de quinchos.
- Sección de ubicación institucional en Salta Capital (Limache) con enlace directo a Google Maps y horarios de atención.
- Botón flotante accesible de WhatsApp fijado en pantalla apuntando a `+54 387 4797240`.
- Sistema de *Scroll Spy* en JavaScript que detecta la posición de lectura y resalta automáticamente el enlace activo en la barra superior.
- Adaptación de inputs, selectores y tarjetas al tema oscuro deportivo.

### Por qué
- Transformar la aplicación en una plataforma web completa de fútbol amateur capaz de promocionar las instalaciones y atraer nuevos clientes las 24 hs.
- Optimizar el flujo de usuario permitiendo acceder a las reservas o al contacto comercial en un solo toque desde cualquier dispositivo móvil.

### Archivos afectados
- `public/index.html`
- `public/style.css`
- `public/app.js`
- `Docs/04 - Log Tecnico y Cambios.md`
- `Docs/03 - Etapas y Roadmap.md`

### Testing
- Verificación de entrega HTTP 200 en `http://localhost:3000`.
- Validación de navegación con scroll suave, enlaces de WhatsApp y carga de fuentes deportivas.

---

## 2026-10-16 - Pulido Visual Comercial de la Landing y Reservas

### Cambio
- Se reorganizó la portada con la cancha como foco visual, usando una ilustración SVG propia y una acción principal clara para iniciar la reserva.
- Se unificaron los tokens de color, superficies, tipografía, controles y estados con CSS nativo, conservando Barlow Condensed e Inter.
- Se actualizaron navegación, instalaciones, tercer tiempo, selección de cancha, formularios, contacto y administración para una lectura más clara en móvil y escritorio.
- Las tarjetas de cancha ahora se pueden seleccionar con teclado. Se quitaron accesos a Fichajes de la navegación mientras esa etapa siga sin implementar.
- Se creó `PRODUCT.md` para registrar el objetivo comercial y los límites actuales: persistencia local por navegador, sin disponibilidad compartida ni administración segura en servidor.

### Por qué
- Preparar una presentación comercial más clara antes de ampliar funcionalidades, sin añadir frameworks, dependencias ni build step.

### Archivos afectados
- `PRODUCT.md`
- `public/index.html`
- `public/style.css`
- `public/app.js`
- `Docs/04 - Log Tecnico y Cambios.md`

### Testing
- `node --check public/app.js` finalizó correctamente.
- Se ejecutó el detector de Impeccable y se corrigieron contrastes y patrones visuales identificados durante el pase.
- No se pudo hacer captura visual del navegador: el entorno bloqueó el acceso a páginas locales.

---

## 2026-10-16 - Restauración y pulido de identidad deportiva

### Cambio
- Se recuperó el tema oscuro deportivo documentado, con fondos grafito/azul noche, verde cancha y acento lima.
- Se mantuvo la cancha SVG como foco del hero y se añadió una aparición sutil de sus líneas, respetando `prefers-reduced-motion`.
- Se armonizaron las superficies de instalaciones, reservas, contacto y administración; se ajustaron contraste de botones, navegación y legibilidad móvil.
- Se simplificó el hero quitando el rótulo decorativo y se retiraron numeraciones e iconos emoji de acciones administrativas.
- El acceso de la barra quedó rotulado «Iniciar sesión», como indica la especificación; Fichajes continúa fuera de la navegación mientras siga pendiente.
- No se cambió la lógica de reservas, los datos ni el stack.

### Por qué
- Alinear la interfaz con la identidad visual aprobada y la documentación de diseño, sin incorporar dependencias ni ampliar el alcance funcional.

### Archivos afectados
- `public/index.html`
- `public/style.css`
- `Docs/04 - Log Tecnico y Cambios.md`

### Testing
- El detector mecánico de Impeccable señaló problemas de contraste y patrones visuales; se ajustaron los estados de botones, tarjetas, hero y textos señalados.
- No se ejecutaron pruebas funcionales ni revisión visual en navegador en esta pasada.

---
## Formato para Futuros Cambios
```
## YYYY-MM-DD - Etapa X - [Título]
### Cambio
- Qué se modificó
### Por qué
- Justificación
### Archivos afectados
- lista
### Testing
- Qué se probó
```

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 🚀 Hoja de Ruta: [[03 - Etapas y Roadmap]]
- 💡 Idea y Pilares: [[01 - Idea del Proyecto]]
- 📋 Fichaje y Landing: [[08 - Modulo Fichaje y Landing - Especificacion y Consultas]]

## 2026-10-16 - Inicio de sesión real y reservas por cuenta

### Cambio
- Se reemplazó el acceso simulado del cliente por registro, inicio/cierre de sesión, verificación de correo y recuperación de contraseña con Supabase Auth.
- «Mis reservas» solo se muestra a clientes autenticados; crear/cancelar reservas usa PostgreSQL compartido y políticas RLS por usuario/rol.
- La disponibilidad consultada por clientes expone únicamente cancha, fecha y hora ocupada.
- Se añadió el esquema SQL, archivo de configuración pública y guía de puesta en marcha. Las reservas locales antiguas no se importan automáticamente; se documentó la futura migración verificada.
- Se corrigieron enlaces UUID del panel y redirecciones de correo para volver a la ruta `/v1/`.

### Por qué
- Dar acceso real a cada cliente y compartir la disponibilidad de reservas entre dispositivos, manteniendo los datos personales protegidos por políticas del servidor.

### Archivos afectados
- `public/app.js`
- `public/index.html`
- `public/style.css`
- `public/supabase-config.js`
- `supabase/schema.sql`
- `Docs/15 - Autenticacion y Reservas por Cuenta.md`
- `Docs/00 - Hub Central del Proyecto.md`
- `PRODUCT.md`

### Testing
- No se ejecutaron pruebas. La conexión requiere credenciales del proyecto Supabase y aplicar el esquema SQL antes de poder comprobar el flujo real.

## 2026-10-16 - Alineación del roadmap comercial y arquitectura de Fichajes

### Cambio
- Se definió como arquitectura vigente Vanilla JS/CSS servido por Express, con Supabase/PostgreSQL para cuentas y datos compartidos. La posible migración React/Vite queda opcional y no bloquea Fichajes.
- Se ordenó el trabajo: configurar y verificar Supabase; compartir canchas y bloqueos; construir Fichajes multiusuario con permisos/RLS y consentimiento de contacto; revisar pruebas; dejar notificaciones y pagos para después.
- Se actualizó la especificación de Fichajes: la propuesta local IndexedDB/PIN es histórica; perfiles se administran por cuenta y avisos se vinculan a reservas futuras del capitán.
- Se revisó la guía de pruebas para incluir aislamiento entre cuentas y persistencia compartida. Se actualizaron referencias de login obsoletas en la guía de Etapa 4.
- Se conservó la nota original de alcance como historial y se aclaró que decisiones posteriores autorizan implementación.

### Por qué
- Resolver contradicciones entre el roadmap, las especificaciones locales y la auditoría React, y orientar Fichajes a una experiencia comercial compartida con privacidad y autoría.

### Archivos afectados
- `Docs/02 - Prompt y Decisiones.md`
- `Docs/03 - Etapas y Roadmap.md`
- `Docs/08 - Modulo Fichaje y Landing - Especificacion y Consultas.md`
- `Docs/09 - Auditoria UI-UX - Frameworks Skills y Referencias.md`
- `Docs/11 - Guia Test Etapa 4.md`
- `Docs/12 - Especificacion Etapa 5 - Modulo Fichaje.md`
- `Docs/13 - Guia Test Etapa 5.md`
- `Docs/14 - Auditoria de Nuevas Funcionalidades y Migracion a Stack Moderno.md`
- `Docs/15 - Autenticacion y Reservas por Cuenta.md`

### Testing
- Revisión documental de consistencia; no se ejecutaron pruebas de la aplicación.

## 2026-10-16 - Configuración del proyecto Supabase

### Cambio
- Se guardaron la URL del proyecto y la clave publishable en `public/supabase-config.js`.
- Se actualizó el estado de configuración en `PRODUCT.md` y en la guía de autenticación: resta ejecutar `supabase/schema.sql` en el SQL Editor del proyecto.

### Por qué
- Activar la conexión del frontend con el proyecto Supabase indicado por el usuario.

### Archivos afectados
- `public/supabase-config.js`
- `PRODUCT.md`
- `Docs/15 - Autenticacion y Reservas por Cuenta.md`
- `Docs/04 - Log Tecnico y Cambios.md`

### Testing
- No se ejecutaron pruebas ni llamadas a la base de datos. La clave publishable permite la conexión pública del frontend, pero no otorga permisos administrativos para crear el esquema.

## 2026-10-23 - Canchas y bloqueos compartidos en Supabase

### Cambio
- Se agregó la migración `002_shared_venue_configuration.sql` con tablas `fields` y `blocked_slots`, canchas base, RLS para lectura pública de canchas activas y escritura solo de administradores.
- Se agregó validación de reserva en PostgreSQL: el servidor toma nombre/complejo/precio vigentes y rechaza canchas inactivas o turnos bloqueados.
- La versión `public/` carga canchas desde Supabase y permite al administrador crear, editar, pausar y eliminar canchas y bloqueos en el backend compartido.
- Se mantuvieron intactos los datos locales anteriores; no se importan automáticamente. La guía explica cómo revisar y reingresar configuración personalizada.
- Se actualizaron PRODUCT y la guía de autenticación con el paso de aplicar la nueva migración.

### Por qué
- Compartir la misma disponibilidad entre clientes/dispositivos y hacer cumplir en base de datos los permisos y bloqueos, no solo en la interfaz.

### Archivos afectados
- `public/app.js`
- `supabase/migrations/002_shared_venue_configuration.sql`
- `Docs/15 - Autenticacion y Reservas por Cuenta.md`
- `PRODUCT.md`
- `Docs/04 - Log Tecnico y Cambios.md`

### Testing
- No se ejecutaron pruebas. La migración SQL 002 aún debe aplicarse en el proyecto Supabase.

## 2026-10-23 - Implementación de Fichajes

### Cambio
- Se añadió la migración `003_fichajes.sql` para perfiles deportivos, avisos urgentes y denuncias, con políticas RLS, controles de consentimiento y moderación.
- Se integró el catálogo responsive con filtros, perfil propio, estados activo/en pausa/fichado, enlace de contacto por WhatsApp, reportes y pizarra urgente.
- Los avisos se originan en una reserva futura propia; la base de datos copia los datos de cancha/horario y teléfono, y limita su vencimiento.
- Se incorporó una sección de moderación de perfiles, reportes y avisos al panel de administración.
- Editar los datos públicos de un perfil aprobado lo devuelve a revisión. Solo administración puede resolver reportes.
- Se separó la experiencia pública de Fichajes en `public/fichajes.html` y la ruta `/fichajes`; el inicio deja de cargar el catálogo y conserva la navegación a reservas. La sesión Supabase persiste y el retorno desde login lleva de nuevo a Fichajes.
- Se actualizó la guía de Etapa 5 para aplicar la migración y realizar validaciones entre cuentas.

### Archivos afectados
- `public/index.html`
- `public/fichajes.html`
- `public/app.js`
- `public/style.css`
- `server.js`
- `supabase/migrations/003_fichajes.sql`
- `Docs/03 - Etapas y Roadmap.md`
- `Docs/13 - Guia Test Etapa 5.md`
- `Docs/04 - Log Tecnico y Cambios.md`

### Testing
- No se ejecutaron pruebas. La migración 003 debe ejecutarse en Supabase y luego completarse la guía manual de Etapa 5 antes de declarar la etapa terminada.
## 2026-10-29 - Migración del panel administrativo a React y auditoría del bucle de acceso

### Cambio
- Se migró el panel administrativo desde Vanilla a React: resumen y agenda, listado/filtros/cancelación/exportación de reservas, alta/edición/pausa/eliminación de canchas, bloqueos y moderación de perfiles, denuncias y avisos de Fichajes.
- El estado admin ahora se deriva del perfil de Supabase dentro de la misma aplicación; se eliminó la redirección de React a `/v1/#admin`.
- Las entradas antiguas `/v1/#admin` y el enlace admin de la versión Vanilla se reenvían al panel React; `/v1` queda como respaldo para Fichajes.
- La URL `/login?...#admin` abre el formulario React; después de reconocer el perfil se normaliza la URL y se muestra el panel sin recargar la página.
- Se quitó la doble hidratación (`getSession` más `onAuthStateChange`) y se agregó presentación explícita del error cuando no se puede consultar el perfil.
- Se agregó `frontend/src/AdminPanel.jsx` y estilos responsive dedicados. No se cambiaron tablas ni políticas RLS.

### Auditoría del error
- La ruta observada `/login?redirectTo=%2Fv1%2F#admin` no estaba implementada; el servidor la resolvía al fallback React, que no entendía el retorno a `/v1`.
- El traspaso entre React y Vanilla compartía el almacenamiento local de Auth, pero `/v1` dependía de cargar Supabase desde jsDelivr y podía fallar al inicializar.
- `onAuthStateChange` y `getSession()` hidrataban al usuario en paralelo y podían repetir la navegación; errores al consultar `profiles` se ignoraban.
- Recomendación arquitectónica adoptada: mantener acceso y panel admin en React; conservar Vanilla solo temporalmente para Fichajes público hasta migrarlo.

### Archivos afectados
- `frontend/src/AdminPanel.jsx`
- `frontend/src/admin.css`
- `frontend/src/App.jsx`
- `PRODUCT.md`
- `Docs/03 - Etapas y Roadmap.md`
- `Docs/14 - Auditoria de Nuevas Funcionalidades y Migracion a Stack Moderno.md`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta.
- Pruebas manuales con cuenta admin/cliente y operaciones Supabase: pendientes. La pestaña de moderación requiere que la migración 003 esté aplicada.

## 2026-10-30 - Auditoría del stack y persistencia

### Cambio documental
- Se creó `Docs/16 - Auditoria de Tecnologias y Persistencia.md` con inventario de lenguajes, runtime, dependencias, capas de almacenamiento y tablas Supabase.
- Se enlazó la nota desde el grafo y la lista rápida de `Docs/00 - Hub Central del Proyecto.md` para encontrarla desde Obsidian.
- Se dejaron explícitos los pendientes de confirmar: migraciones Supabase 002/003, pruebas reales por rol y la dependencia Python auxiliar `python-docx`.

## 2026-10-30 - Migración pública de Fichajes a React

### Cambio
- Se creó `frontend/src/Fichajes.jsx` con catálogo, filtros, perfil propio, contacto por WhatsApp, reportes y pizarra urgente conectados al cliente Supabase y a la sesión React existente.
- `/fichajes` ahora resuelve a la app React tanto en Vite como en Express cuando existe una build; `/v1/fichajes.html` conserva el flujo Vanilla como respaldo.
- Se adaptó la navegación y los documentos de la bóveda para reflejar la nueva ruta y arquitectura.
- No se modificaron tablas ni políticas RLS.

### Verificación
- `npm run build`: compilación correcta.
- No se pudo comprobar la interfaz con servidor local: los puertos 5173 y 3000 no estaban disponibles durante la revisión.
- Pendiente ejecutar los casos manuales de `Docs/13`, en particular flujos reales de formularios y aislamiento RLS entre dos cuentas.

## 2026-11-13 - Cierre de Etapa 5 e inicio de Etapa 6

### Cambio
- El usuario confirmó que probó Fichajes, incluidas las pruebas entre cuentas; se marca Etapa 5 como completada en el roadmap y el Hub Central.
- Se inició la rama `feat/etapa6-notificaciones` para trabajar en notificaciones sin mezclar cambios con `main`.
- Se confirmó con el usuario que la acción de WhatsApp ya existe; no requiere trabajo adicional en esta etapa.
- Se actualizó Etapa 6: quedan pendientes recordatorios automáticos de 24 h y 2 h y el envío de confirmación por correo.

### Verificación
- No ejecutada en esta sesión.

## 2026-11-13 - Preparación de envío de correos de reservas

### Cambio
- Se agregó la migración `004_booking_email_notifications.sql`: crea una cola privada, genera confirmaciones y recordatorios de 24 h/2 h al reservar, elimina pendientes al cancelar y limita reintentos.
- Se creó la Edge Function `send-booking-emails` para enviar la cola mediante Resend, más un SQL separado para programarla con Supabase Cron y secretos en Vault.
- Se instaló Supabase CLI 3 como dependencia de desarrollo del proyecto.
- Se agregó la guía `Docs/17 - Configuracion de Correos Transaccionales.md` con despliegue y comprobaciones.

### Pendiente
- El usuario confirmó que aplicó la migración 004 y desplegó la función. Falta configurar el dominio y secretos de Resend, registrar los secretos internos en Vault, activar Cron y ejecutar las pruebas de entrega.

## 2026-11-13 - Perfil de usuario y acceso independiente

### Cambio
- Se agregó la ruta `/perfil` para consultar las reservas de la cuenta, mostrarlas como confirmadas y cancelarlas.
- Desde esa página, un jugador con perfil de Fichajes puede editar sus datos, cambiar su estado o eliminar el perfil. Si aún no tiene uno, puede ir a Fichajes para crearlo.
- Se convirtió `/login` en una página independiente con retorno al flujo de reserva o Fichajes; al entrar directamente, lleva al perfil.
- La selección de cancha se conserva al pedir login desde una reserva.

### Archivos afectados
- `frontend/src/App.jsx`
- `frontend/src/styles.css`

### Verificación
- `npm run build`: compilación correcta.
- La comprobación HTTP local no se completó porque el entorno bloqueó la conexión al servidor local. No se realizaron pruebas autenticadas con Supabase.

## 2026-11-13 - Menú hamburguesa para navegación móvil

### Cambio
- En pantallas de hasta 760 px, la navegación se presenta como un menú desplegable activado por un botón hamburguesa de 44 × 44 px.
- El botón informa su estado con `aria-expanded`, tiene nombre accesible y cambia a control de cierre. El menú también se cierra al elegir un enlace o pulsar Escape; al cerrarlo con Escape, el foco vuelve al botón.
- En escritorio se mantiene la navegación horizontal existente.

### Archivos afectados
- `frontend/src/App.jsx`
- `frontend/src/styles.css`

### Verificación
- `npm run build`: compilación correcta.
- Detector mecánico de Impeccable: sin hallazgos.
- No se verificó en un teléfono físico.

## 2026-11-13 - Reglas de ramas, documentación y aprobación Git

### Cambio
- Se creó `AGENTS.md` con las reglas persistentes de trabajo del repositorio.
- Se registró en `Docs/02 - Prompt y Decisiones.md` que las tareas específicas van en ramas y que cada cambio debe documentarse.
- Se estableció consultar por separado antes de cada commit y cada push; también se prohíbe descartar cambios existentes o guardar secretos en el repositorio.

### Archivos afectados
- `AGENTS.md`
- `Docs/02 - Prompt y Decisiones.md`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- Revisión documental de las reglas añadidas. No se hizo commit ni push.

## 2026-11-13 - Carga más rápida de Mi perfil

### Cambio
- `/perfil` inicia en paralelo las consultas de la cuenta, las reservas y el perfil de jugador, en vez de cargar el jugador después de terminar las otras consultas.
- `/login` mantiene su redirección sin hacer consultas de reservas ni de jugador que no necesita.
- Se quitó el enlace «Volver al inicio» de `/perfil`.

### Archivos afectados
- `frontend/src/App.jsx`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta.
- `git diff --check`: sin errores de formato.

## 2026-11-13 - Ajuste de proporciones en Mi perfil

### Cambio
- Se redujo la escala del título principal y de los títulos de sección para mejorar la jerarquía visual, especialmente en pantallas angostas.
- Se agregó espacio entre el encabezado de cuenta y la sección «Mis reservas» para que el divisor no quede pegado al siguiente bloque.
- No se modificó el contenido ni el comportamiento de la página.

### Archivos afectados
- `frontend/src/styles.css`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta.
- Detector de Impeccable con alcance de layout: sin hallazgos.
- No se pudo revisar una captura nueva en navegador ni en un teléfono físico.

## 2026-11-13 - Rediseño de Mi perfil basado en referencias Stitch

### Cambio
- Se tomó como referencia la pantalla web y móvil del proyecto Stitch «Panel de Perfil de Usuario».
- En escritorio, `/perfil` presenta la identidad de la cuenta, iniciales como avatar, el recuento real de reservas y las secciones de reservas y ficha de jugador en dos columnas.
- En móvil, las reservas y la ficha de jugador se alternan con un selector accesible de dos opciones.
- Se conservaron los datos y operaciones existentes; no se copiaron estadísticas de muestra. En ese momento no había soporte de imagen y el avatar mostraba iniciales; la carga se agregó después en la entrada «Carga de foto de perfil».

### Archivos afectados
- `frontend/src/App.jsx`
- `frontend/src/styles.css`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta; Vite mantiene el aviso de un chunk principal mayor a 500 kB.
- Detector de Impeccable con alcance de layout: sin hallazgos.
- `git diff --check`: sin errores de formato.
- No se verificó en navegador ni en un teléfono físico.

## 2026-11-13 - Carga de foto de perfil

### Cambio
- Se agregó a `/perfil` un control para seleccionar o reemplazar una foto JPG, PNG o WebP de hasta 5 MB, con estados de carga y mensajes accesibles.
- La imagen se guarda en un bucket privado de Supabase Storage; cada cuenta queda limitada a su propia carpeta mediante políticas RLS. La ruta se conserva en los metadatos de Supabase Auth y la vista usa una URL firmada temporal.
- Se agregó la migración `006_profile_photos.sql` (se eligió el número 006 porque ya existía una migración 005 pendiente en el árbol de trabajo). Hay que ejecutarla en el proyecto Supabase antes de que la carga esté disponible.

### Archivos afectados
- `frontend/src/App.jsx`
- `frontend/src/styles.css`
- `supabase/migrations/006_profile_photos.sql`
- `Docs/04 - Log Tecnico y Cambios.md`
- `Docs/15 - Autenticacion y Reservas por Cuenta.md`
- `Docs/16 - Auditoria de Tecnologias y Persistencia.md`

### Verificación
- `npm run build`: compilación correcta; Vite mantiene el aviso de un chunk principal mayor a 500 kB.
- Detector de Impeccable con alcance de layout: sin hallazgos.
- `git diff --check`: sin errores de formato.
- Pendiente aplicar la migración en Supabase y probar la subida, lectura y reemplazo con una cuenta autenticada.

## 2026-11-20 - Limpieza de avisos GSAP y Supabase Auth

### Cambio
- Se comparte la instancia React de Supabase en `window` para que el doble montaje de desarrollo con `React.StrictMode` no cree clientes GoTrue concurrentes.
- Se limita la inicialización de animaciones GSAP a la portada, donde existen sus elementos y el contexto de animación.

### Archivos afectados
- `frontend/src/App.jsx`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta; Vite mantiene el aviso de un chunk principal mayor a 500 kB.
- `git diff --check`: sin errores de formato.
- Los avisos de consola reportados por el usuario no se han vuelto a comprobar en su navegador.

## 2026-11-20 - Corrección de permisos de lectura pública en Fichajes

### Diagnóstico y cambio
- La migración 003 otorga al rol `anon` solo columnas públicas de `player_profiles`; no otorga `status` ni `moderation_status`, lo cual es correcto para no exponer datos internos.
- La política de lectura pública de `player_profile_reviews` en la migración 005 consultaba esas dos columnas directamente desde una subconsulta. Al cargar opiniones como usuario no autenticado, Postgres podía rechazar la consulta por permisos y la interfaz mostraba «Fichajes todavía no está disponible».
- Se reemplazó esa comprobación por `public.is_public_player_profile(uuid)`, una función `SECURITY DEFINER` estable, con `search_path` vacío, sin permiso de ejecución para `PUBLIC` y con resultado booleano solamente. Los roles `anon` y `authenticated` reciben ejecución explícita.
- Se actualizó la migración 005 para instalaciones nuevas y se agregó la migración 007 como reparación para instalaciones donde la 005 ya fue aplicada. La 007 recarga el caché de esquema de PostgREST.

### Archivos afectados
- `supabase/migrations/005_fichajes_perfiles_ampliados.sql`
- `supabase/migrations/007_fix_fichajes_public_reviews_policy.sql`
- `Docs/12 - Especificacion Etapa 5 - Modulo Fichaje.md`
- `Docs/13 - Guia Test Etapa 5.md`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta; Vite mantiene el aviso de un chunk principal mayor a 500 kB.
- `git diff --check`: sin errores de formato.
- Revisión estática de la política, función y grants en las migraciones 003, 005 y 007.
- Las migraciones no se aplicaron al proyecto remoto. La consulta pública con `anon` todavía debe verificarse en Supabase.

## 2026-11-13 - Perfiles ampliados de Fichajes

### Cambio
- Se agregó el detalle de perfil con calificación promedio, opiniones, galería de fotos, presentación, enlaces a videos y redes y acceso al contacto.
- Se amplió el formulario de Fichajes con foto de perfil y cuerpo completo (JPG, PNG o WebP, hasta 5 MB), video y enlaces de Instagram/TikTok.
- Las opiniones requieren correo verificado, permiten una calificación y comentario editables por cuenta y perfil, y no admiten autoevaluaciones.
- La migración `005_fichajes_perfiles_ampliados.sql` crea campos, tabla, controles RLS y bucket de fotos públicas con escritura limitada a la carpeta de cada cuenta. Los enlaces se validan tanto en la interfaz como en PostgreSQL.
- Las fotos/enlaces modificados devuelven el perfil a revisión; el detalle público solo muestra perfiles activos y aprobados.

### Archivos afectados
- `frontend/src/Fichajes.jsx`
- `frontend/src/fichajes.css`
- `supabase/migrations/005_fichajes_perfiles_ampliados.sql`
- `Docs/12 - Especificacion Etapa 5 - Modulo Fichaje.md`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta; Vite informa que el chunk JavaScript principal supera 500 kB.
- La migración no se aplicó a Supabase y no se verificaron cargas, RLS ni opiniones con cuentas reales.

## 2026-11-20 - Selector de estrellas en opiniones de Fichajes

### Cambio
- Se reemplazó el desplegable de calificación por cinco radios nativos presentados como estrellas.
- La selección conserva el valor entero de 1 a 5 y anuncia el puntaje en texto; cada opción tiene nombre accesible y las flechas del teclado funcionan con el comportamiento nativo del grupo.
- Se respetan el foco visible, el área táctil de 48 px y la preferencia de movimiento reducido; no se agregaron dependencias.

### Archivos afectados
- `frontend/src/Fichajes.jsx`
- `frontend/src/fichajes.css`
- `Docs/12 - Especificacion Etapa 5 - Modulo Fichaje.md`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta; Vite conserva el aviso de un chunk JavaScript principal mayor a 500 kB.
- `git diff --check`: sin errores de formato.
- Detector de Impeccable sobre `Fichajes.jsx` y `fichajes.css`: sin hallazgos.
- No se realizaron pruebas interactivas con teclado ni lector de pantalla.

## 2026-11-20 - Mensajes visibles al publicar opiniones en Fichajes

### Cambio
- El resultado de publicar una opinión ahora se muestra dentro del formulario del perfil, donde no queda tapado por el diálogo.
- Se agregó manejo de errores de Supabase y de excepciones de red con mensajes de recuperación; `finally` siempre libera el estado de carga para permitir reintentar.
- La guía de Fichajes incluye casos para publicación exitosa y errores de verificación/conexión.

### Archivos afectados
- `frontend/src/Fichajes.jsx`
- `frontend/src/fichajes.css`
- `Docs/13 - Guia Test Etapa 5.md`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta; Vite conserva el aviso de un chunk JavaScript principal mayor a 500 kB.
- `git diff --check`: sin errores de formato.
- Detector de Impeccable sobre `Fichajes.jsx` y `fichajes.css`: sin hallazgos.
- No se verificó el guardado contra el proyecto remoto de Supabase.

## 2026-11-20 - Ajuste de permisos al publicar opiniones de Fichajes

### Cambio
- Se corrigió el guardado que fallaba con `42501` porque PostgREST/Supabase pedía permiso global `UPDATE` al usar `upsert`, mientras la política SQL limita la actualización a las columnas `stars`, `comment` y `updated_at`.
- La interfaz ahora inserta una opinión nueva o actualiza la opinión propia existente por separado, conservando los grants por columna y RLS; no se amplió el permiso global sobre la tabla.
- Se agregó el caso de prueba para publicar y luego editar una opinión desde la misma cuenta.

### Archivos afectados
- `frontend/src/Fichajes.jsx`
- `Docs/13 - Guia Test Etapa 5.md`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta; Vite conserva el aviso de un chunk JavaScript principal mayor a 500 kB.
- `git diff --check`: sin errores de formato.
- No se probó contra Supabase remoto.

## 2026-11-20 - Directorio de salida para Vercel

### Cambio
- Se configuró Vercel para publicar `frontend/dist`, que es donde Vite genera la compilación al ejecutarse desde la raíz del repositorio.
- Esto corrige el error de despliegue que buscaba `dist` en la raíz y no encontraba la salida del build.

### Archivos afectados
- `vercel.json`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta; se confirmó `frontend/dist/index.html`. Vite mantiene el aviso del chunk JavaScript mayor a 500 kB.
- `git diff --check`: sin errores de formato.
- No se ejecutó un despliegue de Vercel.

## 2026-11-20 - Alineación del build con el directorio de Vercel

### Cambio
- Vite genera la compilación en `dist/` en la raíz, que es el directorio configurado para Vercel.
- Express sirve esa misma salida cuando existe; `/v1` y los archivos públicos mantienen su ruta.
- Se ignora `dist/` generado en la raíz para no versionar artefactos de build.

### Archivos afectados
- `vite.config.js`
- `server.js`
- `.gitignore`
- `vercel.json`
- `Docs/14 - Auditoria de Nuevas Funcionalidades y Migracion a Stack Moderno.md`
- `Docs/16 - Auditoria de Tecnologias y Persistencia.md`
- `Docs/04 - Log Tecnico y Cambios.md`

### Verificación
- `npm run build`: compilación correcta; se confirmó `dist/index.html` en la raíz.
- `git diff --check`: sin errores de formato.
- Vite mantiene el aviso de chunk JavaScript mayor a 500 kB.
- No se ejecutó un despliegue de Vercel.

