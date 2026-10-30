# Guía de Test Rápido - Etapa 1
 
## Cómo Probar
1. Abrir `C:\Users\Usuario\Desktop\IITA\Proyecto final\TurnosCanchas\index.html` en navegador
2. Probar en Chrome DevTools → Toggle device toolbar (mobile)

---

## Casos de Prueba (Happy Path)

| # | Acción | Resultado Esperado |
|---|--------|-------------------|
| 1 | Cargar página | 4 canchas visibles, "Mis Reservas" vacío |
| 2 | Click Cancha 1 | Sección reserva aparece, nombre cancha en título |
| 3 | Seleccionar fecha mañana | Horarios 9:00-22:00 habilitados |
| 4 | Seleccionar hora 14:00 | Hora seleccionable |
| 5 | Llenar nombre + teléfono | Botón "Confirmar Reserva" activo |
| 6 | Submit | Alert "¡Reserva confirmada!", formulario se cierra |
| 7 | Ver "Mis Reservas" | Tarjeta con cancha, fecha, hora, nombre, teléfono |
| 8 | Click "Cancelar" en reserva | Confirmación → reserva desaparece |
| 9 | Recargar página (F5) | Reserva persiste (localStorage) |
| 10 | Reservar misma cancha/fecha/hora | Hora aparece "(Ocupado)" y disabled |

---

## Casos Edge

| # | Acción | Resultado Esperado |
|---|--------|-------------------|
| E1 | Fecha pasada (input date) | Navegador bloquea (min=today) |
| E2 | Teléfono inválido | HTML5 validation pide formato tel |
| E3 | Submit sin seleccionar hora | Select required bloquea |
| E4 | Click "Cancelar" en formulario | Se cierra, limpia campos, deselecciona cancha |
| E5 | Mobile viewport (375px) | Grid 1 columna, botones full-width |
| E6 | Desktop (>800px) | Grid 2-4 columnas, formulario centrado |

---

## Checklist Visual

- [x] Header verde con título blanco
- [x] Cards canchas con hover (levanta, sombra, borde verde)
- [x] Card seleccionada → fondo verde claro + borde verde oscuro
- [x] Formulario con inputs limpios, labels arriba
- [x] Select hora disabled hasta elegir fecha
- [x] Horas ocupadas grises, no clickeables
- [x] Botón primario verde, secundario gris
- [x] Tarjetas reservas con info clara, botón rojo "Cancelar"
- [x] Footer gris claro al final

---

## Debugging Común

```js
// En consola - ver bookings guardados
JSON.parse(localStorage.getItem('turnos_canchas_bookings'))

// Limpiar todo
localStorage.removeItem('turnos_canchas_bookings')
location.reload()
```

---

## Métricas de Éxito Etapa 1
- [x] 0 errores en consola
- [x] 0 warnings de accesibilidad (labels, semántica, contraste)
- [x] Funciona en Chrome, Firefox, Safari mobile
- [x] Tiempo carga < 200ms (local file vanilla)
- [x] Sin layout shift (CLS = 0)

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 🚀 Hoja de Ruta: [[03 - Etapas y Roadmap]]
- 🧪 Test Siguiente (Etapa 2): [[06 - Guia Test Etapa 2]]