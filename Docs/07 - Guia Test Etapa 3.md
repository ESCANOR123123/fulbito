# Guía de prueba — Panel administrativo React

La pantalla administrativa actual forma parte del cliente React. Iniciá el proyecto con `npm run dev`, abrí `http://localhost:5174/` y usá una cuenta existente cuyo `profiles.role` sea `admin`. No se usa una contraseña local compartida.

## Inicio y retorno de acceso

- [ ] Abrir `http://localhost:5174/login?redirectTo=%2Fv1%2F#admin` sin sesión: aparece el diálogo React para iniciar sesión.
- [ ] Iniciar sesión con cuenta admin: queda en React y muestra el panel sin volver a `/login` ni a `/v1`.
- [ ] Iniciar sesión con cuenta cliente: muestra el sitio/reservas y no muestra funciones administrativas.
- [ ] Probar usuario sin fila en `profiles`: la interfaz explica que falta el perfil; no concede privilegios.
- [ ] Cerrar sesión y confirmar que vuelve al sitio público.

## Funciones del panel

- [ ] Resumen: conteos de hoy, ingresos estimados, canchas activas y bloqueos.
- [ ] Reservas: filtros por período y cancha, cancelación confirmada, resumen recalculado y descarga CSV UTF-8 con BOM.
- [ ] Canchas: crear, editar, pausar/reactivar y eliminar; comprobar que el cliente solo reserva canchas activas.
- [ ] Bloqueos: crear un bloqueo de fecha/hora/motivo y quitarlo; verificar disponibilidad en la vista cliente.
- [ ] Moderación: con migración 003 aplicada, aprobar/suspender/bajar perfiles, resolver/descartar denuncias y cerrar avisos.

## Errores esperados

- Sin migración 002, las consultas de canchas/bloqueos muestran un error accionable y no una pantalla vacía.
- Sin migración 003, solo falla la sección de moderación; las demás secciones siguen utilizables.
- Una cuenta cliente o una sesión vencida no puede escribir aunque intente forzar la interfaz; Supabase RLS sigue siendo la autoridad.

La compilación de Vite se verificó el 2026-10-29. La validación manual de los flujos anteriores queda pendiente de ejecución con cuentas reales de cliente y administrador.

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 🚀 Hoja de Ruta: [[03 - Etapas y Roadmap]]
- 🧪 Test Anterior (Etapa 2): [[06 - Guia Test Etapa 2]]
