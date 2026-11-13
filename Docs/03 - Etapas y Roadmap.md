# Etapas del Proyecto (Roadmap Secuencial)

## Etapa 1: MVP - Funcionalidad Base ✅ COMPLETADA
**Archivos**: `index.html`, `style.css`, `app.js`
**Estado**: Auditada, probada y 100% funcional
**Entregable**: Abrir `index.html` en navegador → funciona al 100% con persistencia local

### Checklist Etapa 1
- [x] Estructura HTML semántica
- [x] CSS mobile-first con variables CSS
- [x] JS vanilla modular (IIFE implícita por módulos ES6 no usados)
- [x] 4 canchas con datos quemados
- [x] Selector fecha con min=hoy
- [x] Slots horarios 9:00-22:00
- [x] Horas ocupadas deshabilitadas dinámicamente
- [x] Formulario validado (HTML5 + JS)
- [x] Guardado en localStorage
- [x] Vista "Mis Reservas" con cancelar
- [x] Responsive < 480px

---

## Etapa 2: Mejora de Datos y UX ✅ COMPLETADA
**Objetivo**: Datos más flexibles, mejor experiencia
**Estado**: Auditada, probada y 100% funcional
**Archivos**: `fields.json`, `index.html`, `style.css`, `app.js`

### Tareas
- [x] Migrar canchas a `fields.json` (carga fetch con fallback offline)
- [x] Agregar campo "Complejo/Sede" a canchas
- [x] Persistencia IndexedDB (más robusto que localStorage, con migración y fallback)
- [x] Validación teléfono con regex Argentina (+54 9 11 xxxx-xxxx)
- [x] Toast/confirmación visual mejorada (no `alert()`)
- [x] Estado de carga en botón submit
- [x] Prevenir doble submit

---

## Etapa 3: Panel Admin Básico ✅ COMPLETADA
**Objetivo**: Dueño gestiona canchas sin código
**Estado**: Auditada, probada y 100% funcional
**Archivos**: `index.html`, `style.css`, `app.js`

La vista original de esta etapa usaba acceso local; fue reemplazada el 2026-10-29 por el panel React con Supabase Auth y autorización por `profiles.role`. La guía actual está en [[07 - Guia Test Etapa 3]].

### Tareas
- [x] Vista admin (ruta `#admin`, botón en header con autenticación password)
- [x] CRUD canchas (nombre, tipo, capacidad, precio, activa/inactiva, persistencia DB)
- [x] CRUD horarios globales (apertura/cierre configurable por franja)
- [x] Bloquear horarios específicos (mantenimiento, eventos, lluvia con motivos)
- [x] Ver todas las reservas del día/semana con métricas de ocupación e ingresos
- [x] Exportar reservas a CSV descargable con formato UTF-8 BOM

---

## Etapa 4: Servidor Express y Vitrina Comercial ✅ COMPLETADA
**Objetivo**: Servir la app mediante Node/Express y publicitar el predio (instalaciones, servicios, ubicación y accesos directos).
**Estado**: Auditada, probada y 100% funcional
**Archivos**: `server.js`, `public/index.html`, `public/style.css`, `public/app.js`

### Tareas
- [x] Servidor Node + Express para servir carpeta `public/` en puerto 3000
- [x] Sección Hero con identidad del predio ("La Bombonerita FC"), eslogan y CTAs principales
- [x] Sección de Instalaciones y Servicios (césped sintético/natural, luces LED, vestuarios, parrillas, buffet, estacionamiento)
- [x] Bloque de valor social "El Tercer Tiempo" con foco en asado y quinchos
- [x] Información institucional de horarios, dirección en Salta Capital y enlace GPS a Google Maps
- [x] Botón flotante directo de WhatsApp (+54 387 4797240)
- [x] Barra de navegación fija SPA con scroll suave y conmutador `[👤 Iniciar Sesión]`

---

## Etapa 5: Módulo de "Fichaje" - Mercado de Jugadores ✅ COMPLETADA
**Objetivo**: Conectar jugadores libres con equipos que necesitan refuerzos ("Nos falta uno").

**Dependencias previas**: activar Supabase y comprobar Auth/reservas; trasladar canchas y bloqueos desde almacenamiento local a PostgreSQL. Fichajes requiere datos compartidos y no debe implementarse con IndexedDB/localStorage como fuente principal.

**Stack vigente**: Express + Supabase Auth/PostgreSQL; la landing, el turnero, el panel administrativo y Fichajes público viven en React 19 + Vite + Tailwind dentro de `frontend/`. `/v1` conserva la versión Vanilla como respaldo histórico.

**Estado al 2026-11-06**: catálogo, filtros, perfiles, reportes y pizarra urgente están migrados a React en `frontend/src/Fichajes.jsx`. La ruta `/fichajes` usa la app React; `/v1/fichajes.html` queda como respaldo histórico. La migración 003, el panel de moderación y las pruebas funcionales/de aislamiento entre cuentas fueron confirmados como listos por el usuario.

### Tareas
- [x] Formularios de CV Deportivo y avisos urgentes con autor autenticado (posición, nivel, disponibilidad, sede, bio y contacto)
- [x] Tablón interactivo de jugadores libres con filtros en tiempo real (posición, nivel, sede)
- [x] Contacto por WhatsApp con mensaje pre-armado y consentimiento explícito para publicar el número
- [x] Gestión de CV propio mediante cuenta (Activo / En Pausa / Fichado)
- [x] Pizarra de avisos vinculada a una reserva confirmada y con vencimiento automático
- [x] Moderación y gestión de fichajes desde el Panel de Administración React (requiere migración 003)
- [x] RLS y pruebas entre cuentas para confirmar aislamiento de edición y moderación (confirmadas por el usuario)

---

## Etapa 6: Notificaciones y Recordatorios (En implementación)
**Objetivo**: Reducir ausencias y no-shows
### Tareas
- [ ] Recordatorio 24h antes (cola y función desplegadas; falta activar Cron y validar envío)
- [ ] Recordatorio 2h antes (cola y función desplegadas; falta activar Cron y validar envío)
- [x] Confirmación rápida por WhatsApp (ya existente)
- [ ] Email de confirmación (función desplegada; falta configurar proveedor y validar envío)

**Estado técnico al 2026-11-13**: migración `004` aplicada y Edge Function desplegada según el usuario. Falta verificar el dominio remitente en Resend, cargar secretos, guardar credenciales internas en Vault, ejecutar el SQL de Supabase Cron y comprobar entregas. El enlace de WhatsApp requiere que el usuario pulse “Enviar”; WhatsApp no permite enviar mensajes automáticamente desde el navegador.

---

## Etapa 7: Pagos y Monetización (Planificada)
**Objetivo**: Cobro y seña por reserva
### Tareas
- [ ] Integración MercadoPago (Argentina)
- [ ] Reserva con seña (30% / 50%) o pago total
- [ ] Comprobante digital de turno
- [ ] Dashboard de métricas financieras avanzadas

---

## Criterios de Paso entre Etapas
1. **Etapa actual 100% funcional y testeada en mobile real**
2. **Documentación actualizada en esta bóveda**
3. **Commit/registro de cambios antes de empezar siguiente**
4. **No empezar etapa N+1 hasta que N esté "done"**

## Orden comercial acordado
1. Activar y verificar Supabase Auth y las reservas compartidas ya preparadas.
2. Compartir en PostgreSQL la configuración de canchas y los bloqueos de horarios.
3. Implementar Fichajes multiusuario con permisos y consentimiento de contacto.
4. Migrar Fichajes público a React una vez estable y ejecutar la guía de pruebas de Etapa 5.
5. Abordar notificaciones y pagos en etapas separadas.

La migración gradual a React/Vite comenzó el 2026-10-23 por decisión del usuario. El 2026-10-29 se trasladó el panel administrativo a React; el 2026-10-30 se migró también Fichajes público, sin cambiar el esquema ni las políticas RLS.

---
**Navegación del Grafo y Guías de Prueba:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 🧪 Test Etapa 1 (MVP): [[05 - Guia Test Etapa 1]]
- 🧪 Test Etapa 2 (IndexedDB & UX): [[06 - Guia Test Etapa 2]]
- 🧪 Test Etapa 3 (Panel Admin): [[07 - Guia Test Etapa 3]]
- 📋 Especificación Fichajes (Etapa 5): [[08 - Modulo Fichaje y Landing - Especificacion y Consultas]]
- 📜 Registro Técnico: [[04 - Log Tecnico y Cambios]]
