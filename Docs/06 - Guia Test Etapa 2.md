# Guía de Test Rápido - Etapa 2: Mejora de Datos y UX

## Cómo Probar
1. Abrir `C:\Users\Usuario\Desktop\IITA\Proyecto final\TurnosCanchas\index.html` en el navegador (o mediante servidor HTTP local).
2. Probar en Chrome DevTools → Toggle device toolbar (mobile) y Desktop.

---

## Casos de Prueba (Happy Path Etapa 2)

| # | Acción | Resultado Esperado |
|---|--------|-------------------|
| 1 | Cargar página | 4 canchas visibles con badges de sede ("Sede Central" / "Sede Norte"). |
| 2 | Click Cancha 1 | Formulario visible con título "Reservar: Cancha 1 (Sede Central)". |
| 3 | Seleccionar fecha y hora | Fecha y hora seleccionables sin bloqueos. |
| 4 | Ingresar teléfono argentino válido (ej. `+54 9 11 1234-5678`) | Input sin errores. |
| 5 | Click en "Confirmar Reserva" | Botón muestra spinner y texto "Confirmando..." temporalmente. |
| 6 | Confirmación completada | Aparece Toast verde "¡Reserva confirmada con éxito!" (sin `alert()`). |
| 7 | Ver "Mis Reservas" | Tarjeta muestra nombre, cancha, fecha, hora y sede ("• Sede Central"). |
| 8 | Click "Cancelar" en tarjeta | Se abre modal de confirmación con diseño propio (sin `confirm()` nativo). |
| 9 | Click "Sí, cancelar" en modal | Reserva se elimina, modal se cierra y aparece Toast azul "Reserva cancelada". |
| 10 | Recargar página (F5) | Datos persisten de forma asíncrona mediante IndexedDB (y localStorage). |

---

## Casos Edge y UX

| # | Acción | Resultado Esperado |
|---|--------|-------------------|
| E1 | Ingresar teléfono inválido (ej. `12345` o letras) | Toast rojo de advertencia y borde rojo `.is-invalid` en el input. |
| E2 | Intentar doble clic rápido en botón de submit | El botón se deshabilita instantáneamente, evitando duplicados. |
| E3 | Abrir sin servidor (protocolo `file://`) | Carga resiliente con `DEFAULT_FIELDS` asegurando funcionamiento 100% offline. |
| E4 | Modal de cancelación: click "Volver" | Modal se cierra sin eliminar la reserva. |
| E5 | Superposición de múltiples toasts | Notificaciones se apilan ordenadamente en la esquina superior derecha y desaparecen a los 3.5s. |

---

## Checklist Visual y UX

- [x] Badge de Sede ("Sede Central" / "Sede Norte") verde claro en cards
- [x] Toast animado en esquina superior derecha con icono y color según severidad
- [x] Spinner animado dentro del botón submit durante el envío
- [x] Modal de confirmación centrado con fondo oscuro translúcido
- [x] Feedback de error en input telefónico con borde rojo y sombra suave
- [x] Responsive verificado en vista móvil (<480px) y desktop

---

## Verificación de IndexedDB

```js
// En consola de DevTools -> Application -> Storage -> IndexedDB
// Base de datos: TurnosCanchasDB -> bookings
```

---

## Métricas de Éxito Etapa 2
- [x] 0 errores en consola
- [x] Cero uso de `alert()` o `confirm()` nativos
- [x] Persistencia reactiva en IndexedDB con soporte offline y fallback
- [x] Validación estricta de telefonía argentina

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 🚀 Hoja de Ruta: [[03 - Etapas y Roadmap]]
- 🧪 Test Anterior (Etapa 1): [[05 - Guia Test Etapa 1]]
- 🧪 Test Siguiente (Etapa 3): [[07 - Guia Test Etapa 3]]
