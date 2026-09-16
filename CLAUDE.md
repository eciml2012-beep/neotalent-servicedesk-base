# CLAUDE.md

Contexto para Claude Code en el repo **Mini Service Desk**: bandeja de incidencias de un
servicio de seguridad ficticio. Es el proyecto hilo de la formación de Neotalent y se construye
por fases entre la Sesión 2 y la Sesión 4. El detalle está en `README.md`.

## Estado actual

- Estamos en la **Sesión 2**. `index.html`, `css/styles.css` y `js/app.js` son placeholders: solo
  comprueban que `data/tickets.json` carga.
- `docs/spec.md` y `docs/diseno.md` están vacíos. Se completan en la Sesión 3 (Fases 1 y 2).
- `js/components/` y `js/utils/` solo tienen un README.
- **No adelantes fases.** No construyas la interfaz sin un spec escrito en `docs/spec.md`. Si
  te piden implementar algo y el spec está vacío, avisa y propón escribirlo primero.

## Stack y restricciones

- HTML, CSS y JavaScript planos. **Sin build, sin npm, sin frameworks y sin dependencias
  externas.** Tiene que funcionar en cualquier portátil sin instalar nada.
- Sin backend. Todo es estático.
- Sin API keys. La clasificación de tickets (prioridad y categoría) la hace **Claude Code sobre el
  repo**, no el navegador.
- Idioma: español para textos de la interfaz, comentarios, documentación y mensajes de commit.
  Los identificadores de los datos ya están en español (`titulo`, `zona`…); sigue esa convención.

## Cómo ver la app

`js/app.js` usa `fetch("data/tickets.json")`, y los navegadores bloquean `fetch` sobre `file://`.
Al abrir `index.html` con doble clic puede aparecer "No se ha podido cargar data/tickets.json".
Para probar, sirve la carpeta con un servidor estático, por ejemplo:

```bash
python -m http.server 8000
```

y abre http://localhost:8000.

## Arquitectura (responsabilidades)

| Ruta | Responsabilidad | Reglas |
|---|---|---|
| `index.html` | Punto de entrada y estructura del DOM | Carga `css/styles.css` y `js/app.js` |
| `css/styles.css` | Estilos | Sin lógica |
| `js/app.js` | Orquesta: carga el dataset, gestiona el estado y monta la pantalla | Es el **único** que lee `data/tickets.json` en el navegador |
| `js/components/` | UI reutilizable (fila de ticket, ficha, filtro), un archivo por pieza | Reciben datos por parámetro; **no** hacen `fetch` del dataset |
| `js/utils/` | Funciones puras (filtrar, formatear fecha, agrupar) | Sin estado y **sin tocar el DOM** |
| `data/tickets.json` | Dataset sintético | Ver abajo |
| `docs/` | `spec.md` (Fase 1) y `diseno.md` (Fase 2) | El spec es la entrada del desarrollo |

## Dataset: `data/tickets.json`

Array de 60 tickets, ids `SVD-4100` a `SVD-4159`, con fechas del 2026-09-01 al 2026-09-14.
Campos de cada ticket:

| Campo | Tipo | Valores |
|---|---|---|
| `id` | string | `SVD-NNNN` |
| `titulo` | string | libre |
| `descripcion` | string | libre |
| `sistema_afectado` | string | Control de accesos, SailPoint (identidades), CCTV / videovigilancia, Central de alarmas, Centralita de guardia, App de rondas |
| `reportado_por` | string | Guardia de seguridad, Jefe de turno, Coordinador de zona, Recepción cliente, Administración, Técnico de mantenimiento |
| `zona` | string | 12 zonas (Aparcamiento -1, Nave logística 2, Perímetro exterior, Sala de servidores…) |
| `fecha` | string | `YYYY-MM-DD` |
| `estado` | string | `abierto` (50) o `cerrado` (10) |

Reglas:

- Los datos son **inventados**. No añadas nombres, empresas ni datos de clientes reales.
- Los tickets **todavía no tienen** `prioridad` ni `categoria`. Los valores posibles de esos campos
  y el lugar donde se guardan se deciden en el spec. No inventes los valores antes.
- No borres ni reescribas tickets existentes sin que te lo pidan. Si clasificas, añade campos y
  conserva los originales.
- Después de editar el JSON, comprueba que sigue siendo JSON válido.

## Hoja de ruta

| Sesión | Fase |
|---|---|
| 2 | Fork del repo, Project en Claude y este `CLAUDE.md` |
| 3 | Fase 1 Spec (`docs/spec.md`), Fase 2 Diseño con Artifacts (`docs/diseno.md`), Fase 3 Desarrollo |
| 4 | Fase 4 Tests y validación del dataset, Fase 5 Despliegue, Fase 6 Automatización del triaje en n8n |

Cuando termine una fase, actualiza la sección **Estado actual** de este archivo y, si cambió la
estructura, la tabla del `README.md`.
