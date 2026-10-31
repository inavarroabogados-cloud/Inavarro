# Verificación de la versión jugable

Fecha: 31 de octubre de 2026. Pruebas locales; no publicación en Render.

## Ejecutado

- Compilación estática `node build.mjs` e instalación del orientador estático existente, sin cambiar sus fuentes. Ambos correctos.
- `node --test tests/game/*.test.mjs tests/test_personajes.mjs`: **13 pruebas correctas**. Cubren selección de cinco preguntas/niveles, puntos y rachas, pistas, timeout, duplicados, privacidad del enlace, audio con contexto simulado, validación editorial y preservación byte a byte de las 42 ilustraciones y el componente original.
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

No se han contrastado preguntas con vLex Vincent; el contenido público es ficción declarada. El editor solo registra una declaración humana cuando se cumplimenta su revisión; no verifica legislación ni jurisprudencia por API. Su autenticación es local y no está habilitada para producción multiusuario.
