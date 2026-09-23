# UAT — pruebas de aceptación de usuario

Las hace **una persona**, no Claude Code. `tests/e2e/aceptacion.spec.js` comprueba que cada historia
*se puede* cumplir; esto comprueba que *sirve* a quien va a usar la bandeja: si se entiende, si es
cómoda, si da confianza. Es lo único que una aserción no puede juzgar.

**Quién:** alguien que haga de operador de triaje (idealmente quien no la ha programado).
**Duración:** unos 20 minutos.
**Preparación:** `python -m http.server 8000` y abrir http://localhost:8000 en una ventana de
incógnito (sin datos de pruebas anteriores). No hace falta Node ni instalar nada.

Marca cada paso: ✅ como se espera · ❌ no · ❓ confuso (aunque funcione). Apunta todo lo ❓.

## Escenarios (uno por historia de usuario del spec)

**H1 · Decidir sin abrir la ficha.** Mira la bandeja 30 segundos sin pulsar nada.
- [ ] Sé qué ticket atender primero y por qué.
- [ ] Distingo lo que sugiere la IA de lo que ya decidió una persona.
- [ ] El motivo de cada sugerencia se entiende sin abrir la ficha.

**H2 · Aceptar con un clic.** Abre `SVD-4102` y acéptalo.
- [ ] Queda claro qué estoy aceptando antes de pulsar.
- [ ] Tras aceptar, sé dónde ha ido el ticket.

**H3 · Corregir.** Abre `SVD-4104`, corrígelo a urgencia Alta, escribe el motivo y guarda.
- [ ] Veo cómo cambia la prioridad antes de guardar.
- [ ] Entiendo por qué no puedo guardar hasta escribir el motivo.
- [ ] Si elijo «Brecha de seguridad activa», entiendo por qué no puedo cambiar la urgencia.

**H4 · Nada sin revisar.** Vuelve a la bandeja.
- [ ] Los «Sin clasificar» destacan y entiendo por qué no tienen botón Aceptar.

**H5 · Exportar.** Pulsa Exportar.
- [ ] Encuentro el archivo descargado y su nombre tiene la fecha de hoy.
- [ ] La cabecera deja de avisar de cambios sin exportar.

**H6 · No perder trabajo.** Corrige otro ticket y cierra la pestaña.
- [ ] El navegador me avisa antes de cerrar.

**H7 · Métricas.** Abre Métricas.
- [ ] Entiendo qué significa la tasa de corrección y qué dice de la IA.

**H8 · Explicar una corrección.** Abre otra vez `SVD-4104`.
- [ ] Veo mi motivo junto a lo que sugirió la IA y se entiende en qué se equivocó.

**H9 · Anotar.** En la ficha de `SVD-4110`, añade una nota. Luego intenta añadir otra con un DNI inventado.
- [ ] La nota queda con su fecha y la descripción del ticket no ha cambiado.
- [ ] Entiendo por qué la segunda no se puede guardar.
- [ ] Echo en falta (o no) poder editar o borrar una nota: anótalo en observaciones.

## Revisión visual y de comodidad

- [ ] Las capturas de `tests/e2e/visual.spec.js-snapshots/` son como debe verse la app
      (aprobarlas convierte en "correctas" las referencias de la regresión visual).
- [ ] Tema oscuro: se lee bien y cansa menos que el claro con poca luz.
- [ ] Ventana estrecha o móvil: se puede usar.
- [ ] Con el teclado solo (Tab, Enter) puedo triar un ticket.
- [ ] (Opcional) Con el lector de pantalla del sistema (Narrador en Windows) se entiende la bandeja.

## Acta de aceptación

| Campo | Valor |
|---|---|
| Fecha | |
| Persona | |
| Escenarios ✅ / ❌ / ❓ | |
| Observaciones | |
| Decisión | Aceptada · Aceptada con observaciones · No aceptada |
