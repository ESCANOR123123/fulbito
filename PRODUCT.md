# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Football groups and captains in Salta looking for a nearby venue and a simple way to request a pitch booking.
- The complex owner or administrator, who manages pitches, blocked time slots, and bookings.
- Individual amateur footballers seeking teams through the player marketplace.

## Product Purpose

Turnos Canchas is a commercial website for La Bombonerita Fútbol Club in Salta. It presents the venue, supports pitch bookings, and connects available players with teams. The user intends to develop it as a commercial product that could later be sold.

## Positioning

The product brings venue discovery and booking together with an amateur football marketplace for players and teams.

## Operating Context

Most customer journeys happen on mobile, often when arranging a match at short notice. Customers need an account to book and see their reservations. The owner uses the admin area to manage pitches, blocked slots, bookings, and player moderation. Supabase Auth, shared bookings, venue configuration, and Fichajes data use Supabase/PostgreSQL.

## Capabilities and Constraints

- Current capabilities: venue landing page, pitch selection, account registration/sign-in, customer reservation history, shared booking slots, admin booking summaries/CSV, admin-managed pitches and blocked slots, and Fichajes profiles, filters, reports, urgent notices, and moderation.
- Current stack: Node.js/Express and Supabase Auth/PostgreSQL. React 19 + Vite + Tailwind power the landing, customer booking flow, Fichajes, and administration panel in `frontend/`. The Vanilla version remains at `/v1` as a historical fallback.
- Keep the implementation simple and mobile-first; avoid unnecessary dependencies.
- Remaining verification: test Fichajes operations and row-level security with at least two accounts. Production hosting, verified SMTP/domain, and a verified migration path for legacy local reservations/configuration are not in place yet.

## Brand Commitments

- Product and venue name: La Bombonerita Fútbol Club.
- Location: Zona Sur / Limache, Salta Capital, Argentina.
- Official venue WhatsApp recorded in project documentation: +54 387 4797240.
- The product uses Spanish (Argentina) and football-club language.

## Evidence on Hand

- Product specifications and decisions are in `Docs/`.
- Existing runnable web interface is in `public/`.
- No verified venue photography, customer testimonials, or commercial performance evidence is present. Do not invent these.

## Product Principles

- Make finding and reserving a pitch straightforward.
- Support the social nature of amateur football.
- Prioritize mobile use and short, direct interactions.
- Keep implementation maintainable and avoid needless complexity.
- Be clear about what is implemented versus planned.
