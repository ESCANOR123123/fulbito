# Módulo de "Fichaje" y Vitrina Comercial: Especificación y Consultas

> **Estado de vigencia:** El propósito y los requisitos funcionales siguen como referencia. Las propuestas de IndexedDB/PIN y el estado «código congelado» son históricas; la arquitectura vigente para Fichajes es Supabase/PostgreSQL y autoría por cuenta, según [[12 - Especificacion Etapa 5 - Modulo Fichaje]] y [[03 - Etapas y Roadmap]]. La Vitrina Comercial ya está implementada.

## 1. Visión y Propósito
El objetivo de esta fase es transformar el turnero en una **plataforma comunitaria integral para el complejo de fútbol**, atacando dos necesidades críticas del negocio:
1. **Publicitar el predio**: Mostrar la calidad de las instalaciones, servicios y comodidades para atraer nuevos grupos y generar valor de marca.
2. **Resolver el "Nos falta uno" (Módulo Fichaje)**: La principal causa de caída de turnos y cancelación de partidos en canchas de fútbol amateur es la falta de jugadores a último momento. Con este módulo, los jugadores libres encuentran dónde jugar y los equipos completan sus partidos, asegurando que las canchas no queden vacías.

---

## 2. Sección de Publicidad del Complejo (Landing Comercial)

### 2.1. Componentes Visuales
- **Hero Banner Principal**:
  - Título atractivo: *"El mejor fútbol amateur en La Bombonerita Fútbol Club"*.
  - Subtítulo: *"Canchas de sintético y natural, vestuarios de primer nivel y el mejor tercer tiempo en Salta."*
  - Botones de acción directa (CTAs):
    - `[⚽ Reservar Cancha Ahora]` (redirige a la sección de reservas).
    - `[📋 Mercado de Fichajes]` (redirige a buscar jugadores o subir CV).
- **Instalaciones y Servicios**:
  - 🏟️ **Canchas Pro**: Césped sintético monofilamento de última generación y césped natural con mantenimiento diario.
  - 💡 **Iluminación LED**: Visibilidad óptima para partidos nocturnos.
  - 🚿 **Vestuarios & Duchas**: Agua caliente, lockers y comodidades higiénicas.
  - 🥩 **Parrillas & Quincho**: Espacio exclusivo para el asado post-partido.
  - 🍔 **Buffet & Bar**: Bebidas frías, pizzas, hamburguesas y pantallas para ver partidos de fútbol profesional.
  - 🚗 **Estacionamiento Privado**: Espacio seguro dentro del predio.
- **Información Institucional**:
  - Horarios de atención: Lunes a Domingos de 09:00 a 00:00 hs.
  - Ubicación geográfica: Zona Sur - Salta Capital (Av. Ex Combatientes de Malvinas / Limache).
  - Canal directo de atención por WhatsApp: `+54 387 4797240` (consultas comerciales, alquiler fijo, torneos).

---

## 3. Módulo de "Fichaje" (Mercado de Jugadores)

### 3.1. Estructura del "CV Deportivo" del Jugador
Cada jugador libre dispondrá de un perfil deportivo estandarizado con los siguientes campos:

| Campo | Tipo | Opciones / Formato | Obligatorio |
|---|---|---|:---:|
| **Nombre / Apodo** | Texto | Ej. "Nico González (El Tanque)" | Sí |
| **Teléfono / WhatsApp** | Teléfono | Validación Argentina (`+54 9 ...`) | Sí |
| **Posición Principal** | Selector | 🧤 Arquero, 🛡️ Defensor, ⚙️ Mediocampista, ⚡ Delantero | Sí |
| **Posición Secundaria** | Selector | Ninguna, Arquero, Defensor, Mediocampista, Delantero | No |
| **Pierna Hábil** | Radio / Pill | Diestro, Zurdo, Ambidiestro | Sí |
| **Nivel Autopercibido** | Selector | 🟢 Recreativo (amistoso), 🟡 Intermedio, 🔴 Competitivo (liga) | Sí |
| **Días Disponibles** | Checkboxes | Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo | Sí |
| **Franja Horaria** | Selector | Tarde (14:00 - 18:00), Noche (18:00 - 23:00), Cualquier horario | Sí |
| **Sede Preferida** | Selector | Sede Central, Sede Norte, Indistinta | Sí |
| **Descripción / Bio** | Texto corto | Máximo 140 caracteres (ej. *"Juego de 5 raspador, no falto nunca, tengo auto"*). | No |
| **Estado** | Estado | `Buscando equipo` (visible) / `Fichado / En pausa` (oculto) | Sí |
| **Fecha de Registro** | Timestamp | Fecha en que se publicó el CV | Automático |

### 3.2. Catálogo y Filtros de Búsqueda (Para Equipos)
- Tarjetas visuales estilo "Player Card" con la posición destacada mediante color y badge de nivel.
- Filtros interactivos en tiempo real:
  - Por posición (ej. filtrar solo Arqueros).
  - Por sede de juego.
  - Por nivel de juego.
  - Por día de disponibilidad.
- Botón directo de **"Fichar por WhatsApp"**:
  - Al hacer clic, abre WhatsApp Web o la App móvil con un mensaje predeterminado:
    > *"¡Hola [Nombre]! Vi tu CV en Turnos Canchas. Estamos buscando un [Posición] para jugar hoy en [Sede]. ¿Estás libre para sumarte?"*

### 3.3. Pizarra Complementaria: "Equipos que Buscan Refuerzo"
- Sección rápida donde un capitán que ya reservó turno puede publicar un aviso urgente:
  - *"Falta 1 para hoy 21:00 hs en Cancha 2 (Sede Central) - Nivel Medio"*.
  - Con botón para que los jugadores libres se postulen de inmediato.

---

## 4. Consultas y Decisiones Clave Auditadas y Validadas

A través de la consulta directa con el usuario, se han auditado y acordado las siguientes definiciones arquitectónicas y funcionales definitivas:

| # | Consulta | Decisión Acordada | Justificación / Detalle |
|---|---|---|---|
| **1** | **Mecanismo de Contacto** | **Enlace directo a WhatsApp con mensaje pre-armado** | Cero fricción para los capitanes. Al pulsar "Fichar", se abre WhatsApp con el mensaje pre-cargado: *"Hola [Nombre], vi tu CV en Turnos Canchas. Jugamos hoy a las [Hora] en [Sede], ¿te sumás?"*. |
| **2** | **Gestión y Baja del CV (decisión histórica)** | **PIN numérico de 4 dígitos** | Propuesta original, reemplazada por gestión del perfil desde la cuenta autenticada. Ver [[12 - Especificacion Etapa 5 - Modulo Fichaje]]. |
| **3** | **Alcance del Módulo Fichaje** | **Bidireccional (Jugadores + Pizarra de Urgencias)** | Los jugadores libres publican su CV **y además** los capitanes con turno confirmado pueden publicar avisos de urgencia (*"Falta 1 arquero para hoy a las 20hs"*). |
| **4** | **Navegación Principal** | **Single Page Application (SPA) con barra superior fija** | Barra de navegación superior fija (`[Complejo]`, `[Reservas]`, `[Fichajes]`, `[Iniciar Sesión]`) con scroll suave entre secciones y acceso unificado a credenciales/gestión. |

---

## 5. Arquitectura Técnica de Datos para Fichajes

Siguiendo el principio de **cero dependencias externas y sin sobreingeniería**:
1. **Almacenamiento Local Inicial**:
   - `IndexedDB` (versión 3):
     - ObjectStore `player_cvs` (keyPath: `id`): Perfiles de jugadores (nombre, teléfono, posición, pierna, nivel, disponibilidad, bio, pin, estado `active`/`paused`).
     - ObjectStore `urgent_notices` (keyPath: `id`): Avisos de "Falta Uno" publicados por capitanes (fecha, hora, cancha, posición buscada, contacto).
   - Respaldo automático en `localStorage` para modo offline.
2. **Generador de Enlaces de WhatsApp**:
   - Formato estándar `https://wa.me/{numero_limpio}?text={mensaje_url_encoded}` para funcionamiento universal tanto en móviles (abre app de WhatsApp) como en escritorio (abre WhatsApp Web).

---

## 6. Estado Actual
- **Documentación**: 100% completada y auditada en la bóveda de Obsidian.
- **Código**: Congelado (sin implementación de código en esta fase según instrucciones).
- **Listo para el siguiente paso**: Cuando el usuario lo indique, se procederá a implementar la Vitrina Comercial (Landing) y el Módulo de Fichajes.

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 💡 Idea y Pilares: [[01 - Idea del Proyecto]]
- 🚀 Hoja de Ruta: [[03 - Etapas y Roadmap]]
- 🎨 UI/UX y Benchmarks: [[09 - Auditoria UI-UX - Frameworks Skills y Referencias]]
- 📜 Registro Técnico: [[04 - Log Tecnico y Cambios]]
