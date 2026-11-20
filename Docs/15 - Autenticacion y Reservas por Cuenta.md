# Autenticación y reservas por cuenta

Fecha: 2026-10-16

## Qué cambia

El frontend React usa Supabase Auth para registro, inicio y cierre de sesión, recuperación de contraseña, verificación de correo y autorización por rol. Una persona sin sesión no ve «Mis reservas» y debe iniciar sesión antes de completar una reserva. Cada reserva queda asociada a su cuenta; la disponibilidad y la exclusividad del horario se comparten entre usuarios. El panel administrador React requiere un perfil con rol `admin`. Fichajes público también está migrado a React; la versión Vanilla en `/v1` queda como respaldo histórico.

La configuración de canchas y bloqueos se migra a PostgreSQL con la migración 002 descrita abajo. Los datos locales anteriores no se borran ni se importan automáticamente. La migración agrega las cuatro canchas base; si hay precios o bloqueos personalizados en un navegador, revisarlos y volver a ingresarlos como administrador después de aplicarla.

## Activar Supabase

1. Crear un proyecto Supabase y abrir **SQL Editor**.
2. Si aún no está aplicado, ejecutar `supabase/schema.sql` una vez.
3. Ejecutar `supabase/migrations/002_shared_venue_configuration.sql` después del esquema base. Crea tablas compartidas, permisos RLS y canchas iniciales sin reemplazar filas existentes.
4. En **Authentication → URL Configuration**, usar el origen principal `http://localhost:3000` como Site URL en ejecución por Express. Para desarrollo con Vite, permitir `http://localhost:5174/**`; para pruebas de la versión anterior, mantener `http://localhost:3000/v1/**`. En producción, agregar el dominio HTTPS real. Los enlaces de confirmación y recuperación deben volver al origen raíz de React.
5. En `public/supabase-config.js`, ya están configurados `url` y `publishableKey` para el proyecto indicado. No colocar aquí una `service_role` ni otra clave secreta.
6. Iniciar el servidor con `npm start` y abrir `http://localhost:3000/v1/`. No abrir el HTML con `file://`: Auth necesita un origen HTTP configurado.
7. Para producción, configurar un dominio HTTPS y SMTP propio en Supabase Auth; verificar los enlaces de confirmación y recuperación desde ese dominio.
8. Registrar una cuenta de administrador y cambiar su rol desde SQL Editor, reemplazando el correo:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@tudominio.com');
```

Los permisos se aplican con Row Level Security: cada cliente puede consultar y cancelar sus propias reservas; el administrador puede consultarlas y cancelarlas todas. La tabla `booking_slots` solo expone cancha, fecha y hora ocupada, nunca nombre ni teléfono. React muestra el panel admin en la misma aplicación después de leer `profiles.role`; el acceso directo `/login?...#admin` abre el login y ya no salta a `/v1/#admin`.

## Fotos de perfil

Para habilitar la foto de perfil en `/perfil`, ejecutar `supabase/migrations/006_profile_photos.sql` en el SQL Editor después de las migraciones existentes. La migración crea el bucket privado `profile-photos` y permite que cada cuenta lea, cargue, reemplace y borre únicamente archivos dentro de su propia carpeta. Se aceptan JPG, PNG y WebP de hasta 5 MB. Supabase Auth conserva la ruta del archivo en los metadatos de la cuenta; la interfaz genera URLs firmadas temporales para mostrar la imagen. Hasta aplicar la migración, la carga no estará habilitada en el proyecto Supabase.

## Reservas antiguas

Las reservas guardadas anteriormente en IndexedDB o localStorage permanecen en ese navegador, pero quedan ocultas y no se importan automáticamente. No existe una prueba confiable de que quien inicia sesión sea el titular del teléfono guardado. La migración queda pendiente hasta diseñar una verificación verificable del teléfono, mostrar una vista previa, resolver duplicados y confirmar el resultado antes de eliminar cualquier copia local.

## Estado y límites

La URL y la clave pública ya están configuradas en `public/supabase-config.js`. La app necesita que estén aplicados el esquema base y la migración 002 para usar canchas, reservas y bloqueos compartidos. No se configura aquí infraestructura de producción, correo transaccional ni dominio. Antes de vender el servicio habrá que completar despliegue, monitoreo, privacidad y recuperación operativa.

## Próximos pasos del producto

1. Confirmar que `schema.sql` y la migración 002 estén aplicados; ejecutar 003 antes de probar moderación de Fichajes.
2. Probar inicio de sesión como cliente y admin, el retorno desde `/login?...#admin`, el CRUD del panel y los permisos RLS.
3. Implementar después la migración del catálogo público de Fichajes a React y completar las pruebas multiusuario de Etapa 5.

El orden completo está en [[03 - Etapas y Roadmap]].
