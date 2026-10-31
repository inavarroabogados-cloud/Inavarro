# Integración del elenco «¿ESTO ES LEGAL?»

Ruta propuesta: `/esto-es-legal/`. Galería interactiva del elenco, no un juego completo. La portada y las páginas de enlaces/Instagram reciben un acceso explícito que indica que el juego está en preparación. Se conserva noindex en la galería hasta su revisión editorial. No se añaden al sitemap páginas no indexables.

Los 42 SVG, el componente, las 21 tarjetas SVG/PNG y documentación están versionados en `web/esto-es-legal/`. Sin fuentes, bibliotecas o peticiones externas. Los textos describen personajes y no ofrecen conclusiones jurídicas. No se modifica la autenticación ni el área privada.

`install-personajes.mjs` copia los archivos al resultado estático y añade enlaces de forma idempotente solo a tres entradas públicas. Se ejecuta desde `build.mjs` y vuelve a aplicarse tras las páginas específicas de `build-render.mjs`. Compatible con `node deploy.mjs`, sin cambiar variables Render.

## Comprobaciones realizadas

- `tar -xzf assets.tar.gz` y `node build.mjs`: correctos, usando noticias locales existentes.
- `node --test tests/test_personajes.mjs`: prueba de idempotencia, conservación de página privada y 42 estados/42 recursos sociales existentes.
- 19 pruebas del runner Render: correctas con fixtures; no prueban publicación real.
- Chromium: portada → galería → Aura → duda → descarga historia PNG (HTTP 200).
- Movimiento reducido respetado, sin errores JavaScript.
- Anchos 360, 390, 768 y 1440: sin desbordamiento; axe sin incidencias A/AA detectadas. No equivale a certificación completa de accesibilidad.
- No se ha ejecutado build-render completo: depende de la fuente editorial externa; la compilación estática local sí se ha ejecutado.

## Publicación y restauración

Rama de trabajo: `feat/elenco-esto-es-legal`. No modificar ni fusionar main para preparar la revisión. Acceso Render no disponible: `python3 ops/render.py inspect` informa de que falta `RENDER_API_KEY`. Seguir `DEPLOYMENT.md` para añadirla en los ajustes seguros del entorno, nunca en chat o repositorio; permitir API y dominio del servicio en la configuración de red.

Tras autorización y revisión: fusionar PR, verificar la rama real con inspect, publicar el SHA con `ops/render.py deploy --commit SHA` y comprobar registros, marcador de versión, portada y `/esto-es-legal/`, incluidos SVG y descargas. No afirmar publicación antes de ello.

Restauración: revertir el commit de integración mediante PR y publicar el nuevo SHA verificado. La modificación es aditiva, no migra ni elimina datos. Alternativamente, si Render dispone de rollback, restaurar el último despliegue confirmado y verificar su versión y sus rutas. No cambiar secretos ni borrar contenido.
