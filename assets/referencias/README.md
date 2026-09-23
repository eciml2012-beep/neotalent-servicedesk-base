# Referencias visuales

Capturas recogidas para la Fase 3. Se pararon en tres: Dribbble bloquea la búsqueda y las
fichas de shot ("Human Verification", HTTP 405) y solo deja las páginas de tag; MotionSites
resultó ser una galería de landing pages animadas y solo una pantalla pasó el filtro.
**No hay capturas de bentogrids.com ni de Securitas / Verisure**: la búsqueda se cortó antes.

## Los seis criterios

1. Tabla o lista densa y limpia
2. Color solo con significado (prioridad o estado)
3. Espacio visible para un motivo junto a la etiqueta
4. Acciones claras por fila o en panel lateral
5. Cómoda para 8 h: fondo claro no blanco puro, texto ≥ 14 px, sin animaciones
6. Cabecera con pocos KPIs

## Comparación

| Captura | 1 densa | 2 color | 3 motivo | 4 acciones | 5 8 h | 6 KPIs | Total |
|---|---|---|---|---|---|---|---|
| [Freight Command](motionsites/captura-1.png) — consola de operaciones | sí | sí | sí | sí | **no** | sí | **5/6** |
| [KirriDesk](dribbble/captura-2.png) — ficha con sugerencia de IA | no | sí | sí | sí | sí | **no** | **4/6** |
| [Beacon](dribbble/captura-1.png) — bandeja de soporte | sí | sí | **no** | sí | **no** | **no** | **3/6** |

## Qué tomamos de cada una

| Para | Captura | Qué nos llevamos |
|---|---|---|
| **Bandeja** | Freight Command | Los tres paneles (navegación con contadores / cola densa / detalle) y la tabla: ID, código, descripción recortada, fecha, y el estado reducido a **un punto de color**. Los filtros como chips con su línea "filtros activos / limpiar todo". Nos llevamos la estructura, **no la paleta**: su fondo casi negro es justo lo que `docs/diseno.md` descartó por fatiga. |
| **Ficha / panel lateral** | KirriDesk | La sugerencia de la IA dentro de **un bloque delimitado**, con su explicación visible y un botón **Accept & Send** al lado. Es el principio 1 y el R5 dibujados: la IA propone dentro de su caja, la persona acepta fuera de ella. Fondo gris claro, no blanco puro. |
| **Cabecera de KPIs** | Freight Command (franja superior) | Tres datos y nada más: total (191/192), red activa y un estado global. Sin tarjetas grandes, sin gráficos. Es lo más cerca que tenemos de una cabecera de KPIs; **el sitio que iba a cubrir esto era bentogrids.com y quedó sin recoger**. |

De Beacon, la tercera, solo nos llevamos un detalle para la fila de la bandeja: **dos etiquetas
separadas**, una de prioridad y otra de estado, en vez de mezclarlas en una sola.

## Lo que falta

- `bentogrids/` — vacío. Era la referencia prevista para la cabecera de KPIs.
- `securitas-verisure/` — vacío.
- Ninguna de las tres capturas resolvía el hueco del **motivo junto a la etiqueta en la fila**
  (R4 pide el motivo visible sin desplegar): Freight Command lo pone en el panel derecho,
  KirriDesk en la ficha. **Ya decidido**: va como segunda línea bajo el título, dentro de la
  propia fila — ver R4 de `docs/spec.md` y la pantalla "Bandeja" de `docs/wireframes-fase3/`.

## Elección del grupo (22/09/2026)

**Referencia principal: KirriDesk** (`dribbble/captura-2.png`).

Es la que mejor dibuja nuestra constitución:

- La sugerencia de la IA va en un bloque aparte, con su explicación visible (principio 4).
- Un botón explícito **Accept & Send** (principio 1): la IA propone y la persona decide.
- «Was this helpful?» para medir si la IA acierta (R7, tasa de corrección).
- Fondo gris claro y texto legible, cómodo para 8 horas.

Para la bandeja y la cabecera de KPIs se usa como apoyo la estructura de Freight Command,
pero con la paleta clara de `docs/diseno.md`.
