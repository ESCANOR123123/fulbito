# Configuración de correos transaccionales

La Etapa 6 usa Resend para enviar correos y Supabase Cron para procesar una cola en PostgreSQL. Se envían tres tipos de correo: confirmación de reserva, recordatorio 24 h antes y recordatorio 2 h antes. Son avisos operativos; no son correos promocionales.

## Preparación

1. En Resend, crear una API key y verificar el dominio desde el que se enviarán correos. El remitente debe usar ese dominio, por ejemplo `reservas@tudominio.com`.
2. En Supabase, aplicar `supabase/migrations/004_booking_email_notifications.sql` desde SQL Editor.
3. Desde PowerShell, en la raíz del proyecto, iniciar sesión en la CLI y vincular el proyecto hospedado (usar el Project Ref que muestra el panel Supabase):

   ```powershell
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   ```

4. Desplegar la función desde la raíz del proyecto:

   ```powershell
   supabase functions deploy send-booking-emails
   ```

5. En **Supabase → Edge Functions → Secrets**, configurar:
   - `RESEND_API_KEY`: API key de Resend.
   - `RESEND_FROM_EMAIL`: remitente verificado, por ejemplo `La Bombonerita <reservas@tudominio.com>`.
   `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` se proporcionan a la función por el entorno de Supabase. No guardar claves en el repositorio ni en `public/`.
6. En **Supabase → Database → Vault**, crear estos secretos con esos nombres exactos:
   - `project_url`: URL del proyecto Supabase.
   - `service_role_key`: clave `service_role` del proyecto. Solo queda en Vault y se usa para la llamada interna del cron.
7. Ejecutar `supabase/schedule_booking_emails.sql` desde SQL Editor para procesar la cola cada minuto.

## Comportamiento

- Al crear una reserva, una función PostgreSQL agrega el correo de confirmación y, si todavía corresponden, los avisos de 24 h y 2 h.
- Las horas se calculan con la zona `America/Argentina/Buenos_Aires`.
- Al cancelar la reserva, sus correos pendientes se eliminan por la clave foránea `ON DELETE CASCADE`.
- La cola permite hasta cinco intentos por correo. Resend recibe una clave de idempotencia por aviso para evitar duplicados en los reintentos; errores persistentes quedan visibles en `last_error`.
- La función solo acepta el `apikey` interno de servicio y no expone una operación pública a usuarios.

## Comprobación

Crear una reserva futura con una cuenta de prueba y confirmar en `public.booking_email_queue` que aparecen los tipos que correspondan. Revisar **Supabase → Cron → Runs**, logs de `send-booking-emails` y el panel de Resend. Probar también cancelar una reserva antes del recordatorio y verificar que el aviso pendiente desaparezca.

No marcar Etapa 6 como completada hasta confirmar recepción real de los tres tipos de correo y el comportamiento al cancelar.
