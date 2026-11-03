# Colección pública — Antes de que te pase, juega

Seis especialidades y sesenta supuestos completos: sucesiones, familia, vivienda, responsabilidad civil y consumo, penal y extranjería. Motor común y bancos independientes. No se incluyen cooperativas, expedientes ni datos de clientes.

## Construcción e integración

- `node scripts/build-collection-preview.mjs`: revisión aislada en `collection-preview-dist`. Conserva las guardas que impiden utilizar ese comando sobre producción o la beta.
- `scripts/build-collection.mjs`: constructor común, valida los seis bancos y solo reemplaza su propio directorio `coleccion-juridica`.
- `install-collection.mjs`: instala en `dist/coleccion-juridica/`, genera canonicals y metadatos de producción y añade acceso en portada y enlaces. Se ejecuta al final del build existente, después de la beta y la herramienta. No sustituye el portal, clientes ni noticias.
- `SITE_ORIGIN=https://inavarro-abogados.onrender.com node deploy.mjs`: compilación completa del portal existente más colección. En un entorno con proxy, Node puede necesitar `NODE_USE_ENV_PROXY=1`.
- Versión pública específica: `/coleccion-juridica/version.json`. Versión completa del portal: `/deployment.json`.
- Rutas físicas por juego; funcionan por enlace directo y recarga sin catch-all SPA.

## Contenido

`web/coleccion-juridica/catalog.json` y `data/*.json` son las fuentes editables. `DOSSIER-JURIDICO.md` refleja exactamente los 60 casos, sus 180 opciones y los fundamentos. `NOTAS-NORMATIVAS.md` registra correcciones, vigencia y acceso a jurisprudencia. Verificación documental de Codex el 3-11-2026; no se atribuye aprobación profesional humana.

Los campos editoriales permanecen en las fuentes y el dossier; no se incluyen en el banco público ni se muestran como etiquetas internas en la interfaz. El juego informa de su carácter divulgativo y del ámbito territorial. Los resultados no acreditan competencia ni predicen el éxito de un asunto real.

## Pruebas

```sh
node --test tests/coleccion/content.test.mjs
npm install --prefix /tmp/collection-tools --cache /tmp/npm-cache playwright @axe-core/playwright
PLAYWRIGHT_MODULE=/tmp/collection-tools/node_modules/playwright/index.mjs AXE_MODULE=/tmp/collection-tools/node_modules/@axe-core/playwright/dist/index.mjs node tests/coleccion/browser.mjs
python3 -m unittest discover -s tests -p 'test_render.py'
```

El test de navegador usa `dist` por defecto. `COLLECTION_TEST_ORIGIN` permite comprobar una URL real, `COLLECTION_TEST_OUTPUT` separa capturas/evidencia, y `COLLECTION_BROWSER_PROXY` permite usar el proxy configurado sin desactivar TLS. Chromium: 390 y 1440 px, además de 320 px con movimiento reducido. Se comprueban sesenta aciertos y sesenta errores, explicación, puntuación, final, reinicio, recarga, enlaces, consentimiento del adaptador, compartir simulado, cancelación, copia y alternativa manual, tarjeta, contacto y Axe. La captura de portada carga las ilustraciones antes de obtener la imagen completa.

Música original y efectos por archivos del motor media-files-v4 de la beta, sin descarga musical antes del gesto. Un único canal musical durante la navegación, controles independientes, niveles compatibles con iOS, pausa y reanudación. El avance de reproducción en Chromium no demuestra salida acústica física. No se afirma prueba de esta versión en un iPhone real. El usuario confirmó previamente el sonido de la beta, que conserva sus archivos y su servicio.

## Privacidad y contacto

No hay registro, datos sensibles, storage persistente, ranking público ni analítica externa instalada. Los eventos no contienen decisiones, identidad ni textos de consultas. El adaptador opcional exige consentimiento explícito. Compartir es voluntario; consultar abre WhatsApp con mensaje genérico por materia, sin resultados ni respuestas. Destinos reutilizados del proyecto: `https://wa.me/34634330504` y `/contacto/`. No se envían mensajes de prueba.

## Producción

Servicio existente confirmado mediante Render MCP en el workspace autorizado: `srv-db6araad0e5s73a2524g`, repositorio Inavarro, rama `main`, comando `node deploy.mjs`, salida `dist`, autoDeploy activo. Un push a main puede publicar: integrar solo después de superar las comprobaciones y seguir ese despliegue, sin crear uno duplicado.

La beta permanece en `srv-dbje2lmtlv9c73cv5ukg`, rama `feat/elenco-esto-es-legal`, commit `6039620`, y entrada pública `/esto-es-legal/`. Su instalador, recursos y servicio no se modifican. La revisión separada mantiene autoDeploy desactivado. La evidencia final de despliegue se registra fuera de la salida cliente e incluye ID, logs, estado terminal, SHA y comprobaciones HTTP/navegador.

Se intentó ejecutar Playwright WebKit 27.2. La descarga terminó, pero no el arranque, por seis bibliotecas ausentes; la consulta de paquetes en este entorno tampoco permitió obtenerlas. `webkit-status.json` registra esa limitación. No se presenta como una prueba de Safari superada.
