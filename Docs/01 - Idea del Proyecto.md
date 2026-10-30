# Idea del Proyecto: Turnos Canchas & Comunidad Futbolera

## Descripción General
Plataforma web integral para complejos de fútbol que combina tres pilares fundamentales:
1. **Vitrina Comercial / Publicidad**: Espacio institucional y promocional para publicitar las instalaciones, servicios (buffet, vestuarios, iluminación, estacionamiento, torneos) y atraer nuevos clientes.
2. **Sistema de Reservas de Turnos**: Motor ágil y directo para que los usuarios consulten disponibilidad de canchas y reserven turnos en el acto con persistencia de datos.
3. **Módulo de "Fichaje" (Bolsa de Jugadores / "Falta Uno")**: Espacio comunitario donde jugadores individuales pueden publicar su "CV Deportivo" (posición, nivel, disponibilidad, pierna hábil, bio) y los equipos o capitanes pueden buscar, filtrar y contactar refuerzos cuando les falten jugadores para completar un partido.

## Objetivo
Resolver no solo la reserva del espacio físico ("quiero reservar una cancha"), sino también el problema más común del fútbol amateur: **"tenemos la cancha pero nos falta uno"** y **"quiero jugar pero no tengo equipo"**, generando fidelización y comunidad alrededor del complejo.

## Pilares del Sistema

### 1. Publicidad y Presentación del Predio (Landing Comercial)
- Banner de bienvenida con llamada a la acción clara (CTA: "Reservar Cancha" / "Bolsa de Fichajes").
- Galería/Tarjetas de instalaciones y servicios:
  - Canchas de césped sintético y natural con iluminación LED.
  - Vestuarios con duchas y lockers.
  - Buffet, quincho y parrillas para el tercer tiempo.
  - Estacionamiento vigilado.
- Horarios de atención del complejo y mapa de ubicación / contacto.

### 2. Motor de Reservas (Turnero)
- Listado interactivo de canchas disponibles con precios, tipos y capacidades.
- Selector de fecha y franja horaria en tiempo real (con slots ocupados y bloqueados por mantenimiento deshabilitados).
- Formulario de reserva con validación telefónica argentina (+54 9 ...).
- Panel de "Mis Reservas" con cancelación asistida.
- Panel administrativo para gestión de canchas, bloqueos y descarga de reportes en CSV.

### 3. Módulo de "Fichaje" (Mercado de Jugadores)
- **Para Jugadores (Subir CV Deportivo)**:
  - Datos: Nombre/Apodo, Teléfono/WhatsApp, Posición (Arquero, Defensor, Mediocampista, Delantero), Pierna hábil (Derecha, Zurda, Ambidiestro), Nivel (Recreativo, Intermedio, Competitivo), Días/Horarios disponibles y Sede de preferencia.
  - Tarjeta de presentación ("CV Deportivo") con diseño moderno.
  - Estado: "Buscando equipo" / "Fichado / Pausado".
- **Para Equipos / Capitanes**:
  - Tablón de jugadores disponibles con filtros por posición, nivel y sede.
  - Botón de fichaje directo vía enlace de WhatsApp con mensaje pre-armado (ej. *"Hola [Nombre], vi tu CV en Turnos Canchas y nos falta uno hoy a las 20hs en Cancha 1. ¿Te sumás?"*).
  - Pizarra de avisos urgentes: "Equipos que buscan jugador para hoy".

## Principios de Diseño y Arquitectura
1. **Simpleza y cero fricción**: Sin procesos de registro engorrosos; contacto directo.
2. **Mobile-first**: La mayoría de las reservas y búsquedas de jugadores se realizan desde el celular a última hora.
3. **Arquitectura escalable**: Servidor Node.js + Express con entrega estática y persistencia modular.
4. **Respeto a la privacidad**: Protección de datos de contacto y opciones para pausar o retirar el CV en cualquier momento.

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 🚀 Hoja de Ruta: [[03 - Etapas y Roadmap]]
- 📋 Detalle de Fichajes y Landing: [[08 - Modulo Fichaje y Landing - Especificacion y Consultas]]
- 🎨 UI/UX y Estilos: [[09 - Auditoria UI-UX - Frameworks Skills y Referencias]]