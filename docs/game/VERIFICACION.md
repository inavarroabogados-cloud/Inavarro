# Verificación de la versión jugable

Fecha: 31 de octubre de 2026. Pruebas locales; no publicación en Render.

## Ejecutado

- Compilación estática `node build.mjs` e instalación del orientador estático existente, sin cambiar sus fuentes. Ambos correctos.
- `node --test tests/game/*.test.mjs tests/test_personajes.mjs`: **14 pruebas correctas**. Cubren selección de cinco preguntas/niveles y 250 rondas de variación de los 15 casos, puntos y rachas, pistas, timeout, duplicados, privacidad del enlace, audio con contexto simulado, validación editorial y preservación byte a byte de las 42 ilustraciones y el componente original.
- El test del servidor privado arranca una instancia aislada con contraseña aleatoria y datos ficticios temporales. Comprueba autenticación, 401/403, CSRF, rate limit 429, rechazo 422/413, control de versión 409, copia JSON, permisos POSIX, fallo 500 con almacén dañado sin falso guardado, cierre de sesión y exclusión de la ruta de archivos de datos.
- 19 pruebas existentes del runner Render con fixtures: correctas. **No son despliegues reales**, aunque sus mensajes simulen estados de deploy.
- Chromium/Playwright: cinco aciertos con pista (570 puntos), cinco errores (0), recompensa positiva, reinicio, pausa/reanudación/agotamiento del reloj (tiempo virtual), confirmación de salida, sonido opt-in, reducción de movimiento, PNG descargado y controles de compartir.
- Compartir: origen público ficticio interceptado localmente; Web Share éxito/cancelación/error, falta de API y denegación de portapapeles. URL sin query ni fragmento, mensaje de WhatsApp sin puntuaciones/respuestas. No se enviaron mensajes ni se contactó con Instagram/WhatsApp.
- Editor en navegador: entrada con contraseña temporal, errores asociados a campos, guardado de borrador ficticio y cierre de sesión. Panel privado ausente del servidor estático (404).
- Teclado: entrar al juego, foco en enunciado, Tab a respuesta, Enter para elegir, foco en explicación, Tab/Enter para avanzar. Galería conservada: seleccionar Elion y victoria.
- Axe: inicio, explicación y resultado a **360, 390, 768 y 1440 px**, más editor a 390 px: **sin incidencias detectadas** en las reglas A/AA ejecutadas. Sin desbordamiento horizontal. Resultados brutos: `browser-results.json`.
- Inspección visual de inicio móvil/escritorio, partida, resultado y editor; capturas PNG adjuntas.
- Validación sintáctica de módulos nuevos y `git diff --check`: correctas.

## No probado / pendiente

No hay dispositivo iPhone físico ni motor WebKit instalado en este entorno: las capturas móviles son Chromium con viewport/táctil, no Safari real. Falta comprobar audio, pestaña oculta, Web Share de archivos y guardado de imagen en Safari/iOS sobre HTTPS antes de publicar. No se ha escuchado el audio en un altavoz físico; se comprueban síntesis, programación de notas y controles.

No se ejecutó el build Render completo con su fuente editorial remota, ni se ha solicitado despliegue. No hay métricas de usuarios reales ni certificación de Core Web Vitals o WCAG completa. Falta revisión manual con lector de pantalla.

No se han contrastado preguntas con vLex Vincent; los casos son ficticios y las explicaciones jurídicas son provisionales; se proponen referencias del BOE/EUR-Lex sin afirmar comprobación de vigencia o contraste. El editor solo registra una declaración humana cuando se cumplimenta su revisión; no verifica legislación ni jurisprudencia por API. Su autenticación es local y no está habilitada para producción multiusuario.

## Ampliación móvil — 1 de noviembre de 2026

Partidas completas con `tap()` y reinicio en cinco perfiles emulados: iPhone SE, iPhone 13 vertical/horizontal, Pixel 7 e iPad Mini. Sin errores JavaScript ni desbordamiento; respuestas con altura mínima de 53 px en estas pruebas. Motor Chromium, no Safari ni hardware físico. Resultados en `mobile/results.json` y capturas en `mobile/`.

La suite JS actual tiene 15 pruebas correctas, incluida la distinción de direcciones de revisión Wi-Fi frente a URLs públicas. Dos pruebas Python adicionales verifican el servidor de revisión: recursos del juego accesibles, editor/repositorio/directorios bloqueados y HEAD correcto.

El usuario necesita un enlace HTTPS desde el teléfono, sin ordenador. Los lanzadores Wi-Fi no resuelven ese acceso. Se ha comprobado que no hay capacidad de preview en el entorno ni secreto RENDER_API_KEY configurado; no se ha creado ni verificado una URL pública, no se ha desplegado ni fusionado main. Requiere habilitar un alojamiento de revisión separado y comprobar la URL resultante; no utilizar la producción como sustituto de la revisión.

## Preparación de revisión HTTPS aislada — 1 de noviembre de 2026

Inspeccionadas herramientas y capacidades actuales: no hay hosting de previews ni forwarding HTTPS público disponible. Sin acceso conectado a proveedores de preview. No se ha usado Render de producción ni generado una URL HTTPS pública. Instrucciones manuales sin API Key: `REVISION-HTTPS-RENDER.md`.

La música se solicita dentro del gesto de Jugar (sin esperar una navegación), permanece apagada antes y respeta silencio explícito. Pruebas táctiles de partida completa con música activada en cinco perfiles de Chromium, más silencio previo y ausencia de AudioContext: correctas. No es una prueba de Safari real ni de un altavoz físico. WebKit no está instalado y no hay iPhone conectado.

18 pruebas JS correctas. El nuevo build `scripts/build-game-preview.mjs` genera solo recursos demo en `preview-dist`; rechaza el nombre/dominio de producción, rama main informada por Render y archivos ajenos en la salida. Pruebas HTTP locales: juego, audio, preguntas y marcador 200; editor, administración, clientes y .env 404. No se ha desplegado ni fusionado main. La URL y Safari físico siguen pendientes de verificación tras habilitar la revisión independiente.


## Corrección de audio sobre e834621 — 1 de noviembre de 2026

25 pruebas JS correctas; diez recorridos de audio en Chromium con archivos reales decodificados y reloj multimedia avanzando; regresión completa del juego (13 flujos, 13 vistas sin incidencias de axe ni desbordamiento detectados); cinco perfiles táctiles completan partidas. Señal PCM no nula y hashes comprobados. Ver AUDIO-IOS.md y los JSON de evidencia.

Se detectaron defectos confirmados de ciclo de vida, errores ocultos y falsa equivalencia entre AudioContext running y salida audible en el código anterior. Se sustituyó por un motor de archivos propio, sesión de reproducción cuando existe, controles independientes, niveles codificados para volumen ignorado, reintento y prueba audible con confirmación humana. No se aumenta de nuevo una ganancia de osciladores.

**Pendiente:** Safari/iPhone físico, HTTPS público, estado live y logs Render. El proxy devolvió CONNECT 403 al intentar leer la demo; el borrador de destinos de red está guardado pero no aplicado. No hay credencial Render disponible. No se declara desplegada ni resuelta en el iPhone esta corrección.
