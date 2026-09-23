# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Contexto para Claude Code en el repo **Mini Service Desk**: bandeja de incidencias de un
servicio de seguridad ficticio. Es el proyecto hilo de la formación de Neotalent y se construye
por fases entre la Sesión 2 y la Sesión 4. El detalle del proyecto está en `README.md`.

## Cómo se pide un diseño aquí

**Nunca se pide una pantalla sin enseñar antes una referencia.** La estructura de la app ya está
decidida —la piel de KirriDesk sobre la paleta de la Fase 2, ver `docs/diseno.md`— así que no
propongas un diseño nuevo: aplica ese. Si hiciera falta una pantalla que el diseño no cubre,
busca antes una referencia y compárala con los 6 criterios de `assets/referencias/README.md`.

## Estado actual

**Sesión 3 — Fases 1 y 2 terminadas, Fase 3 (desarrollo) sin empezar.**

- `docs/constitution.md`, `docs/spec.md` y `docs/diseno.md` están escritos.
- `index.html`, `css/styles.css` y `js/app.js` siguen siendo **placeholders**: solo comprueban
  que `data/tickets.json` carga.
- `js/components/` y `js/utils/` solo tienen un README.
- `data/tickets.json` **todavía no tiene** el objeto `sugerencia`. Escribirlo es la primera
  tarea de la Fase 3.

Cuando termine una fase, actualiza esta sección y, si cambió la estructura, la tabla del
`README.md`.

## Jerarquía documental (Spec Driven Development)

El orden importa. Si dos documentos chocan, gana el de más arriba:

| Orden | Archivo | Qué manda |
|---|---|---|
| 1 | `docs/constitution.md` | Seis principios no negociables, cada uno con su comprobación. Para cambiarlos hay que editar ese archivo **antes** de tocar nada más |
| 2 | `docs/spec.md` | Qué construir: requisitos R1–R8, casos límite, fuera de alcance y criterios de finalización |
| 3 | `docs/diseno.md` | Cómo se ve: flujo de pantallas, la decisión tabla clara + interruptor oscuro, tipografía y contraste |
| — | `docs/revision-qa-spec.md` | Primera revisión QA del spec, **ya resuelta**. Registro de qué se detectó y qué se decidió, con el archivo donde quedó cada decisión |
| — | `docs/revision-qa-spec-2.md` | Segunda revisión QA, cruzando spec con diseño, **ya resuelta** (20/20, la última tanda el 23/09/2026). Mismo formato que la primera |
| — | `docs/categorias-triaje.md` | Las 7 categorías de triaje con su definición y su reparto sobre los 60 tickets |
| — | `assets/referencias/` | Las capturas de la Fase 2, los 6 criterios con los que se filtraron y la comparación. La estructura elegida es **KirriDesk** (`dribbble/captura-2.png`) |
| — | `docs/proceso-sesion3.md` | Cómo se llegó hasta aquí, paso a paso. Contexto, no normativa |
| — | `deep-research/` | La evidencia de la que salen los principios. Consulta solo si necesitas la fuente de una decisión |

**No implementes nada que contradiga un principio de la constitución.** Si el spec pide algo que
choca, dilo en vez de elegir por tu cuenta.

## Los seis principios, en corto

1. **La IA sugiere, la persona decide.** Ningún ticket queda clasificado sin que el operador
   acepte o corrija. Nunca hay un "aceptar todo".
2. **Ninguna acción sobre personas ni sobre el mundo físico.** No se bloquean credenciales, no
   se avisa a guardias, no se escalan alarmas. El sistema clasifica y muestra.
3. **Solo datos sintéticos.** Nunca nombres, DNI, matrículas ni patrones de acceso reales,
   tampoco en pruebas.
4. **Toda sugerencia se explica.** Una sugerencia sin `motivo` no se muestra.
5. **Prioridad por matriz propia**, no por intuición ni copiada de TI. La IA no inventa la
   prioridad: la calcula la app.
6. **Stack plano, sin instalar nada.** Sin npm, sin build, sin frameworks, sin backend, sin
   dependencias externas, sin API keys.

## Stack y restricciones

- HTML, CSS y JavaScript planos. **Sin build, sin npm, sin frameworks y sin dependencias
  externas.** Tiene que funcionar en cualquier portátil sin instalar nada.
- Sin backend. Todo es estático. La persistencia es `localStorage` + exportar un JSON.
- Sin API keys. La clasificación de tickets la hace **Claude Code sobre el repo**, no el
  navegador.
- Idioma: español para textos de interfaz, comentarios, documentación y mensajes de commit.
  Los identificadores de los datos ya están en español (`titulo`, `zona`…); sigue esa convención.

## Comandos

No hay build, ni linter, ni framework de tests. Lo único que se ejecuta:

**Levantar la app** (obligatorio: `fetch` sobre `file://` está bloqueado por el navegador):

```bash
python -m http.server 8000
```

Luego abre http://localhost:8000. Con doble clic sobre `index.html` verás
"No se ha podido cargar data/tickets.json".

**Validar el JSON después de editarlo** — obligatorio tras cualquier clasificación:

```bash
python -m json.tool data/tickets.json > /dev/null && echo "JSON valido"
```

**Comprobar el criterio de finalización 1** (los 60 tickets con sugerencia y ningún motivo vacío):

```bash
python -c "import json;t=json.load(open('data/tickets.json',encoding='utf-8'));print(len(t),'tickets;',sum(1 for x in t if x.get('sugerencia',{}).get('motivo')),'con motivo')"
```

Los tests de la Fase 4 (Sesión 4) todavía no existen.

## Arquitectura

La frontera que define el proyecto: **Claude Code clasifica sobre el repo, el navegador solo
muestra.** El modelo nunca corre en el cliente.

```
Claude Code (aquí)          data/tickets.json          Navegador
─────────────────────       ─────────────────          ─────────────────────
lee los 60 tickets    ───>  escribe "sugerencia"  ───> app.js lo carga (1 vez)
                            {categoria, urgencia,       utils/ calcula prioridad
                             impacto, motivo}           components/ pintan
                                                        confirmaciones → localStorage
                                                        "Exportar" → JSON de vuelta
```

| Ruta | Responsabilidad | Reglas |
|---|---|---|
| `index.html` | Punto de entrada y estructura del DOM | Carga `css/styles.css` y `js/app.js` |
| `css/styles.css` | Estilos | Sin lógica |
| `js/app.js` | Orquesta: carga el dataset, gestiona el estado, monta la pantalla | **Único** que lee `data/tickets.json` en el navegador |
| `js/components/` | UI reutilizable (fila, ficha, filtro), un archivo por pieza | Reciben datos por parámetro; **no** hacen `fetch` |
| `js/utils/` | Funciones puras (matriz de prioridad, filtrar, formatear, agrupar) | Sin estado y **sin tocar el DOM** |
| `data/tickets.json` | Dataset sintético | Ver abajo |

La prioridad **no se guarda**: es una función pura de `js/utils/` sobre urgencia × impacto. Esto
es lo que hace verificable el principio 5.

El texto de un ticket se pinta siempre con `textContent`, nunca con `innerHTML` (spec, casos
límite).

## Dataset: `data/tickets.json`

Array de 60 tickets, ids `SVD-4100` a `SVD-4159`, fechas del 2026-09-01 al 2026-09-14.

| Campo | Tipo | Valores |
|---|---|---|
| `id` | string | `SVD-NNNN` |
| `titulo` / `descripcion` | string | libre |
| `sistema_afectado` | string | Control de accesos, SailPoint (identidades), CCTV / videovigilancia, Central de alarmas, Centralita de guardia, App de rondas |
| `reportado_por` | string | Guardia de seguridad, Jefe de turno, Coordinador de zona, Recepción cliente, Administración, Técnico de mantenimiento |
| `zona` | string | 12 zonas (Aparcamiento -1, Nave logística 2, Perímetro exterior, Sala de servidores…) |
| `fecha` | string | `YYYY-MM-DD` |
| `estado` | string | `abierto` (50) o `cerrado` (10) |

**Campo que añade la Fase 3** (spec R1), sin tocar los originales:

```json
"sugerencia": {
  "categoria": "Brecha de seguridad activa",
  "urgencia": "Alta",
  "impacto": "Alto",
  "motivo": "La alarma perimetral quedó desactivada tras un mantenimiento: el perímetro está sin vigilancia ahora."
}
```

- `categoria`: una de las 7 de `docs/categorias-triaje.md`, o `"Sin clasificar"`.
- `urgencia`: `Alta` | `Media` | `Baja`. `impacto`: `Alto` | `Medio` | `Bajo`.
  Con `"Sin clasificar"`, ambos valen `null`.
- `motivo`: **nunca vacío** (tampoco en «Sin clasificar»: ahí explica por qué no se pudo),
  mínimo 40 caracteres, y cita hechos del propio ticket (principio 4).
- **Sin prioridad**: la calcula la app con la matriz del spec R3.
- La combinación categoría × urgencia debe cumplir la tabla de coherencia del spec R8.

Reglas del dataset:

- Los datos son **inventados**. No añadas nombres, empresas ni datos de clientes reales.
- No borres ni reescribas tickets existentes. Al clasificar, **añade** `sugerencia` y conserva
  todo lo demás.
- Comprueba que el JSON sigue siendo válido después de editarlo.
- El navegador **nunca** sobrescribe `data/tickets.json`; exporta un archivo aparte.

## Antes de implementar la Fase 3

`docs/revision-qa-spec.md` y `docs/revision-qa-spec-2.md` están **resueltos**: entre los dos, 40
hallazgos con decisión, cada uno con el archivo donde quedó. Léelos si te preguntas por qué una
regla del spec es como es.

Lo único que sigue siendo criterio del equipo y no evidencia:

- **Las tres zonas críticas** de R2 (`Perímetro exterior`, `Sala de servidores`,
  `Torre de control`) definen el impacto Alto y por tanto la prioridad de 21 de los 60 tickets.
  Es una decisión editable, no un dato del dominio. Si cambia, hay que reclasificar.
- **La tasa de corrección** (R7) como proxy de precisión: el deep research no respalda ninguna
  metodología de medición, así que es decisión propia. Está declarado como tal.

Trampas al implementar, todas trazadas a una decisión:

- La **prioridad no se guarda ni se edita**: es una función pura de urgencia × impacto. Añadirla
  como campo del JSON rompe el principio 5.
- Los **10 tickets cerrados sí entran** en "Pendientes de confirmar". El filtro por defecto de la
  bandeja es por estado del triaje, no por estado del ticket.
- Una **«Brecha de seguridad activa» nunca es impacto Bajo**: su impacto sale siempre de la zona,
  aunque el ticket hable de una sola persona. Un permiso sin revocar expone la zona.
- **«Sin clasificar» no es un estado del triaje**, es un valor de `categoria`. Los dos ejes son
  independientes y un «Sin clasificar» cuenta como pendiente.
- **Dos claves de `localStorage`**, no una: `svd-triaje` y `svd-tema`.
- Con `categoria: "Sin clasificar"`, **`urgencia` e `impacto` son `null`** y `motivo` sigue siendo
  obligatorio.

## Hoja de ruta

| Sesión | Fase | Estado |
|---|---|---|
| 2 | Fork del repo, Project en Claude y este `CLAUDE.md` | ✅ |
| 3 | Fase 1 Spec, Fase 2 Diseño con Artifacts, Fase 3 Desarrollo | Fases 1-2 ✅, Fase 3 pendiente |
| 4 | Fase 4 Tests y validación del dataset, Fase 5 Despliegue, Fase 6 Automatización del triaje en n8n | Pendiente |
