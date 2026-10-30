# Guía de Test Rápido - Etapa 4: Vitrina Comercial (Landing) & Navegación SPA

> **Guía de Aseguramiento de Calidad y Pruebas para la Etapa 4.**
> Entorno: Servidor local Node/Express en `http://localhost:3000/v1/` con Supabase configurado.
> Enfoque: Verificación visual, navegación SPA suave, enlaces comerciales y acceso a login unificado.

---

## Cómo Probar
1. Configurar Supabase según [[15 - Autenticacion y Reservas por Cuenta]].
2. Iniciar el servidor local si no está corriendo: `npm start` o `node server.js`.
3. Abrir el navegador en `http://localhost:3000/v1/`.
4. Probar en resolución de escritorio (1200px+) y en modo responsive móvil (375px / 390px en DevTools).

---

## Casos de Prueba (Happy Path Etapa 4)

| # | Acción | Resultado Esperado |
|---|--------|-------------------|
| **1** | Carga inicial del sitio | Se despliega el Hero Banner de *"La Bombonerita Fútbol Club"* con fondo deportivo oscuro, badge *"🟢 Abierto hoy (09:00 - 00:00)"* y la barra de navegación fija superior. |
| **2** | Scroll descendente por la página | La barra de navegación se mantiene visible (`sticky: top: 0`) y el ítem activo se resalta según la sección visible en pantalla. |
| **3** | Click en botón CTA `[⚽ Reservar Turno Ahora]` del Hero | La página realiza un scroll suave (`smooth scroll`) hasta la sección de reservas sin recargar ni parpadear. |
| **4** | Click en botón `[📋 Mercado de Fichajes]` del Hero | Desplaza suavemente hasta la sección `#fichajes` (CV de jugadores y anuncios urgentes). |
| **5** | Visualización de la grilla de Instalaciones | Se renderizan 6 tarjetas con iconos emoji/SVG (Césped Sintético, Iluminación LED, Vestuarios, Quinchos/Parrillas, Buffet, Estacionamiento) alineadas en grid responsivo. |
| **6** | Revisión del bloque "El Tercer Tiempo" | Tarjeta destacada con borde luminoso dorado promocionando el quincho/asado post-partido. |
| **7** | Click en el botón flotante de WhatsApp | Abre una nueva pestaña hacia `https://wa.me/543874797240` con el texto de consulta predeterminado. |
| **8** | Click en el enlace de dirección en Salta | Abre enlace a Google Maps apuntando a la zona de Limache / Salta Capital. |
| **9** | Click en `[👤 Iniciar Sesión]` de la barra superior | Abre el acceso real de Supabase para clientes y administradores. |
| **10** | Iniciar sesión con una cuenta cuyo perfil tenga rol `admin` | Acceso al Panel de Control. Una cuenta cliente no obtiene privilegios de administración. |

---

## Casos Edge, Responsive y Rendimiento

| # | Acción | Resultado Esperado |
|---|--------|-------------------|
| **E1** | Navegación rápida haciendo clic consecutivo en todos los enlaces de la barra | El scroll suave responde con fluidez sin saltos bruscos ni desalineación del tope (respetando `scroll-margin-top`). |
| **E2** | Vista móvil (pantalla de 360px de ancho) | La barra de navegación permite scroll horizontal táctil sin desbordar el viewport horizontal (`overflow-x: auto; no scroll horizontal global`). |
| **E3** | Clic en el botón flotante de WhatsApp en pantalla pequeña | El botón flotante no tapa campos críticos ni botones de confirmación del formulario de reservas. |
| **E4** | Modo sin conexión / Fallback de fuentes | Si Google Fonts no carga, el diseño preserva la legibilidad utilizando fuentes del sistema (`sans-serif`, `system-ui`). |
| **E5** | Rendimiento y peso de la página | La Landing no debe solicitar imágenes externas pesadas (emplea gradientes CSS y formas nativas). Carga instantánea (<200ms en local). |

---

## Checklist Visual y UX (Auditoría con ui-ux-pro-max & Impeccable)

- [ ] **Jerarquía Tipográfica**: Encabezados en *Barlow Condensed* (mayúsculas, impacto deportivo) y textos de cuerpo en *Inter / Roboto*.
- [ ] **Paleta de Colores**: Fondos oscuros deportivos (`#0f172a`), verde césped (`#15803d` / `#14532d`) y acentos lima/dorado (`#84cc16` / `#eab308`).
- [ ] **Touch Targets**: Todos los botones y enlaces de navegación tienen al menos 48px de alto/ancho para facilitar el toque en teléfonos.
- [ ] **Contraste de Texto (WCAG AA)**: Textos claros con ratio ≥ 4.5:1 sobre los fondos oscuros.
- [ ] **Acceso Unificado**: Presencia de `[👤 Iniciar Sesión]` en lugar del botón `[🛠️ Admin]`.

---

## Métricas de Éxito de la Etapa 4
- [ ] 0 errores en consola del navegador al navegar por todas las secciones.
- [ ] 0 recargas de página al saltar entre Landing, Reservas y Fichajes (comportamiento SPA 100% nativo).
- [ ] Cero dependencias npm en el frontend (Vanilla CSS + JS puro).
- [ ] Tiempo de render inicial (FCP) estimado < 0.5s.

---
**Navegación del Grafo:**
- 🏠 Hub Principal: [[00 - Hub Central del Proyecto]]
- 🚀 Hoja de Ruta: [[03 - Etapas y Roadmap]]
- 📋 Especificación Etapa 4: [[10 - Especificacion Etapa 4 - Vitrina Comercial]]
- 🧪 Test Anterior (Etapa 3): [[07 - Guia Test Etapa 3]]
- 📜 Registro Técnico: [[04 - Log Tecnico y Cambios]]
