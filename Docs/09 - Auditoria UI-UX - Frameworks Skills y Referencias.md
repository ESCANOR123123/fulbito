# Auditoría de UI/UX: Frameworks, Skills Instaladas y Referencias

## 1. Auditoría de Skills Instaladas: ¿Cuáles son las mejores para este proyecto?

Se auditaron las habilidades configuradas en el entorno local. La combinación óptima para este proyecto es la siguiente:

| Skill | Rol en el Proyecto | Calificación | Justificación |
|---|---|:---:|---|
| **`ui-ux-pro-max`** | **Motor de Diseño UI/UX** | ⭐⭐⭐⭐⭐ (Core) | Contiene 192 paletas de producto, 119 reglas de UX móvil, 74 font pairings y patrones deportivos (*Hero-Centric*, tarjetas de jugadores, filtros con *chip wrap*, contrastes WCAG AA y touch targets mínimos de 48px). |
| **`impeccable`** | **Refinamiento & Pulido Visual** | ⭐⭐⭐⭐⭐ (Core) | Especializada en elevar el diseño visual: jerarquía tipográfica, microinteracciones, diseño de estados vacíos y feedback visual sin sobrecargar el DOM. |
| **`ponytail` / `ponytail-audit`** | **Guardián de Simplicidad (Anti-Bloat)** | ⭐⭐⭐⭐⭐ (Core) | Protege el ADN del proyecto: cero dependencias innecesarias, máxima velocidad de carga (<150ms), sin build step obligatorio y uso inteligente de APIs nativas de CSS y JavaScript. |
| **`design-system`** | **Arquitectura de Tokens** | ⭐⭐⭐⭐ (Recomendada) | Centraliza tokens CSS en 3 capas (primitivos, semánticos y componentes) para asegurar coherencia entre la Landing comercial, el Turnero y el Módulo de Fichajes. |
| **`design` & `banner-design`** | **Diseño Gráfico & Hero Assets** | ⭐⭐⭐⭐ (Recomendada) | Generación y maquetación de banners de alta conversión para el predio (instalaciones, parrillas, torneos, sponsors). |
| **`generative_ui`** | **Mockups Interactivos** | ⭐⭐⭐ (Complementaria) | Permite previsualizar componentes ricos (como la tarjeta interactiva de jugador FUT) antes de fusionarla al código productivo. |

---

## 2. Auditoría y Comparativa de Frameworks

### 2.1. Nivel CSS: ¿Qué utilizar para el diseño visual?

| Opción | Ventajas | Desventajas | Veredicto |
|---|---|---|:---:|
| **Modern Vanilla CSS + Design Tokens** (Actual) | Cero dependencias, 0 KB extra de librerías, sin build step, control absoluto del código, carga ultra veloz. | Se escribe CSS a mano (aunque con variables y CSS Grid es muy rápido). | **RECOMENDADO (Estrategia Ponytail)** |
| **Tailwind CSS (v3 / v4)** | Clases utilitarias rápidas, gran ecosistema de componentes. | Requiere compilador CLI o CDN pesado en desarrollo. Rompe el principio de cero build step si no se compila. | **Alternativa Viable (si se requiere velocidad de maquetado)** |
| **PicoCSS / Bulma** | Estilos semánticos listos para usar en HTML puro. | Difícil de personalizar para la estética deportiva moderna (tarjetas tipo FIFA / cartas de jugadores). | No recomendado para este caso de uso |

### 2.2. Nivel JavaScript: ¿Qué utilizar para la interactividad?

| Opción | Evaluación |
|---|---|
| **Vanilla JS Modular (Actual)** | **IDEAL**. Perfecto para el turnero y los filtros de fichajes. Cero npm, corre directo en cualquier navegador, sin bundlers ni transpiladores. |
| **Alpine.js** (CDN ~10 KB) | **OPCIONAL EXCELENTE**. Si el formulario de CV deportivo y los filtros dinámicos crecen mucho, Alpine permite reactividad declarativa (`x-data`, `x-for`, `x-model`) en un simple `<script src="...">` sin Node build. |
| **React / Next.js / Angular** | No es requisito inmediato. Añade compilación y una migración; reevaluar si la complejidad real de interfaz/estado lo justifica. |

---

## 3. Páginas y Plataformas de Referencia (Benchmarks de UI/UX)

Para alcanzar un nivel profesional y competitivo, se toman las siguientes referencias del mercado real:

### 3.1. Referentes para el Motor de Reservas de Canchas
1. **Alquilatucancha (ATC)** (`alquilatucancha.com` - Argentina / Latam):
   - *Patrón a replicar*: Selector horizontal de días con fecha visible, badges de superficie (F5, F7, Sintético/Natural), selector de horarios en bloques limpios y confirmación móvil inmediata.
2. **Playtomic** (`playtomic.io` - Global):
   - *Patrón a replicar*: Flujo mobile-first impecable, nivelación deportiva y partidos comunitarios abiertos.
3. **Fútbol Ya / HoySeJuega**:
   - *Patrón a replicar*: Búsqueda rápida por sede y visualización clara de precios por hora.

### 3.2. Referentes para el Módulo de "Fichaje" (Mercado de Jugadores)
1. **EA Sports FC / FIFA Ultimate Team (FUT Cards)**:
   - *Patrón visual a replicar*: El diseño de **Player Cards** (tarjetas coleccionables de jugador). Muestra la posición destacada en grande (🧤 ARQ, 🛡️ DEF, ⚙️ MED, ⚡ DEL), pierna hábil, nivel y badge de disponibilidad. Esto convierte un simple listado aburrido en una experiencia atractiva y gamificada.
2. **Sofascore / BeSoccer**:
   - *Patrón a replicar*: Fichas de perfil con contrastes deportivos claros, etiquetas de características clave y legibilidad rápida para capitanes apurados.
3. **Falta Uno / Grupos de Comunidad WhatsApp**:
   - *Patrón de flujo a replicar*: La inmediatez. No pedir registro con contraseña para hablar; el botón debe abrir directamente WhatsApp con el mensaje predeterminado listo para enviar.

### 3.3. Referentes para la Vitrina Comercial / Landing del Complejo
1. **Topgolf & Brooklyn Boulders** (Complejos Deportivos Internacionales):
   - *Patrón a replicar*: Hero inmersivo, sección visual de "Instalaciones de Primer Nivel" y valorización del "Tercer Tiempo" (buffet, parrillas y asado post-partido como factor diferenciador).
2. **Dribbble / Land-book (Tags: *Sports Turf, Football Club Landing*)**:
   - *Paleta deportiva recomendada (validada con `ui-ux-pro-max`)*:
     - Fondo primario: Verde Césped Profundo (`#15803d` / `#166534`) combinado con fondos oscuros deportivos (`#0f172a`).
     - Acentos de acción (CTAs): Verde Lima Eléctrico (`#84cc16`) o Dorado Campeonato (`#eab308`).
     - Tipografía atlética: **Barlow Condensed** para encabezados con impacto deportivo y **Inter / Roboto** para textos de lectura.

---

## 4. Conclusiones y Plan de Acción
1. **Identidad UI**: Adoptar el patrón **Hero-Centric** para la vitrina comercial y el patrón **Player Cards** para los fichajes.
2. **Stack Recomendado**: Mantener **Vanilla CSS con Design Tokens + Vanilla JS** (con opción a **Alpine.js** si se desea reactividad declarativa sin build step).
3. **Skills Clave a Activar**:
   - `ui-ux-pro-max` para tokens, paletas deportivas y reglas de accesibilidad móvil.
   - `impeccable` para el pulido de microinteracciones, sombras y transiciones.
   - `ponytail` para auditar y prevenir código innecesario.

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 💡 Idea y Pilares: [[01 - Idea del Proyecto]]
- 📋 Fichaje y Landing: [[08 - Modulo Fichaje y Landing - Especificacion y Consultas]]
- 📜 Registro Técnico: [[04 - Log Tecnico y Cambios]]
