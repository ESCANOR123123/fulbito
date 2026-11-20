# Guía de Test Rápido - Etapa 5: Módulo de Fichaje y Pizarra de Urgencias

> **Guía de Aseguramiento de Calidad y Pruebas para la Etapa 5.**
> Entorno: `http://localhost:3000/fichajes` con proyecto Supabase configurado.
> Componentes auditados: Carga de CV deportivo, filtros, permisos por cuenta, pizarra urgente, consentimiento de contacto y enlaces a WhatsApp.

> **Revisión requerida antes de ejecutar:** Los casos basados en IndexedDB local, PIN y apertura `file://` son históricos y quedan reemplazados por pruebas multiusuario con Supabase/RLS. Agregar casos para aislamiento entre cuentas, autoría de perfiles/avisos, expiración en base de datos, consentimiento del teléfono y asociación del aviso a una reserva propia confirmada.

---

## Cómo Probar
1. La migración 003 ya fue aplicada (confirmado por el usuario). Aplicar también `005_fichajes_perfiles_ampliados.sql` y luego `007_fix_fichajes_public_reviews_policy.sql` en el SQL Editor. La 007 reemplaza la política de lectura pública de opiniones para que no consulte directamente columnas de moderación vedadas al rol `anon`.
2. Verificar que la cuenta de administración tenga rol `admin` en `public.profiles`.
3. En desarrollo, iniciar con `npm run dev` y abrir la URL que muestre Vite (por defecto `http://localhost:5173/fichajes`). En local integrado, ejecutar `npm run build`, luego `npm start` y abrir `http://localhost:3000/fichajes`.
4. Confirmar que aparece la página React con el catálogo de jugadores y la pizarra de avisos. `/v1/fichajes.html` conserva la versión Vanilla de respaldo.

La migración 003 y el panel de moderación se confirmaron listos el 2026-10-30. No marcar la etapa como completa hasta ejecutar los casos de esta guía con al menos dos cuentas distintas y verificar permisos RLS. Para verificar la lectura pública, abrir `/fichajes` sin iniciar sesión: deben cargar los perfiles aprobados y sus opiniones sin errores `42501` en consola. Los perfiles suspendidos, pendientes o sin consentimiento no deben publicar opiniones visibles.

---

## Casos de Prueba (Happy Path Etapa 5)

| # | Acción | Resultado Esperado |
|---|--------|-------------------|
| **1** | Clic en `[+ Cargar mi CV Deportivo]` | Se despliega el modal accesible con el formulario de datos del jugador. |
| **2** | Con sesión, completar el perfil (Nombre: "Nico 'Rifle'", WhatsApp, Posición: Delantero, Pierna: Diestro, Nivel: Intermedio, consentimiento explícito de contacto) | El CV se guarda en Supabase y aparece públicamente solo tras quedar activo/aprobado. |
| **3** | Clic en filtro `[🧤 Arquero]` en la barra de chips | La vista se actualiza en tiempo real mostrando únicamente cartas de arqueros (o estado vacío amigable si no hay ninguno). |
| **4** | Clic en filtro `[Todos]` | Se restablece la lista completa de jugadores disponibles. |
| **5** | Clic en botón `[⚡ Fichar por WhatsApp]` de una carta | Abre una nueva pestaña de WhatsApp con la URL codificada: *"¡Hola [Nombre]! Vi tu CV en La Bombonerita FC. Estamos buscando un [Posición] para jugar hoy. ¿Te sumás?"*. |
| **6** | Con la cuenta autora, abrir `[Gestionar mi CV]` | Permite editar, pausar o eliminar el perfil propio; otra cuenta no puede modificarlo. |
| **7** | Cambiar estado a "En Pausa" y consultar desde otra sesión | El perfil desaparece del catálogo público y el cambio persiste en Supabase. |
| **8** | Clic en `[+ Publicar Aviso Urgente]` con una reserva futura propia | Se abre formulario rápido con cancha, fecha y hora precargadas desde esa reserva. |
| **9** | Publicar aviso: *"Falta 1 para hoy 21:00 hs"* | El aviso aparece destacado con estilo visual de urgencia en la parte superior del módulo. |
| **10** | Clic en `[🙋 Postularme como Refuerzo]` en el aviso urgente | Abre WhatsApp hacia el número del capitán con el mensaje: *"¡Hola! Vi en la pizarra de La Bombonerita que te falta un jugador para las 21:00... ¿Sigue libre el lugar?"*. |
| **11** | Con una cuenta verificada, abrir un perfil ajeno, elegir estrellas y publicar un comentario de 10 a 500 caracteres | El botón muestra el estado de envío y luego aparece una confirmación visible dentro del perfil; la opinión y el promedio se actualizan. Al reabrir el perfil, la opinión permanece guardada. |

---

## Casos Edge, Validaciones y Seguridad de Cuenta

| # | Acción | Resultado Esperado |
|---|--------|-------------------|
| **E1** | Intentar guardar CV con teléfono argentino no válido (ej. `123456`) | El input resalta en rojo (`.is-invalid`), muestra mensaje de ayuda y bloquea el envío. |
| **E2** | Intentar enviar CV sin seleccionar ningún día de disponibilidad | Advertencia visual indicando que se debe seleccionar al menos un día. |
| **E3** | Intentar editar el CV de otra cuenta mediante una petición directa | RLS deniega la operación aunque se evite la interfaz. |
| **E4** | Exceder los 140 caracteres en la biografía deportiva | El contador visual advierte del límite y el textarea restringe caracteres extra (`maxlength="140"`). |
| **E5** | Aviso urgente cuyo horario de partido ya pasó (expiración TTL) | El sistema filtra y no muestra avisos vencidos de forma automática. |
| **E6** | Consultar desde otro navegador/dispositivo con cuentas distintas | Los datos aprobados se comparten; cada cuenta solo administra sus propios perfiles/avisos. |
| **E7** | Intentar publicar opinión con correo sin verificar o forzar un error de Supabase | Aparece un mensaje visible junto al formulario dentro del perfil y el botón deja el estado de carga para permitir corregir o reintentar. |
| **E8** | Publicar la primera opinión y luego editarla desde la misma cuenta | La primera operación inserta; la siguiente actualiza solo estrellas y comentario, sin requerir un permiso global de `UPDATE` sobre la tabla. |

---

## Checklist Visual y UX (Auditoría con ui-ux-pro-max & Impeccable)

- [ ] **Player Cards (FUT Style)**:
  - 🧤 Arquero: Borde y acento azul cielo (`#0284c7`).
  - 🛡️ Defensor: Borde y acento verde esmeralda (`#059669`).
  - ⚙️ Mediocampista: Borde y acento ámbar/dorado (`#d97706`).
  - ⚡ Delantero: Borde y acento rojo carmesí (`#dc2626`).
- [ ] **Badge de Nivel**: Colores semáforo inequívocos (Verde = Recreativo, Amarillo = Intermedio, Rojo = Competitivo).
- [ ] **Chip Filters**: Filtros de una sola línea con desplazamiento táctil horizontal en móviles.
- [ ] **Estados Vacíos**: Ilustración o mensaje amigable cuando ningún jugador coincide con el filtro seleccionado (*"No hay jugadores con este perfil por el momento. ¡Sé el primero en postularte!"*).
- [ ] **Touch Targets**: Todos los botones de acción (`Fichar`, `Gestionar`, `Postularme`) con altura mínima de 48px.

---

## Métricas de Éxito de la Etapa 5
- [ ] Cero recargas de página en todo el flujo de búsqueda, filtrado y postulación.
- [ ] Persistencia compartida en Supabase, con políticas RLS comprobadas entre cuentas.
- [ ] Tiempo de filtrado en vivo imperceptible (<10ms).
- [ ] Cero dependencias externas npm (puro JavaScript nativo y CSS moderno).

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 🚀 Hoja de Ruta: [[03 - Etapas y Roadmap]]
- 📋 Especificación Etapa 5: [[12 - Especificacion Etapa 5 - Modulo Fichaje]]
- 🧪 Test Anterior (Etapa 4): [[11 - Guia Test Etapa 4]]
- 📜 Registro Técnico: [[04 - Log Tecnico y Cambios]]
