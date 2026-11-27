# Especificación Detallada: Etapa 4 - Vitrina Comercial (Landing)

> **Documento de especificación técnica y funcional para la Etapa 4.**
> Contexto: Plataforma web para "La Bombonerita Fútbol Club" (Salta Capital).
> Principio: Vanilla HTML5/CSS3/JS, mobile-first, cero dependencias externas pesadas.

---

## 1. Objetivo de la Etapa
Transformar la aplicación en una **Single Page Application (SPA)** integral donde la pantalla de bienvenida sea una vitrina comercial de alto impacto que promocione las instalaciones del predio, ofrezca acceso inmediato al motor de reservas y al mercado de fichajes, e incluya un canal directo de atención vía WhatsApp.

---

## 2. Estructura de Navegación SPA

### 2.1. Barra de Navegación Fija (`<nav class="main-nav">`)
- **Posición**: Fija superior (`position: sticky; top: 0; z-index: 100`).
- **Identidad**: Logo / Nombre *"La Bombonerita FC"* con badge de estado en vivo: `🟢 Abierto hoy (09:00 - 00:00)`.
- **Enlaces de navegación rápida (con scroll suave)**:
  1. `[🏟️ Complejo]` -> ancla `#complejo` (Hero + video del predio).
  2. `[🔥 Quincho]` -> ancla `#tercer-tiempo` (foto del quincho y consulta por WhatsApp).
  3. `[⚽ Reservas]` -> ancla `#reservas` (Catálogo de canchas y selector de turnos).
  4. `[📋 Fichajes]` -> ancla `#fichajes` (CV Deportivo y Mercado de Jugadores).
  5. `[📍 Ubicación]` -> ancla `#ubicacion`.
  6. `[👤 Iniciar Sesión]` -> conmutador a formulario de acceso (Login modal o vista de autenticación para Dueño/Admin y Jugador/Capitán).
- **Comportamiento en Móvil**:
  - Píldoras compactas horizontales con `overflow-x: auto; -webkit-overflow-scrolling: touch;`.
  - Resaltado automático de la sección activa mediante `IntersectionObserver`.

---

## 3. Bloques de la Vitrina Comercial

### 3.1. Hero Banner Principal (`#hero`)
- **Impacto Visual**:
  - Fondo deportivo oscuro con gradientes profundos en verde césped (`#0f172a` hacia `#14532d`).
  - Tipografía atlética display: **Barlow Condensed** en mayúsculas con tracking ajustado.
- **Titulares**:
  - Título Principal: *"VIVÍ EL MEJOR FÚTBOL EN LA BOMBONERITA"*
  - Subtítulo: *"Césped profesional, iluminación LED de última generación y el mejor tercer tiempo de Salta."*
- **Call To Actions (CTAs)**:
  - Botón Primario: `[⚽ Reservar Turno Ahora]` (desplaza a `#reservas`).
  - Botón Secundario: `[📋 Mercado de Fichajes]` (desplaza a `#fichajes`).
  - Botón Terciario / Rápido: `[💬 Consultas por WhatsApp]` (abre chat predefinido).

---

### 3.2. Video del complejo (`#complejo`)
Composición oscura y editorial para presentar las instalaciones:

- En escritorio, título y descripción comparten una fila con el video; en celular se apilan.
- El video se limita a 700 px de ancho, mantiene proporción 16:9 y se enmarca con un acento dorado sutil sobre fondo negro.
- Reproduce automáticamente en silencio y en bucle, con controles nativos para pausar; `prefers-reduced-motion` desactiva el inicio automático.
- Si el archivo falla, la portada estática de la cancha queda visible. El quincho tiene una sección propia a continuación.

El video presenta estas instalaciones con títulos y descripciones:

| Título | Descripción |
|---|---|
| **Césped Sintético Pro** | Monofilamento de 50mm con caucho amortiguador y césped natural con mantenimiento diario. |
| **Iluminación LED Estadio** | 350 lux de potencia lumínica uniforme en todas las canchas para partidos nocturnos sin sombras. |
| **Vestuarios & Lockers** | Duchas individuales con agua caliente continua, sanitarios impecables y casilleros seguros. |
| **Quinchos & Parrillas** | Espacios techados con asadores completos, mesas amplias y parrillas para el asado de tu equipo. |
| **Buffet & Pantallas** | Cervezas frías, pizzas, hamburguesas caseras y TV gigante para disfrutar de los partidos profesionales. |
| **Estacionamiento Privado** | Playa de estacionamiento iluminada y con vigilancia dentro del mismo predio. |

---

### 3.3. Sección independiente del quincho (`#tercer-tiempo`)
- Presenta la fotografía real a todo el ancho de la sección, sin fondo añadido ni márgenes interiores.
- Conserva el texto del tercer tiempo y el acceso directo para consultar disponibilidad por WhatsApp.

---

### 3.4. Bloque Institucional y Ubicación (`#ubicacion`)
- **Dirección**: Av. Ex Combatientes de Malvinas / Limache, Zona Sur, Salta Capital.
- **Horarios**: Lunes a Domingos de 09:00 a 00:00 hs.
- **Acceso Directo**: Enlace a Google Maps para navegación GPS directa desde celular.
- **Botón Flotante de WhatsApp**:
  - Posición fija inferior derecha (`position: fixed; bottom: 20px; right: 20px; z-index: 99`).
  - Enlace: `https://wa.me/543874797240?text=Hola!%20Quiero%20hacer%20una%20consulta%20sobre%20el%20complejo%20La%20Bombonerita.`

---

## 4. Requisitos Técnicos y Reglas de Maquetación

1. **Cero Dependencias Pesadas**: Todo maquetado con HTML semántico y CSS moderno (Flexbox, CSS Grid, variables CSS).
2. **Imágenes Ligeras**: Uso de degradados radiales, formas geométricas y emojis/iconos SVG puros para evitar carga de megabytes.
3. **Accesibilidad (WCAG AA)**:
   - Ratios de contraste ≥ 4.5:1 en textos estándar y ≥ 3:1 en encabezados grandes.
   - Touch targets mínimos de 48px para todos los botones y enlaces móviles.
4. **Modo Oscuro Integrado**: Variables CSS preparadas con soporte nativo `prefers-color-scheme` y toggle rápido.

---

## 5. Criterios de Aceptación (Testing Checklist)
- [ ] La barra de navegación permanece visible en todo momento al hacer scroll.
- [ ] Hacer clic en *"Reservar"* desplaza suavemente al turnero sin recargar.
- [ ] Los enlaces de WhatsApp abren la conversación con el número `+54 387 4797240` y el mensaje predeterminado.
- [ ] La interfaz se adapta correctamente en anchos de 360px, 390px, 768px y 1200px.
- [ ] Lighthouse Performance estimado ≥ 90 puntos.

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 🚀 Hoja de Ruta: [[03 - Etapas y Roadmap]]
- 💡 Parámetros y Decisiones: [[02 - Prompt y Decisiones]]
- 📋 Módulo Fichaje: [[08 - Modulo Fichaje y Landing - Especificacion y Consultas]]
- 📜 Registro Técnico: [[04 - Log Tecnico y Cambios]]
