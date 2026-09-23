# Constitución — Mini Service Desk

Principios no negociables del proyecto. El spec, el diseño y el código tienen que cumplirlos.
Si algo del spec choca con un principio, gana el principio. Para cambiarlo hay que editar este
archivo antes de tocar nada más.

Definida el 22/09/2026 (Sesión 3) a partir de seis preguntas respondidas de una en una.
Se apoya en `deep-research/deep-research-triaje-ia-seguridad-fisica.md` y `deep-research/deep-research-2a-pasada.md`.

## 1. La IA sugiere, la persona decide

Ningún ticket queda clasificado hasta que el operador acepta o corrige la sugerencia de
**categoría, urgencia e impacto**. La prioridad no se sugiere ni se confirma: sale de la matriz
a partir de la urgencia y el impacto ya confirmados (principio 5).

**Cómo se comprueba:** en los datos, un ticket sin confirmación del operador aparece como
"pendiente de confirmar", nunca como clasificado.

## 2. Ninguna acción sobre personas ni sobre el mundo físico

El sistema solo clasifica y muestra. No bloquea credenciales, no avisa a guardias y no escala
alarmas. Esas acciones las hace una persona fuera de la herramienta.

Lo que este principio prohíbe son acciones **sobre personas o sobre instalaciones**. Manejar los
propios datos del triaje no lo es: descargar el JSON confirmado o guardar en el navegador sí
están permitidos.

**Cómo se comprueba:** la app **no hace ninguna petición a un host externo**. La única petición
de red es `fetch("data/tickets.json")`, que lee un archivo del propio repo servido desde el mismo
origen: no sale a ninguna parte. No hay integraciones con sistemas de seguridad. Las únicas
salidas son pintar en pantalla, escribir en `localStorage` y descargar un archivo.

## 3. Solo datos sintéticos

Nunca se usan nombres, documentos de identidad, matrículas ni patrones de acceso de personas
reales, tampoco en pruebas.

**Cómo se comprueba:** el dataset está cerrado en 60 tickets, de `SVD-4100` a `SVD-4159`. No se
añaden tickets nuevos en este proyecto, así que se comprueba con un comando antes de subir
cualquier cambio del dataset:

```bash
python -c "import json;t=json.load(open('data/tickets.json',encoding='utf-8'));ids=[x['id'] for x in t];assert len(t)==60 and ids[0]=='SVD-4100' and ids[-1]=='SVD-4159' and len(set(ids))==60;print('dataset intacto: 60 tickets, SVD-4100 a SVD-4159')"
```

Si falla, hay tickets nuevos o borrados y el cambio no se sube. Los campos que sí se añaden
(`sugerencia`, `triaje`) los escribe Claude Code a partir del texto que ya existe, nunca de una
fuente externa.

*No hay hook de git que lo ejecute solo: es un comando que se corre a mano o desde el script de
validación de la Fase 4.*

**Texto libre del operador (enmienda del 23/09/2026).** El operador puede escribir notas y el
motivo de una corrección (spec R9), como en cualquier service desk real: sin eso no puede
cuestionar a la IA ni dejar constancia de lo que sabe. Es el único texto que no escribe Claude
Code, así que el principio se defiende de tres formas:

- junto a cada campo de texto, la app avisa de que no se escriban nombres, documentos de
  identidad, matrículas ni otros datos personales;
- la app **no deja guardar** un texto que tenga la forma de un DNI, un NIE o una matrícula
  española;
- los nombres propios no se pueden detectar de forma fiable: esa parte depende del operador y
  queda declarada como límite.

El texto del ticket (título, descripción y el resto de campos originales) sigue sin poder
editarse: las notas se **añaden**, nunca sustituyen lo que se reportó.

**Cómo se comprueba (texto libre):** las pruebas automáticas intentan guardar un DNI, un NIE y
una matrícula en una nota y en un motivo de corrección, y la app lo rechaza; y cada campo de
texto tiene el aviso a la vista.

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
dependencias externas y sin API keys. **Para usar la app** no hace falta instalar nada.

Esto incluye las **fuentes tipográficas**: nada de Google Fonts ni de CDNs. Se usa la pila de
fuentes del sistema.

**Excepción acotada, solo para probar (enmienda del 23/09/2026):** los tests end-to-end usan
Playwright Test, que necesita Node. Se permite un `package.json` con **solo `devDependencies`**
de herramientas de test. La app nunca carga nada de `node_modules`: quien solo quiera usarla o
enseñarla sigue sin instalar nada. Se decidió así porque los flujos de la bandeja no se pueden
probar de forma repetible sin un navegador automatizado, y probarlos a mano dejó bugs sin ver
(`docs/pruebas-fase3.md`).

**Cómo se comprueba:** `package.json`, si existe, no tiene `dependencies` (solo
`devDependencies`); `index.html`, `css/styles.css` y todo `js/` no contienen ninguna URL externa
(ni `<script src="http`, ni `<link href="http`, ni `@import`, ni `url(http`) ni referencias a
`node_modules`; y la app funciona sin conexión a internet con `python -m http.server 8000` en una
copia del repo **sin** `node_modules`.
