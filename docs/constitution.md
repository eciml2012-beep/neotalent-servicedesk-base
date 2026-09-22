# Constitución — Mini Service Desk

Principios no negociables del proyecto. El spec, el diseño y el código tienen que cumplirlos.
Si algo del spec choca con un principio, gana el principio. Para cambiarlo hay que editar este
archivo antes de tocar nada más.

Definida el 22/09/2026 (Sesión 3) a partir de seis preguntas respondidas de una en una.
Se apoya en `deep-research/deep-research-triaje-ia-seguridad-fisica.md` y `deep-research/deep-research-2a-pasada.md`.

## 1. La IA sugiere, la persona decide

Ningún ticket queda clasificado hasta que el operador acepta o corrige la sugerencia de
categoría y prioridad.

**Cómo se comprueba:** en los datos, un ticket sin confirmación del operador aparece como
"pendiente de confirmar", nunca como clasificado.

## 2. Ninguna acción sobre personas ni sobre el mundo físico

El sistema solo clasifica y muestra. No bloquea credenciales, no avisa a guardias y no escala
alarmas. Esas acciones las hace una persona fuera de la herramienta.

**Cómo se comprueba:** no hay en la interfaz ni en el código ningún botón, función o llamada que
ejecute una acción fuera de la bandeja.

## 3. Solo datos sintéticos

Nunca se usan nombres, documentos de identidad, matrículas ni patrones de acceso de personas
reales, tampoco en pruebas.

**Cómo se comprueba:** `data/tickets.json` y cualquier dato nuevo son ficticios. Si se añade un
ticket, se revisa antes del commit que no contenga datos de nadie real.

## 4. Toda sugerencia se explica

Junto a cada sugerencia de la IA se ve siempre el motivo: los hechos o las palabras del ticket
que la justifican. Una sugerencia sin motivo no se muestra.

**Cómo se comprueba:** ningún ticket con sugerencia tiene el campo de motivo vacío, y el motivo se
ve en la bandeja sin necesidad de abrir el detalle.

## 5. Prioridad por matriz propia, no por intuición

La prioridad se calcula con una matriz de urgencia × impacto propia de seguridad física,
definida en el spec. No se copia una matriz de TI y la IA no inventa la prioridad.

**Cómo se comprueba:** para cualquier ticket, la prioridad mostrada coincide con la que da la
matriz del spec para su urgencia y su impacto.

## 6. Stack plano, sin instalar nada

HTML, CSS y JavaScript planos. Sin npm, sin build, sin frameworks, sin backend, sin
dependencias externas y sin API keys.

**Cómo se comprueba:** no existen `package.json` ni `node_modules`, `index.html` no carga ningún
script externo, y la app funciona con `python -m http.server 8000`.
