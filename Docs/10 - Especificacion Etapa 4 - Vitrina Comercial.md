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
  1. `[🏟️ Complejo]` -> ancla `#complejo` (Hero + Instalaciones + Tercer Tiempo).
  2. `[⚽ Reservas]` -> ancla `#reservas` (Catálogo de canchas y selector de turnos).
  3. `[📋 Fichajes]` -> ancla `#fichajes` (CV Deportivo y Mercado de Jugadores).
  4. `[👤 Iniciar Sesión]` -> conmutador a formulario de acceso (Login modal o vista de autenticación para Dueño/Admin y Jugador/Capitán).
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

### 3.2. Grilla de Instalaciones y Servicios (`#servicios`)
Grilla responsiva (1 columna en móvil, 2 en tablet, 3 en desktop) con tarjetas estilizadas:

| Tarjeta | Ícono | Título | Descripción Destacada |
|---|:---:|---|---|
| **1** | 🏟️ | **Césped Sintético Pro** | Fibras monofilamento de 50mm con caucho amortiguador y mantenimiento diario. |
| **2** | 💡 | **Iluminación LED Estadio** | Potencia lumínica uniforme de 350 lux para partidos nocturnos sin sombras. |
| **3** | 🚿 | **Vestuarios & Lockers** | Duchas presurizadas con agua caliente continua y armarios individuales. |
| **4** | 🥩 | **Quinchos & Parrillas** | Asadores techados con mesas y bancos amplios para el asado post-partido. |
| **5** | 🍔 | **Buffet & Pantallas** | Bebidas frías, minutas y transmisión de partidos de fútbol en pantalla gigante. |
| **6** | 🚗 | **Estacionamiento Propio** | Playa de estacionamiento privada e iluminada dentro del predio. |

---

### 3.3. Sección "El Tercer Tiempo" (`#tercer-tiempo`)
- **Propósito**: Destacar el valor social del predio (el fútbol amateur no termina a los 60 minutos).
- **Contenido**:
  - Tarjeta destacada con borde luminoso en tono dorado (`#eab308`).
  - Copy persuasivo: *"El partido se juega en la cancha. El clásico se gana en la parrilla."*
  - Opciones de reserva combinada: aviso sobre opción de alquilar quincho al momento de reservar turno.

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
