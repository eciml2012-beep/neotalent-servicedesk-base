# components/

Piezas de interfaz reutilizables. Reciben datos ya derivados por parámetro (ver
`js/utils/estado-ticket.js`); ninguna hace `fetch` ni lee `localStorage` directamente.

- `fila-ticket.js` — una fila de la bandeja.
- `barra-filtros.js` — los desplegables de filtro de la bandeja.
- `ficha-ticket.js` — la ficha de un ticket, en modo ver y en modo corregir.
- `panel-metricas.js` — el panel de métricas, solo lectura.
