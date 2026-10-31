# Integración sin dependencias

Copiar `mascot.js`, `mascot.css`, `manifest.json` y `svg/` conservando rutas relativas. Servir con MIME correctos desde el mismo origen; no requiere CDN, fuentes externas, cookies ni seguimiento.

```html
<script type="module" src="/personajes/mascot.js"></script>
<legal-mascot id="presentador" character="don-lex" expression="duda" size="180"></legal-mascot>
<script type="module">
  await customElements.whenDefined('legal-mascot');
  document.querySelector('#presentador').play('alegria');
</script>
```

`character`: don-lex, trampin, lexi, brinco, lumina, aura, elion.
`expression`: alegria, duda, sorpresa, celebracion, desacuerdo, victoria.
`size`: 40–640 px. `label` permite describir el contexto; `decorative` elimina la redundancia accesible cuando ya existe texto equivalente. No colocar información indispensable solo en una expresión.

Alternativa sin JavaScript:

```html
<img src="/personajes/svg/aura/duda.svg" width="160" height="160"
     alt="Aura ofrece una pista" loading="lazy">
```

Sprite opcional: `<svg role="img" aria-label="Lexi explica"><use href="/personajes/characters-sprite.svg#lexi-alegria"></use></svg>`. Definir viewBox 0 0 320 320 y dimensiones. Preferir SVG individuales para cargar únicamente los necesarios.

La animación usa transformaciones CSS del contenedor, no cambia la geometría por fotograma. Respeta prefers-reduced-motion, visibilidad de página y viewport. No se reproduce automáticamente. Cada expresión conserva un estado estático legible. Sin requestAnimationFrame, filtros costosos o librerías de animación. La galería precarga solo recursos visibles mediante imágenes lazy.

Las capas back/body/arms/head/accessory/decoration preparan el dibujo para evolución; la animación actual mueve el conjunto. En React/Next puede envolverse el custom element en un componente cliente, importándolo en useEffect y declarando su tipo JSX. No se ha instalado en ningún portal existente.

## Ampliaciones

Conservar IDs de personajes y expresiones. Añadir entradas al generador y manifest, regenerar y verificar. Para Lottie hace falta crear y validar un rig específico; no renombrar SVG a JSON. Evitar parpadeos, movimiento continuo y audio automático. Compartir siempre contenido editorial genérico, nunca estado del jugador.
