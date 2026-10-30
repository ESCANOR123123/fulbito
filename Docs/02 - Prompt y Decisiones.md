# Prompt Original

## Solicitud del Usuario
> "Necesito que me desarrolles una idea y un promt. El proyecto va a hacer un turno para canchas de futbol. Primero sera secuencial, iremos por etapas. Todo el proyecto se auditara, explicara y se contemplara las modificaciones en esta carpeta C:\Users\Usuario\Desktop\IITA\Proyecto final\Readme\Turnos Canchas, es una boveda de obsidian. Necesito que no hay sobreingenieria y los primeros archvios que sea app.js, style.css y index.html"

## Interpretación del Prompt
1. **Producto**: Sistema de turnos/reservas para canchas de fútbol
2. **Metodología**: Desarrollo por etapas (secuencial), cada etapa auditable
3. **Documentación**: Todo en bóveda Obsidian en la ruta especificada
4. **Restricción técnica**: No over-engineering, empezar simple
5. **Stack inicial**: Solo 3 archivos - `index.html`, `style.css`, `app.js` (vanilla)

## Decisiones Tomadas Basadas en el Prompt

| Decisión | Justificación |
|----------|---------------|
| Vanilla JS (sin framework) | "No sobreingeniería", cero dependencias |
| localStorage | Funciona sin backend, offline-first |
| Mobile-first CSS | Uso real es en celular |
| 4 canchas hardcodeadas | MVP, datos quemados por simplicidad |
| 14 franjas horarias fijas | 9:00 a 22:00, estándar canchas |
| Sin build step | Abrir index.html y funciona |

## Próximas Etapas Planificadas (Sequential)
1. **Etapa 1** ✅ - MVP funcional (archivos base creados)
2. **Etapa 2** ✅ - Persistencia real e IndexedDB, regex teléfono, toasts y modales
3. **Etapa 3** ✅ - Panel admin (gestión canchas, horarios, bloqueo de franjas, CSV)
4. **Etapa 4** (Nueva) - Servidor Express y Vitrina Comercial (Publicidad del Complejo)
5. **Etapa 5** (Nueva) - Módulo "Fichaje" (Bolsa de Jugadores libres y Mercado de Refuerzos)
6. **Etapa 6** - Notificaciones y Recordatorios (WhatsApp / Email)
7. **Etapa 7** - Pagos / Señas online (MercadoPago)

---

## Solicitud de Extensión (Fase 2 - Comunidad y Publicidad)

### Solicitud del Usuario
> "Hagamos que sea una pagina web donde se publicite la cancha, tambien haya un apartado para reservar canchas y un nuevo apartado llamado 'Fichaje' donde jugadores puedan subir sus cv y equipos puedan fichar a estos jugadores si les falta. Documenta esta idea, explayala y documenta todo, realizala las preguntas necesarias y auditalas en la documentacion. Por ahora nada de codigo, solo documentacion y consultas para pasar despues"

### Interpretación y Decisiones
1. **Pivote de Producto**: De un simple turnero a una **Plataforma Integral de Fútbol Amateur y Comunidad**.
2. **Tres Secciones Principales en Frontend**:
   - **Inicio / Publicidad**: Presentación del predio, instalaciones, servicios, fotos, horarios y mapa.
   - **Reservas**: El motor de turnos existente (con sus filtros y panel admin).
   - **Fichaje**: Catálogo de jugadores disponibles con filtros por posición/nivel y formulario de carga de CV deportivo.
3. **Directriz Operativa**: **Cero código por ahora**; enfoque 100% en definición conceptual, especificación técnica, preguntas de negocio y arquitectura en la bóveda de Obsidian.

---

## Respuestas de Negocio y Configuración Acordadas (Octubre 2026)

Tras la consulta directa con el usuario para definir los parámetros de la vitrina comercial y el sistema, se acordaron las siguientes definiciones:

| Identificador | Variable / Pregunta | Definición Acordada | Detalle / Justificación |
|---|---|---|---|
| **Q1** | **Nombre del Predio** | **"Complejo Deportivo La Bombonerita Fútbol Club"** (Fantasía) | Nombre temático y futbolero con identidad de club amateur de primer nivel. |
| **Q2** | **Ubicación / Zona** | **Salta Capital, Argentina (Zona Sur - Av. Ex Combatientes de Malvinas / Limache)** | Zona de referencia coherente con el prefijo telefónico (+54 387). Fácil acceso y espacio para predio deportivo. |
| **Q3** | **WhatsApp de Contacto** | **`+54 387 4797240`** | Número oficial del complejo para el botón flotante de WhatsApp y consultas de reservas/eventos. |
| **Q4** | **Sede / Escalabilidad** | **Sede única inicial ("Sede Central"), preparada para multisede** | Mantiene la arquitectura simple (sin sobreingeniería) pero con el campo `sede: "central"` en la estructura de datos para escalar sin refactor. |
| **Q5** | **Recursos Gráficos (Landing)** | **Placeholders modernos + gradientes CSS + iconos deportivos** | Cero dependencia de assets externos pesados; estética limpia y ultra liviana con CSS moderno. |
| **Q6** | **Estrategia de Notificaciones** | **Decisión diferida a Etapa 6** | No adelantar decisiones técnicas innecesarias antes de que la funcionalidad de turnos y fichajes esté completada (filosofía *ponytail*). |
| **Q8** | **Acceso de Administración / Cuenta** | **Botón "Iniciar Sesión" en la barra de navegación** | Sustituye el botón directo de "Admin" por un acceso más profesional y unificado de Login ("Iniciar Sesión" / "Mi Cuenta") accesible tanto para el dueño/administrador como para jugadores. |

---

## Directriz de Alcance del Chat (Restablecida - 2026-10-16)
> "No quiero que hagas el codigo, Solo audita todo"

- **Política Estricta y Definitiva**: Este chat es **exclusiva y únicamente de auditoría, consultoría, diseño conceptual y documentación** en la bóveda de Obsidian (`Docs/`).
- **Prohibición Total de Código**: No se generará código, no se ejecutarán builds, no se correrán comandos de terminal ni se modificarán archivos ejecutables del proyecto.
- **Enfoque Único**:
  1. Análisis profundo de viabilidad, pros, contras y riesgos.
  2. Comparativas arquitectónicas y benchmark de mercado.
  3. Redacción de especificaciones, flujos de usuario y diseño de esquemas en Obsidian.
  4. Consultoría técnica paso a paso para que el usuario tome decisiones antes de cualquier futuro paso de desarrollo.

> **Actualización posterior:** Esta directriz documenta el alcance de la etapa inicial de auditoría. Luego el usuario autorizó cambios de implementación para autenticación/reservas y ahora continúa con el plan comercial. La decisión vigente de stack y secuencia está en [[03 - Etapas y Roadmap]]; esta nota conserva el historial, no restringe el trabajo autorizado posteriormente.

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 💡 Idea y Pilares: [[01 - Idea del Proyecto]]
- 📜 Registro Técnico: [[04 - Log Tecnico y Cambios]]
