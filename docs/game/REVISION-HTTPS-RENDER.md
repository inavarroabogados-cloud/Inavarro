# Enlace HTTPS de revisión separado de producción

## Resultado de la comprobación del entorno — 1 de noviembre de 2026

Herramientas disponibles inspeccionadas y estado actual del entorno consultado: sin capacidad de alojamiento público/preview, sin forwarding HTTPS público expuesto, sin identidad ni credenciales de un proveedor de previews. No hay túnel configurado; no se ha accedido al servicio Render de producción. La red restringida no habilita proveedores de túnel o alojamiento temporal. No se ha cambiado esa política ni se ha presentado localhost como enlace accesible desde un iPhone.

No existe una URL HTTPS publicada o verificada en esta entrega. Tampoco hay iPhone físico conectado ni WebKit instalado en este entorno Linux. Las comprobaciones táctiles con Chromium no acreditan Safari real.

## Configurar desde el móvil sin entregar ninguna API Key

Usar el dashboard de Render autenticándose personalmente. No hace falta conceder a Codex acceso a la cuenta para este alta manual.

1. Abrir https://dashboard.render.com/ y elegir **New → Static Site**. Crear un sitio nuevo; **no abrir para editar el servicio `inavarro-abogados`** ni usar un Blueprint de toda la aplicación.
2. Seleccionar el repositorio **`inavarroabogados-cloud/Inavarro`**. Si es posible, usar la opción de repositorio Git público con `https://github.com/inavarroabogados-cloud/Inavarro`. Elegir explícitamente la rama **`feat/elenco-esto-es-legal`**, nunca `main`.
3. Nombre sugerido para el servicio nuevo: **`esto-es-legal-demo`**. Si está ocupado, elegir otro nombre para la demo. La URL válida será la que Render asigne; no se presupone un dominio disponible.
4. Root Directory: vacío (raíz del repositorio).
5. Build Command: **`node scripts/build-game-preview.mjs`**.
6. Publish Directory: **`preview-dist`**.
7. **Auto-Deploy: Off / Disabled** (según la etiqueta del dashboard). Desactivar antes de finalizar; no usar «On Commit» ni «After CI». No activar previews automáticas de pull requests ni crear hooks.
8. Variables de entorno: ninguna para el juego. Sin API Keys, servicios de base de datos, backend, funciones ni panel editorial. Sin reglas globales de reescritura SPA. Mantener el nombre/dominio nuevo de la demo; no asociar el dominio principal.
9. Usar solo una modalidad sin coste si está disponible en la cuenta. Si Render indica un cargo o exige cambiar un plan, detener el alta: no se ha aprobado contratar nada.
10. Crear el sitio nuevo o solicitar **Manual Deploy → Deploy latest commit**. Esa publicación inicial es una acción manual, no autorización para desplegar automáticamente futuros pushes. Esperar al final del build y comprobar los registros.

La creación puede iniciar su primer build inmediatamente. Antes de confirmarla, revisar repositorio, rama, comando, directorio y Auto-Deploy. Nada de lo anterior requiere fusionar main o modificar producción. No pulsar botones de deploy del servicio existente.

## Qué contiene la compilación aislada

`preview-dist/` incluye únicamente el juego demo, banco de casos ficticios de contenido provisional, siete personajes, 42 SVG, animaciones, galería y tarjetas públicas. No ejecuta `build-render.mjs`, no consulta noticias remotas, no usa secretos y no incluye `game-editor`, clientes, administración, datos locales ni la herramienta de consultas. El enlace a consultas se sustituye en esta salida por vuelta al juego.

La raíz dirige a `/esto-es-legal/`. `robots.txt` y metadatos indican noindex; esto evita solicitar indexación, **no crea protección por contraseña**. El juego de demostración queda accesible a quien tenga la URL. Solo contiene casos ficticios y no admite introducir información confidencial.

El build rechaza explícitamente el nombre/dominio de producción y, si Render informa de otra rama, también rechaza `main`. La imagen Open Graph se reescribe al dominio de la nueva demo para no apuntar a producción.

Marcador de versión: `/preview-version.json`, con tipo `game-demo-only`, SHA y `administration:false`. Se conserva la identidad y las ilustraciones. No se instala un servidor de desarrollo ni un backend en Render.

## Verificar la URL y Safari en el iPhone

1. Copiar del dashboard la URL HTTPS real del **nuevo** servicio y abrir `/esto-es-legal/` en Safari. No adivinar el nombre del dominio.
2. Confirmar candado HTTPS y contenido de demostración. Revisar `/preview-version.json`: debe corresponder al commit desplegado de la rama de revisión.
3. Con volumen audible, pulsar **«¡Vamos a jugar!»**: la música se solicita dentro de ese gesto. El control superior debe pasar a «Desactivar música». Si Safari no permite el audio, debe poder continuarse sin bloqueo y activarlo desde el control superior. Los efectos siguen siendo opcionales.
4. Completar cinco preguntas con toques, pedir una pista, leer explicaciones, obtener la recompensa y reiniciar. Girar el iPhone, aumentar texto y probar «Reducir movimiento».
5. En reto rápido, cambiar de aplicación y volver: tiempo pausado, con reanudación manual. Comprobar mute explícito antes de jugar: debe respetarse.
6. Probar la tarjeta y el menú nativo de compartir en HTTPS. Cancelar no debe mostrar un envío realizado.
7. Confirmar que `/game-editor/`, `/administracion/`, `/clientes/`, `/.env` y `/game-editor/data/questions.json` no sirven panel ni datos (normalmente 404). No añadir rewrites que oculten esas comprobaciones.

Puedes facilitar la URL pública de la demo para comprobar desde aquí estado HTTP, recursos, versión y recorrido automatizado. **Nunca enviar claves ni credenciales por el chat.** No se afirmará una prueba en Safari/iPhone físico sin haberla realizado: debe registrarse por separado de la emulación.

## Retirar o restaurar la revisión

Al terminar, suspender o eliminar exclusivamente el nuevo Static Site de demostración desde su propio dashboard. No borrar repositorios ni el servicio `inavarro-abogados`. Para volver a una versión anterior de la demo, usar solo su despliegue anterior verificado o desplegar manualmente el commit de revisión correspondiente. Auto-Deploy debe continuar desactivado.
