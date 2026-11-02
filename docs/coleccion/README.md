# Antes de que te pase, juega — revisión independiente

Colección completa: sucesiones, familia, arrendamientos y vivienda, responsabilidad civil y consumo, penal y extranjería; diez casos por especialidad y tres alternativas por caso. Sin Laboral ni cooperativas. No se modifica ningún componente del portal ni de la beta. No se integra todavía un acceso desde producción. El primer diseño completo está conservado en el commit 5abef9a; este encargo posterior cambia cuatro especialidades sin rehacer el motor.

## Desarrollo y revisión

- Rama: `feat/coleccion-juridica`, basada en `origin/main` (`30f3765`).
- Fuentes editables: `web/coleccion-juridica/catalog.json` y `data/*.json`. Cada caso incluye hechos, opciones, índice de respuesta, explicación, matiz, fuentes y texto de consulta.
- Interfaz: `app.js`, `collection.css`, `index.html`. Sin dependencias de ejecución, backend, formularios o base de datos.
- Compilación: `node scripts/build-collection-preview.mjs` → `collection-preview-dist/`.
- Servidor de revisión local: `python3 -m http.server 3201 --directory collection-preview-dist`. Es una dirección local, no un enlace público.
- Rutas físicas `/coleccion-juridica/{sucesiones,familia,vivienda,consumo,penal,extranjeria}/`, con HTML y metadatos propios; no requieren reescrituras SPA. La recarga vuelve a la introducción, como se informa en la interfaz.
- `COLLECTION_PREVIEW_ORIGIN` o `RENDER_EXTERNAL_URL` establece canonical, og:url e imagen absoluta al compilar. Cada especialidad tiene su PNG social original de 1200 × 630.
- El build rechaza los nombres y dominios del portal y de la beta, además de cualquier `RENDER_GIT_BRANCH` distinto del de la colección. No ejecuta el build editorial ni incorpora clientes, administración o la beta.

## Pruebas reproducibles

```sh
node scripts/build-collection-preview.mjs
node --test tests/coleccion/content.test.mjs
# Instalar las herramientas fuera del frontend:
npm install --prefix /tmp/collection-tools --cache /tmp/npm-cache playwright @axe-core/playwright
PLAYWRIGHT_MODULE=/tmp/collection-tools/node_modules/playwright/index.mjs AXE_MODULE=/tmp/collection-tools/node_modules/@axe-core/playwright/dist/index.mjs node tests/coleccion/browser.mjs
```

El sandbox de esta sesión requiere habilitar red adicional también para abrir sockets locales y lanzar Chromium. No desactivar el proxy ni la verificación TLS. La compilación y la app no dependen de red externa. `scripts/collection-social-images.mjs` regenera los PNG de difusión con Playwright.

`browser-results.json` documenta los doce recorridos completos (120 decisiones: los sesenta aciertos en móvil y sesenta errores en escritorio), reinicio, recarga, enlaces, compartir nativo simulado, cancelación, copia y alternativa manual, descarga de tarjeta, contacto, consola y auditoría Axe. Anchos: 390 y 1440 px; además, 320 px con movimiento reducido. Las pruebas del diálogo nativo son simuladas: no implican un envío a otra persona.

No se han probado Safari/iPhone físicos, Android real, lectores de pantalla ni la salida acústica física. Chromium comprueba progreso del reloj de reproducción, readyState, un solo canal musical y pausa/reanudación ante visibilidad. El resultado no se basa en un AudioContext «running». Los archivos y motor se copiaron del commit de beta `6039620` a un directorio nuevo; se mantienen variantes de nivel codificado para iOS y carga bajo demanda. Música discreta, sin cuenta atrás. Controles independientes de música y efectos, prueba de reproducción y diagnóstico local. El usuario confirmó que la beta se oye en su iPhone; no se atribuye esa prueba a la nueva colección.

## Beta conservada y comparación

La API de Render confirma el portal `srv-db6araad0e5s73a2524g`, rama `main`, build `node deploy.mjs`, salida `dist`, autoDeploy activo. La beta es `srv-dbje2lmtlv9c73cv5ukg`, rama `feat/elenco-esto-es-legal`, build `node scripts/build-game-preview.mjs`, salida `preview-dist`, autoDeploy desactivado. Ninguno se modifica.

La navegación HTTPS de Chromium hacia la beta falla por el certificado del proxy. Se revisó visualmente una copia local de sus recursos, del commit coincidente con el marcador público. No se afirma una inspección visual directa del despliegue. `beta-verificacion.json` verifica 25 recursos publicados por HTTPS contra sus hashes; todos coinciden con el marcador. `beta-referencia.png` es la copia local, no una captura remota.

## Contacto y privacidad

Destino real reutilizado de `build.mjs` y `config.json`: WhatsApp `34634330504`. Se utiliza un mensaje genérico por materia; el usuario decide si enviarlo. La página alternativa es `https://inavarro-abogados.onrender.com/contacto/`. No se enviaron mensajes ni formularios de prueba. No se inventan honorarios, reserva confirmada ni disponibilidad.

No se encontró analítica/consentimiento en los archivos públicos inspeccionados. La colección no instala trackers, cookies, storage persistente ni rankings. `inavarro:game` emite eventos locales sin identidad, texto, decisiones individuales ni puntuación. Eventos: `collection_enter`, `specialty_select`, `game_start`, `game_complete`, `share_native`, `share_copy`, `share_card_download`, `consult_click`. El adaptador opcional `window.iNavarroAnalytics` solo recibe datos si `hasConsent()` devuelve `true`. Un clic se mide como clic, nunca como contratación. La pregunta final opcional no se registra ni se usa para publicidad.

## Publicación posterior

Esta entrega es de revisión. Tras revisar contenido y probar audio/compartir en dispositivos físicos, decidir expresamente la integración en el portal. Mantener `/esto-es-legal/` y el servicio de beta intactos. La futura instalación deberá añadir una ruta nueva y un acceso específico; no sustituir ni redirigir la beta. No fusionar automáticamente esta rama ni desplegarla en los servicios existentes.

## Revisión jurídica concreta

`DOSSIER-JURIDICO.md` contiene los 60 supuestos, las 180 opciones, respuesta, explicación, matiz, ámbito territorial, fecha y puntos concretos a revisar. Toda revisión humana está pendiente. `python3 scripts/verify-collection-sources.py` repite las descargas oficiales y comprueba existencia de artículos; no es una revisión jurídica humana. `python3 scripts/collection-review-dossier.py` regenera el dossier.
