# Especificación Detallada: Etapa 5 - Módulo de Fichaje y Pizarra de Urgencias

> **Documento de especificación funcional y UI/UX para la Etapa 5.**
> Contexto: "Mercado de Pases / Falta Uno" de La Bombonerita Fútbol Club.
> Principio rector: React, datos compartidos en Supabase/PostgreSQL, tarjetas estilo FUT y control de acceso por cuenta.

> **Actualización de arquitectura (2026-10-30):** La propuesta histórica de IndexedDB v3 y PIN para gestionar perfiles queda reemplazada. PostgreSQL/Supabase es la fuente compartida; solo el autor autenticado puede editar su perfil y los avisos se vinculan a reservas confirmadas. Publicar un WhatsApp requiere consentimiento explícito. La página pública se migró a React en `frontend/src/Fichajes.jsx`; `/v1/fichajes.html` queda como respaldo Vanilla. El antiguo modelo local de las secciones 3 y 4.1 es referencia histórica. Ver [[03 - Etapas y Roadmap]] y [[15 - Autenticacion y Reservas por Cuenta]].

---

## 1. Visión y Propósito
El módulo de Fichaje ataca el principal problema de deserción de partidos en canchas de fútbol amateur: la falta de jugadores a último momento ("nos falta uno").
Se articula en dos vertientes bidireccionales:
1. **Mercado de Jugadores Libres**: Futbolistas amateurs que publican su CV deportivo para recibir ofertas de capitanes de equipos.
2. **Pizarra de Urgencias ("Falta Uno Hoy")**: Capitanes con turno reservado que necesitan refuerzos urgentes para su partido de la fecha.

---

## 2. Componentes de la Interfaz (UI/UX)

La página independiente `/fichajes` cuenta con dos submódulos conmutables o presentados secuencialmente:

### 2.1. Pestaña / Vista 1: "Mercado de Jugadores"
- **Barra de Filtros en Tiempo Real (Chips interactivos)**:
  - Posición: `[Todos] [🧤 Arquero] [🛡️ Defensor] [⚙️ Mediocampista] [⚡ Delantero]`
  - Nivel: `[Cualquiera] [🟢 Recreativo] [🟡 Intermedio] [🔴 Competitivo]`
  - Días: Filtro multiselección por día de la semana.
  - Disponibilidad: `[Solo Activos]` (oculta en pausa / fichados).
- **Tablón de Tarjetas de Jugador (FUT Player Cards)**:
  - Estructura visual inspirada en cartas coleccionables:
    - Borde y gradiente temático según la posición principal:
      - 🧤 Arquero: Azul marino y cian (`#0f2b48` -> `#0284c7`).
      - 🛡️ Defensor: Verde esmeralda profundo (`#064e3b` -> `#059669`).
      - ⚙️ Mediocampista: Ámbar / Dorado tostado (`#78350f` -> `#d97706`).
      - ⚡ Delantero: Rojo carmesí y naranja (`#7f1d1d` -> `#dc2626`).
    - Encabezado: Apodo/Nombre grande + Posición principal en badge destacado + Pierna hábil.
    - Indicador de nivel: Semáforo visual con badge de color.
    - Tags de disponibilidad: Píldoras compactas con los días disponibles (ej. `LUN` `MIE` `VIE`).
    - Franja horaria y sede preferida.
    - Bio corta: Cita textual de hasta 140 caracteres.
    - **Botón de Contacto Directo**:
      - `[⚡ Fichar por WhatsApp]` -> Abre enlace:
        `https://wa.me/{telefono}?text=Hola%20{nombre}!%20Vi%20tu%20CV%20en%20La%20Bombonerita%20FC.%20Estamos%20buscando%20un%20{posicion}%20para%20jugar%20hoy.%20Te%20sumas?`

---

### 2.2. Modal / Formulario: "Publicar mi CV Deportivo"
Accesible mediante el botón destacado `[+ Cargar mi CV Deportivo]`:

| Campo | Tipo | Opciones / Formato | Reglas |
|---|---|---|---|
| **Nombre / Apodo** | Input texto | Ej. "Gonzalo 'El Tanque'" | Requerido, 3 a 30 caracteres |
| **WhatsApp** | Input tel | Formato argentino (`+54 9 ...`) | Requerido, validado con regex |
| **Posición Principal** | Select | 🧤 Arquero, 🛡️ Defensor, ⚙️ Mediocampista, ⚡ Delantero | Requerido |
| **Posición Secundaria** | Select | Opcional (o "Ninguna") | Opcional |
| **Pierna Hábil** | Radio / Pills | Diestro, Zurdo, Ambidiestro | Requerido |
| **Nivel de Juego** | Select | 🟢 Recreativo, 🟡 Intermedio, 🔴 Competitivo | Requerido |
| **Días Disponibles** | Checkbox grid | Lunes a Domingo | Al menos 1 día seleccionado |
| **Franja Horaria** | Select | Tarde (14:00 - 18:00), Noche (18:00 - 23:00), Indistinto | Requerido |
| **Sede Preferida** | Select | Sede Central (default) | Requerido |
| **Descripción / Bio** | Textarea | Breve descripción deportiva (máx 140 caracteres) | Opcional con contador en vivo |
| **Consentimiento de contacto** | Checkbox | Permitir mostrar el WhatsApp para recibir propuestas | Requerido para publicar |

---

### 2.3. Pestaña / Vista 2: "Pizarra de Urgencias (Falta Uno Hoy)"
- Diseñada para capitanes con turno confirmado que necesitan completar el equipo en las próximas horas.
- **Formulario de Publicación Rápida**:
  - Selección de una reserva futura propia confirmada (cancha, fecha y hora se toman de la reserva).
  - Posición necesitada (ej. "Arquero o Defensor").
  - Nivel del partido (Amistoso / Picado tranqui / Partido fuerte).
  - Contacto del capitán tomado del perfil y visible solo con consentimiento explícito.
  - Duración del aviso: TTL de 24 horas (se oculta automáticamente trascurrido el horario).
- **Visualización de Avisos de Urgencia**:
  - Banner con animación de alerta sutil (`pulse` en acento naranja/rojo).
  - Botón: `[🙋 Postularme como Refuerzo]` -> Abre WhatsApp con el capitán:
    `"¡Hola! Vi en la pizarra de La Bombonerita que te falta un jugador para las {hora} en {cancha}. Estoy disponible, ¿sigue libre el lugar?"`

---

## 3. Gestión, privacidad y autoría

- Publicar y gestionar un CV requiere una cuenta autenticada. La persona puede editar, pausar, reactivar o eliminar únicamente su perfil.
- El perfil no se publica hasta que el usuario confirme el consentimiento de mostrar su contacto de WhatsApp.
- El catálogo público muestra solo perfiles activos y aprobados. Debe haber una acción sencilla para denunciar un perfil.
- Avisos urgentes requieren sesión y una reserva futura propia. El capitán puede cerrarlos; vencen automáticamente al pasar el turno.
- Moderadores administran denuncias y contenido mediante permisos de rol protegidos en el servidor.

---

## 4. Arquitectura de Datos (propuesta original local, reemplazada)

> El contenido local/IndexedDB de esta sección se conserva como antecedente. No debe usarse como persistencia de producción.

Se amplía la base de datos local `TurnosCanchasDB` a la **versión 3**:

```javascript
// Esquema de Almacenes en IndexedDB v3
const STORE_BOOKINGS = 'bookings';       // Existente v1
const STORE_FIELDS = 'fields';           // Existente v2
const STORE_BLOCKS = 'blocked_slots';    // Existente v2
const STORE_PLAYERS = 'player_cvs';      // NUEVO v3 (keyPath: 'id')
const STORE_URGENT = 'urgent_notices';   // NUEVO v3 (keyPath: 'id')
```

### 4.1. Estructura del Objeto `player_cvs`
```json
{
  "id": "player_1729112400000",
  "name": "Nico 'Rifle' Pandolfi",
  "phone": "+54 9 387 4123456",
  "primaryPosition": "delantero",
  "secondaryPosition": "mediocampista",
  "foot": "diestro",
  "level": "intermedio",
  "days": ["martes", "jueves", "viernes"],
  "timeSlot": "noche",
  "preferredVenue": "central",
  "bio": "Delantero con gol, voy a todas las pelotas. Disponible noches de semana.",
  "pin": "7412",
  "status": "active", // "active" | "paused"
  "createdAt": "2026-10-16T19:50:00.000Z"
}
```

### 4.2. Estructura histórica del Objeto `urgent_notices`
```json
{
  "id": "notice_1729113000000",
  "captainName": "Martín (Los Pibes FC)",
  "phone": "+54 9 387 5987654",
  "fieldId": "1",
  "fieldName": "Cancha 1 (Fútbol 5)",
  "matchDate": "2026-10-16",
  "matchTime": "21:00",
  "neededPosition": "arquero",
  "level": "intermedio",
  "notes": "Se nos bajó el arquero a último momento, partido 21hs puntual.",
  "pin": "1234",
  "expiresAt": "2026-10-16T22:30:00.000Z",
  "status": "open" // "open" | "filled"
}
```

---

### 4.3 Modelo compartido objetivo (Supabase/PostgreSQL)

- `player_profiles`: `id`, `owner_user_id` (cuenta autenticada), nombre público, teléfono, `contact_consent_at`, posiciones, pierna, nivel, días, franja horaria, sede, bio, estado, moderación y fechas de creación/actualización.
- `urgent_notices`: `id`, `captain_user_id`, `booking_id` (reserva del autor), posición requerida, nivel, nota, `expires_at`, estado y fechas de creación/actualización.
- El público solo consulta perfiles activos y aprobados; el teléfono solo se expone si existe consentimiento explícito. Cada cuenta edita únicamente sus registros. Administración modera con un rol protegido por RLS.
- Avisos solo pueden publicarse para una reserva futura confirmada que pertenezca al capitán. Los avisos vencidos se excluyen de consultas y pueden depurarse en mantenimiento.
- No guardar PINs recuperables. La cuenta autenticada sustituye al PIN como prueba de autoría. Cualquier alternativa sin cuenta requiere diseñar recuperación, hash y limitación de intentos.

Este modelo requiere definir claves foráneas, índices, estados permitidos y políticas RLS en el esquema SQL antes de iniciar la Etapa 5.

## 5. Control desde el Panel de Administración (Moderación)

El panel accesible vía `[👤 Iniciar Sesión]` incorpora una 4ta pestaña:
- **Pestaña "Fichajes & Avisos"**:
  - Listado de todos los jugadores registrados.
  - Opción de moderación: suspender o dar de baja perfiles con datos inapropiados.
  - Visualización y cierre forzado de avisos de urgencia vencidos o completados.

---

## 6. Checklist de Implementación
- [ ] Tablas PostgreSQL, claves foráneas e índices para perfiles y avisos.
- [ ] Políticas RLS que cubran lectura pública consentida, autoría, moderación y reserva vinculada.
- [ ] Maquetación del formulario de carga de CV con modal accesible y validaciones.
- [ ] Maquetación de tarjetas FUT Cards con CSS Grid y gradientes atléticos por posición.
- [ ] Lógica de filtrado en tiempo real por posición, nivel y disponibilidad.
- [ ] Generación automática de enlace `wa.me` con mensaje url-encoded personalizado.
- [ ] Sistema de edición/pausa por cuenta autenticada.
- [ ] Pizarra de avisos urgentes con expiración por horario.

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 🚀 Hoja de Ruta: [[03 - Etapas y Roadmap]]
- 💡 Especificación Vitrina Comercial: [[10 - Especificacion Etapa 4 - Vitrina Comercial]]
- 🧪 Test Etapa 4: [[11 - Guia Test Etapa 4]]
- 📜 Registro Técnico: [[04 - Log Tecnico y Cambios]]

## Ampliación de perfiles — 2026-11-13

- Cada tarjeta abre un perfil completo con foto de perfil, foto de cuerpo completo, presentación de hasta 600 caracteres, disponibilidad, posición, enlaces a video y redes, contacto y opiniones.
- La persona dueña del perfil puede cargar JPG, PNG o WebP de hasta 5 MB. Las fotos del jugador se guardan en el bucket público `player-photos`; la escritura y reemplazo quedan limitados a la carpeta de su cuenta.
- Los enlaces admitidos son HTTPS de YouTube, Instagram y TikTok. El video se enlaza desde el servicio de origen, no se almacena como archivo.
- Las cuentas con correo verificado pueden publicar o editar una opinión (calificación de 1 a 5 y comentario de 10 a 500 caracteres) por perfil. No se puede calificar el propio perfil.
- La calificación se elige con cinco estrellas mediante radios nativos accesibles por teclado; se mantiene un puntaje entero de 1 a 5 y se informa la selección en texto.
- Los cambios de fotos y enlaces vuelven a poner el perfil en revisión. Las opiniones solo aparecen cuando el perfil está activo y aprobado.
- Las migraciones `005_fichajes_perfiles_ampliados.sql` y `007_fix_fichajes_public_reviews_policy.sql` deben estar aplicadas en Supabase antes de habilitar estas funciones. La 007 es la corrección de permisos para leer opiniones públicas sin otorgar al rol `anon` acceso a columnas internas de moderación.
