# A · Auditoría técnica con evidencias

## Alcance y método

Revisiones: portal `290e12e9d8bd7f5eca82827d0555d5162b1de507` (P) y herramienta `5da3576da187353c9041fade572ad769e3e6996f` (T). Las referencias P y T indican el repositorio y revisión, no el estado publicado. Se usan tres categorías: **C: confirmado en código/pruebas**, **R: riesgo potencial**, **V: requiere producción o configuración externa**. No se hicieron ataques al servicio, accesos a cuentas ni transferencias de documentos.

El portal privado no está ausente: su fuente y bundle están comprimidos dentro de `P/portal-release.mjs:7`. Se extrajeron a `/tmp` sin ejecutar ese archivo. Los nombres `S/source/src/…` y `S/source/edge/…` se refieren a las entradas originales de ese snapshot, con su numeración original. [Extractos verificables](evidencias/snapshot-codigo.md). La copia pública solo incorpora entradas `public/`, no el `.env` fuente (`P/portal-release.mjs:8–11`). No se incluyen valores de variables en esta auditoría.

Permalinks base: [P](https://github.com/inavarroabogados-cloud/Inavarro/tree/290e12e9d8bd7f5eca82827d0555d5162b1de507) · [T](https://github.com/inavarroabogados-cloud/INAVARRO-repositorio/tree/5da3576da187353c9041fade572ad769e3e6996f).

## Arquitectura y tecnologías reales

| Parte | Implementación confirmada | Límite |
| --- | --- | --- |
| Web pública | Node ESM, plantillas HTML en strings, JSON editorial, CSS, generación de RSS/sitemap/SVG | No hay package.json del generador raíz ni módulos pequeños de plantillas; líneas muy largas dificultan revisión |
| Build Render | `deploy.mjs` extrae assets y ejecuta `build-render.mjs`; este descarga noticias y ensambla portal, clientes y herramienta | Depende de una fuente remota mutable y paquetes comprimidos |
| Área privada | React 19.2.6 + Vite 8.0.13 + TypeScript 5.9.3 + supabase-js 2.102.0 en snapshot | El build principal copia bundle; no recompila ni prueba esta app |
| Herramienta | Next 16.4.3, React/ReactDOM 19.3.1 y TypeScript 5.9.3 según lockfile; exportación estática | Su actualización llega al portal mediante tar manual de otro repositorio |
| Drive | Handler JS aislado, llamadas a Supabase y Google OAuth/Drive | El código no acredita qué función está desplegada ni sus permisos reales |
| Operación | Python estándar para Render API, Git, pruebas unittest | No hay secreto Render disponible en esta sesión; vinculación real pendiente |

Evidencias: `P/build.mjs:1–13`, `P/deploy.mjs:1–3`, [P/build-render.mjs:1–23](https://github.com/inavarroabogados-cloud/Inavarro/blob/290e12e9d8bd7f5eca82827d0555d5162b1de507/build-render.mjs#L1-L23), `P/portal-release.mjs:7–11`, `S/source/package.json:1`, `T/package.json:5–30`, `T/package-lock.json`, `T/next.config.ts:2`.

## Inventario de rutas y capacidades

Las 34 páginas HTML generadas localmente incluyen páginas auxiliares de error. No son 34 servicios ni se afirma que todas estén publicadas.

| Rutas | Comportamiento en código | Estado de capacidad |
| --- | --- | --- |
| `/`, `/noticias/{slug}/`, `/politica-editorial/`, `/feed.xml` | Noticias, fuentes, FAQ, tarjetas y enlaces de compartir | Generación existente; fuentes jurídicas pendientes de contraste independiente |
| `/servicios/`, siete páginas de servicio, `/despacho/` | Información profesional y contacto | Existente en código; datos y textos deben revisarse periódicamente |
| `/contacto/` | Selector de tema que prepara una URL de WhatsApp; tel/mailto | No es backend de recepción ni agenda. No acredita entrega o reserva |
| `/enlaces/`, `/instagram/` | Enlaces públicos y contenido social | No existe publicación automática en redes demostrada |
| `/clientes/`, `/clientes/acceso/`, `/administracion/`, `/privacidad-clientes/` | Entrada, SPA de autenticación y funciones de asuntos/documentos | Implementación parcial existente; autorización, altas y proveedores requieren prueba externa |
| `/y-ahora-que/`, `/orientador/`, `/contacto/`, `/guias/{slug}/`, `/legal/{slug}/` bajo ese prefijo | Preparación de consulta en memoria, impresión, cuatro guías y tarjetas | Demostración deliberada, no motor de asesoramiento ni gestión comercial |

Evidencias: `P/build.mjs:15–19,27–33`, `P/build-render.mjs:25–53,146–154`, `P/portal-release.mjs:28–33`, `T/app`, `T/lib/orientador.ts:2–19`.

**C — Contacto:** el formulario de `P/build.mjs:30,33` no recibe nombre ni teléfono; usa una categoría general y redirige a WhatsApp. La categoría puede ir en `?asunto=` (`P/build.mjs:25`), pero el orientador no incorpora sus respuestas a URLs. `T/components/Contact.tsx:5–7` permite revisar un mensaje, usa canales externos y no tiene proveedor de envío. No se ha probado envío real ni efectuado ninguno. No existen en el código revisado agenda, recepción y seguimiento de consultas, facturas o presupuestos.

## Hallazgos

### H01 · Dependencia crítica de autorización externa — R / V, crítica si las políticas fallan

La UI lee asuntos y documentos con `select('*')` y realiza escrituras de casos, permisos y compartición desde el cliente. Eso puede ser seguro **solo si** RLS, permisos, funciones SQL y Storage aplican los controles correctos. No hay migraciones SQL ni políticas versionadas en los árboles auditados. Tampoco se ha consultado la BD real.

Evidencia: `S/source/src/api.ts:6–16`, `S/source/src/main.tsx:13,26`, contenido completo de los árboles P y T. La UI de administrador no es una barrera de autorización. Hace falta demostrar rechazo entre dos clientes distintos, un usuario sin asignación y un usuario anónimo, tanto en tablas como Storage y RPC; no se ha demostrado una exposición.

### H02 · Sesión y privilegios del personal — C + R / V, alta

La sesión Supabase se persiste en `localStorage`; el frontend admite contraseñas nuevas de 6–128 caracteres. El handler exige sesión y pertenencia a staff, pero no comprueba explícitamente un nivel MFA. No aparece flujo de segundo factor en la UI suministrada. Una XSS podría afectar tokens accesibles a JavaScript. Se desconoce si la configuración o políticas reales añaden controles de MFA, caducidad y rate limiting.

Evidencia: `S/source/src/client.ts:2–8`, `S/source/src/main.tsx:16–21,29`, `S/source/edge/handler.mjs:23–36`. Priorizar MFA del personal y prueba de step-up servidor/RLS; no migrar sesiones a cookies sin diseñar también CSRF, revocación y callbacks.

### H03 · Validación de archivos y escrituras administrativas — C + R / V, alta

La restricción de 10 MB, MIME y firma inicial se aplica en JS del navegador antes de subir a Storage. El control `documentation_ready` y la activación se representan en el cliente. Son buenas ayudas UX, pero no acreditan límites efectivos en bucket/BD. El handler Drive vuelve a validar bytes y acceso al copiar; eso no protege por sí solo la subida inicial a Supabase. No se acredita cuarentena o análisis antimalware.

Evidencia: `S/source/src/api.ts:9–16,20`, `S/source/src/Portal.tsx:19,24`, `S/source/edge/handler.mjs:70–75`. Verificar controles servidor/bucket con archivos ficticios y acceso directo a APIs, nunca expedientes reales.

### H04 · Dos almacenamientos y revocaciones independientes — C + R / V, alta

El código copia a Drive solo tras aprobación del personal, registra auditoría y conserva el original si una actualización es ambigua. Son controles positivos. También quedan copias en Supabase y permisos de Google gestionados aparte. Revocar en el portal no demuestra revocación en Drive. La UI lo advierte. Descarga interna sigue usando Supabase; los enlaces de Drive visibles se limitan en la UI al personal. No se ha demostrado que un cliente reciba un enlace de Drive.

Evidencia: `S/source/src/Portal.tsx:22–24,27–33`, `S/source/src/api.ts:22–35`, `S/source/edge/handler.mjs:35–43,75–79,90–118`, `P/portal-release.mjs:33`. Falta verificar inventario, ACL, región, conservación, copias huérfanas y restauración conjunta. No ejecutar traslados adicionales como parte de esta auditoría.

### H05 · Fuente editorial mutable y afirmación de verificación — C + R / V, alta

El build obtiene noticias de un dominio histórico de ChatGPT y sustituye los JSON locales. Valida estructura, fechas y HTTPS, pero no comprueba que una URL corresponda al texto citado ni guarda una aprobación jurídica firmada o un snapshot de la fuente. El HTML dice «Fuentes comprobadas» y el log «verified» a partir de esos datos. Esa validación técnica no acredita veracidad jurídica.

Evidencia: `P/build-render.mjs:8–23`, `P/build.mjs:11,16–17`, `P/EDITORIAL.md:3–9`. `P/posts.json:3–19` contiene afirmaciones sobre una reforma normativa y referencias BOE que **no se han verificado contra el BOE en esta auditoría**. No se califican aquí como falsas ni verdaderas. Requieren revisión jurídica prioritaria, con evidencia y fecha reales. Ningún ECLI, resolución o testimonio debe completarse por suposición.

### H06 · Fuente comprimida, publicación manual de artefactos y falta de trazabilidad — C + R, alta

Hay fuente y lockfile recuperables del portal, pero contenidos en un único literal comprimido; carruseles ocupan gran parte de `build-render.mjs`, y la herramienta llega como `orientador-static.tar.gz`. El build no demuestra el SHA de origen de cada subartefacto ni ejecuta sus pruebas. El marcador de despliegue identifica el commit del portal, no el de la herramienta embebida.

Evidencia: `P/portal-release.mjs:7–11`, `P/build-render.mjs:57–144,151–154`, `P/install-orientador.mjs:5–7`, `P/README.md:9–13`. El JS/CSS privado se reprodujeron byte a byte en esta auditoría: no se ha detectado una discrepancia fuente-bundle; falta automatizar esa garantía.

### H07 · Dependencia vulnerable en desarrollo — C, alta según npm; exposición condicionada

`npm audit` informa **un paquete con gravedad alta**: Vite 8.0.13 en el snapshot. Los avisos incluyen `launch-editor` y restricciones del servidor de desarrollo. No es evidencia de ejecución remota en los archivos estáticos de Render. Actualizar a una versión corregida compatible y probar builds, sin exponer servidores de desarrollo. La herramienta no presenta avisos según el registro consultado; eso no certifica ausencia de vulnerabilidades.

Evidencia: `S/source/package.json:1`, lockfile y [resultado de dependencias](evidencias/dependencias.json). Ejemplos de advisories: GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22. npm propone Vite 8.3.5 al momento de la consulta. No se actualizó ninguna dependencia.

### H08 · Navegación y marcas de entorno inconsistentes — C, media

El enlace «Inicio» del portal apunta todavía al dominio histórico `imanol-navarro-despacho…chatgpt.site`; se confirmó también en HTML generado. El build sí reescribe el origen de canonical a la URL configurada, por lo que no debe confundirse ese enlace con todos los metadatos. Hay tonos y tipografías próximos, pero no un único sistema de diseño compartido entre las tres interfaces.

Evidencia: `P/build.mjs:13`, `P/build-render.mjs:13`, `T/app/globals.css:1`, `S/source/src/styles.css:1–6`. Unificar navegación y tokens sin rehacer la marca iNavarro/iN ni cambiar URLs sin redirecciones aprobadas.

### H09 · Cabeceras de seguridad y modo demo — C + V, media/alta

Next configura cabeceras para su servidor, pero la exportación no las aplica al hosting estático. El instalador añade CSP por meta y referrer al orientador; `frame-ancestors`, HSTS y otras cabeceras necesitan configuración del alojamiento. La CSP permite scripts inline. La fuente del portal público escapa HTML y `<` en JSON, una protección positiva; no se ha demostrado XSS por esos caminos.

Evidencia: `T/next.config.ts:2`, `P/install-orientador.mjs:8–16`, `P/build.mjs:8,13`, `P/social.mjs:18`. No se pudieron medir cabeceras reales de Render. El modo demo y sus bloqueos están confirmados en `T/lib/firm.ts:4–12`, `T/app/layout.tsx:6–9`. El despliegue estático empaquetado no se revalida automáticamente contra cambios posteriores de la configuración fuente.

### H10 · Rendimiento, móvil y Core Web Vitals — C local / V producción

Portal público mayormente estático, sin necesidad de hidratar toda la portada; app privada: JS de 407.782 bytes (117,00 kB gzip según Vite) y CSS de 3.844 bytes. El tar de la herramienta tiene 112 archivos y 3.763.591 bytes descomprimidos; incluye la misma fuente de 759.720 bytes en dos rutas. **Tamaño del paquete no equivale a transferencia inicial** ni prueba que el navegador descargue dos copias.

24 combinaciones locales (seis pantallas × 360, 390, 768 y 1440 px), con fuentes cargadas, no mostraron scroll horizontal ni infracciones axe A/AA seleccionadas. Solo se probó el estado no autenticado del portal. No hay medición de CWV, percentil de usuarios, caché, CDN, latencia, compresión o carga real en Render. Objetivos a medir, no resultados: LCP ≤2,5 s, INP ≤200 ms y CLS ≤0,1 en p75 móvil cuando exista muestra suficiente.

Evidencias: `S/public/assets/index-D3dEEBZr.js`, `T/public/fonts/symbols.ttf`, `T/app/globals.css`, [resultados locales](evidencias/accesibilidad-local.json). Axe no prueba conformidad completa WCAG 2.2 AA; faltan teclado/lector de pantalla y pantallas autenticadas con datos ficticios.

### H11 · SEO y privacidad — C + R / V, media

El portal genera títulos/descripciones, canonical, schema LegalService/BlogPosting, RSS y sitemap; las rutas privadas llevan noindex. La herramienta demo lleva noindex y sitemap vacío deliberadamente. Su `robots.txt` queda bajo `/y-ahora-que/robots.txt`, que no gobierna el dominio: el noindex de cada página es el control efectivo, no ese robots anidado. Noindex tampoco sustituye autenticación.

Evidencia: `P/build.mjs:12–19`, `S/source/index.html:1`, `T/app/robots.ts:1–3`, `T/app/sitemap.ts:1–4`, `T/lib/content.ts:7–11`. No se han confirmado Search Console, indexación, redirecciones, 404 verdaderos ni correspondencia jurídica del schema. La herramienta contiene borradores legales y configuración pendiente: no elevarlos a textos definitivos por un cambio de bandera. El aviso de no persistencia aplica al orientador, no a la sesión autenticada del portal.

La versión de información de privacidad usada para registrar lecturas sigue siendo `2026-10-12-password`, mientras el ensamblador cambia la fecha visible al 21 de octubre y añade información sobre Drive (`S/source/src/client.ts:8`, `P/portal-release.mjs:18–23,33`). Es una discordancia técnica de trazabilidad: debe vincularse la versión al texto real. No implica por sí sola que se necesite pedir consentimiento de nuevo para cualquier actualización.

### H12 · Despliegue, pruebas y restauración — C + R / V, alta

El runner comprueba servicio/repo/rama, publica SHA exacto, sigue estado y valida HTML/marcador. Sus 19 tests son simulados y pasan. No hay workflows `.github/workflows` versionados en las revisiones auditadas; las reglas de protección, checks externos, autodeploy y backup reales no se pudieron inspeccionar. La palabra «PUBLICACIÓN VERIFICADA» del runner exige varias comprobaciones, pero `build_logs` solo cuenta indicadores de error: no bloquea por ellos ni garantiza una revisión humana de mensajes. Un build `live` con mensajes de error necesita diagnóstico antes de declararse limpio.

Evidencia: `P/ops/render.py:97–124,128–164,196–260`, `P/tests/test_render.py:1–101`, `P/ops/render.json:1–17`. La API key está ausente en esta sesión. La prueba HTTP pública falló en el **proxy CONNECT con 403**, antes de contactar con el sitio: no es evidencia de un HTTP 403 del portal, caída o 404 actual. No se ejecutó ningún comando deploy.

### H14 · Compensación de subida ante respuesta ambigua — C de código / R de pérdida, alta

En `S/source/src/api.ts:16`, cualquier error al insertar los metadatos provoca un intento de borrar el objeto recién subido. Si la inserción hubiera persistido y solo se hubiera perdido su respuesta, podría quedar una referencia a un objeto borrado. No se reprodujo ni se afirma una pérdida real. Contrasta con el handler Drive, que conserva la copia ante respuestas ambiguas (`S/source/edge/handler.mjs:106–114`). Diseñar estados pendientes, reconciliación idempotente y limpieza solo tras acreditar ausencia de referencia, con tests de timeout posterior al commit. No ejecutar esas pruebas con documentos reales.

## Pruebas ejecutadas y pendientes

| Comprobación actual | Resultado | Lo que no demuestra |
| --- | --- | --- |
| Runner Render unittest | 19/19 aprobadas | Acceso/API reales o despliegue correcto |
| Handler Drive aislado | 5/5 aprobadas con HTTP ficticio | RLS, ACL y OAuth efectivos |
| Reglas del orientador | 7/7 aprobadas; tipos aprobados | Revisión jurídica de los contenidos |
| Snapshot privado | npm ci, tsc y vite build aprobados; JS/CSS coinciden exactamente | Backend o configuración Supabase en producción |
| Portal completo en copia temporal | Build con fixture de noticias aprobado | Disponibilidad de la fuente editorial remota |
| Axe y overflow | 24/24 comprobaciones sin hallazgos locales | Pantallas autenticadas, lector de pantalla y CWV reales |
| Orientador en subruta | Desconocidos, corrección, aviso de plazo y reinicio aprobados; sin persistencia | Recepción real de una consulta o reserva |
| npm audit | Herramienta 0 avisos; portal 1 paquete high | Ausencia universal de vulnerabilidades |
| Web/Render | Acceso bloqueado por red; API sin credencial | Estado publicado, configuración y rendimiento reales |

No se ha calculado cobertura de líneas ni se inventa un porcentaje. Faltan contratos API, RLS/Storage/RPC, usuarios cruzados, concurrencia, errores de correo/calendario, restore completo, escaneo de archivos y una prueba real del runner en entorno autorizado.
