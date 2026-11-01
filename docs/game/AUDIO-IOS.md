# Audio iOS — investigación y corrección

Estado: corrección implementada y probada localmente; **NO se da por resuelto en el iPhone del usuario** hasta desplegar esta versión y confirmar que se oye. No se ha escuchado un iPhone físico ni ejecutado Safari real.

## Base examinada y evidencia

El fetch de la rama `feat/elenco-esto-es-legal` confirmó `e8346217b0135c973ab20a0f6ae6b3648a2a59c7` y sus cambios de volumen, precedidos por `083589a` (activar efectos). Se incorporaron mediante fast-forward antes de corregir; no se descartaron cambios remotos. Esta es la versión **indicada por el usuario como desplegada**. No se ha podido comprobar que Render sirva esos mismos bytes: la solicitud HTTPS a la demo fue rechazada por el proxy del entorno con `CONNECT 403`, antes de llegar al servidor público.

No se ha consultado ni modificado `inavarro-abogados`. No hay RENDER_API_KEY disponible. El runner `ops/render.py` existente apunta a producción: **no se utiliza para esta demo**.

## Hallazgos confirmados del código antiguo

- `unlock()` solo aceptaba `AudioContext.state === running` y devolvía false ocultando la excepción. Running no demuestra señal audible ni salida física correcta.
- La referencia a contexto se conservaba con `??=`; un contexto cerrado seguía reutilizándose y `resume()` podía fallar sin explicación útil.
- Al volver de segundo plano se llamaba a `begin()`, que programaba osciladores, pero no reanudaba el contexto suspendido/interrumpido. El reloj del contexto podía permanecer parado.
- Activar efectos y música desde Jugar lanzaba dos recorridos asíncronos de `resume()` sobre el mismo contexto; el error de efectos se ocultaba con un catch vacío. La concurrencia existía; **no está demostrado que causara por sí sola el silencio**.
- `pause()` detenía todas las voces también al silenciar solo música, acoplando ambos controles.
- Solo existía síntesis en vivo: no había reproducción alternativa por archivos ni prueba aislada de salida, estado de recursos o progreso.
- Los volúmenes del commit examinado no eran cero. No se ha atribuido el fallo a «volumen demasiado bajo» ni aplicado otro aumento como solución.

## Causas probables o pendientes de confirmar

Safari/iOS puede suspender/interrumpir AudioContext por segundo plano, bloqueo, llamadas o cambios de sesión; un contexto Web Audio en ruta ambiental puede interactuar de forma distinta con silencio/ruta de reproducción que un elemento multimedia. El momento del gesto y un resume asíncrono pueden influir. Son hipótesis compatibles con los defectos observados, **no una causa física confirmada en este iPhone**.

El navegador no permite leer de forma fiable el volumen multimedia del sistema, el interruptor de silencio, la salida Bluetooth/AirPlay ni comprobar que un altavoz emita sonido. No se presuponen esos ajustes como culpables. El panel ofrece comprobación manual y enlaces directos WAV/MP3 para aislar interfaz, formato y salida.

La CSP antigua no explica por sí sola un bloqueo de osciladores, que no descargaban audio. La nueva política declara `media-src 'self'`; hay que comprobar también las cabeceras HTTP que Render pueda añadir. Los MIME/rangos/archivos reales publicados siguen pendientes de verificación remota.

## Solución implementada

`audio.js` usa HTMLMediaElement con música original MP3, alternativa WAV y señales WAV de prueba/acierto/fallo/pista/victoria. No crea AudioContext; su ausencia, cierre o interrupción ya no es un requisito para reproducir estos archivos. El diagnóstico lo indica como `not-created`, no como running ficticio. La sesión `navigator.audioSession.type = playback` se solicita cuando está disponible; su ausencia o rechazo se informa y no bloquea el juego.

`play()` se invoca de forma síncrona desde Jugar, Probar sonido o el toque de respuesta, antes de cualquier await o descarga. Se solicita un único arranque de música; habilitar efectos no compite con otro resume. Hay controles independientes, errores de play/carga/decodificación/bloqueo, plazo máximo de espera y reintento. Una promesa antigua no puede reactivar música silenciada posteriormente.

Música MP3 con fallback WAV preparado si el formato no es compatible; el siguiente toque explícito reintenta el archivo alternativo. Si se oculta la página se pausa, al volver se intenta recuperar y un bloqueo muestra la necesidad de otro toque. El juego continúa sin audio.

El volumen usa la propiedad multimedia cuando se admite. En iOS/navegadores que la ignoran se seleccionan niveles de archivo precodificados (suave/medio/completo) y mute real. El diagnóstico muestra el modo y el archivo seleccionado, además de los volúmenes solicitados. No depende de introducir otra cadena de Web Audio para regular ganancia.

Los archivos se generan mediante `scripts/build-game-audio.py` (Python estándar + ffmpeg únicamente para generar MP3). La melodía, bajo y señales son composición/síntesis propia; no usan muestras ni música de terceros. **Render no necesita Python ni ffmpeg:** copia archivos ya versionados. WAV base/variantes y MP3 se sirven desde el propio origen. El generador registra duración, RMS, pico y hash de las señales base.

Se versionan las URLs de entrada (`game.js?v=4` y `audio.js?v=4`) para separar la corrección de los módulos anteriores. El build incluye los archivos de audio y un inventario SHA-256 en `preview-version.json` para detectar mezcla de versiones o recursos antiguos del CDN.

## Prueba audible y significado del diagnóstico

El botón visible **🔊 PROBAR SONIDO** reproduce tres notas. Comprueba aceptación de play, readyState con datos, reloj multimedia que avanza, errores, mute y volumen. Los tests inspeccionan además PCM no nulo y hashes, y el navegador de pruebas decodifica los archivos reales.

Nada de eso garantiza sonido físico: se pide **Lo he oído** o **No lo oigo**. La segunda opción mantiene expresamente el problema como no resuelto y muestra instrucciones. El panel detallado informa motor/versión, navegador, códecs, sesión, fuente, progreso, volúmenes, errores y eventos recientes. No incluye respuestas del juego, nombres de clientes, URLs personales ni registros enviados a un proveedor. Copiar es una acción voluntaria del usuario.

## Resultados ejecutados

- Suite JS: **25 pruebas correctas**, ver `unit-results.txt`; incluye primer gesto, prueba, controles independientes, segundo plano/recuperación, rechazo/reintento, timeout, mute, ausencia de Web Audio, fallback de formato, PCM real no silencioso y volumen ignorado por iOS simulado.
- Navegador: **10 recorridos**, `audio-browser-results.json`. Chromium con perfil móvil, reproducción real de MP3/WAV y avance del reloj multimedia; no sonido escuchado por un humano. Prueba inicial, Jugar, cuatro efectos, silencio, errores simulados, reintento y recuperación pasan. La confirmación «Lo he oído» que automatiza el test prueba la interfaz, no un oído físico.
- WebKit: no instalado. Los destinos de descarga están guardados en el borrador de red, aún sin aplicar; no se afirma prueba en WebKit o Safari.
- Archivos/MIME/rangos/hashes: comprobación de la salida local registrada en `audio-local-files.json`. Su SHA base corresponde al build de trabajo, no acredita despliegue de la corrección.
- Se conserva íntegra la familia de personajes. No se modifica main ni la web principal.

## Desplegar solo `esto-es-legal-demo`

No se ha solicitado despliegue por API: faltan acceso Render y autorización de red aplicada. No se afirma live, revisión de logs ni URL actualizada. La URL facilitada por el usuario es https://esto-es-legal-demo.onrender.com/esto-es-legal/ y **su nueva versión está sin verificar desde este entorno**.

Desde el dashboard de Render, abrir exclusivamente el servicio **esto-es-legal-demo**:

1. Comprobar repositorio `inavarroabogados-cloud/Inavarro`, rama `feat/elenco-esto-es-legal`, build `node scripts/build-game-preview.mjs`, publish `preview-dist`. Conservar Auto-Deploy desactivado, sin añadir secretos ni cambiar variables sensibles.
2. Elegir Manual Deploy para el commit de corrección indicado en la entrega; si solo permite latest, confirmar previamente que ese es el HEAD de la rama. No usar el servicio principal ni fusionar main.
3. Esperar finalización, revisar logs de compilación y comprobar el SHA servido en `/preview-version.json`, motor `media-files-v4` y todos los recursos. Una publicación antigua o un build fallido no cuenta como éxito.
4. Si se dispone de acceso de red, ejecutar la comprobación pública de solo lectura:

   `python3 scripts/verify-demo-audio.py --expect-commit SHA_COMPLETO_DE_CORRECCION`

   Este verificador solo admite el host de demo, nunca producción. Comprueba hashes/MIME/rangos y exclusión de administración; **no sustituye los logs y estado Render ni la prueba audible real**.

Para habilitar comprobación remota, el borrador conserva los dominios existentes y añade `esto-es-legal-demo.onrender.com`, `cdn.playwright.dev` y `playwright.download.prss.microsoft.com`. Hay que revisar y guardar esos cambios en los ajustes del entorno y publicar el entorno para aplicarlos. Guardar el borrador no los activa. No se han incluido credenciales ni ampliado acceso de forma silenciosa.

## Safari desde el iPhone tras desplegar

1. Abrir la URL de demo directamente en Safari y recargar. Debe verse **PROBAR SONIDO** y en diagnóstico `media-files-v4`. Si no, se está probando otra versión.
2. Pulsar **PROBAR SONIDO** y escuchar tres notas. Si no se oyen, pulsar **No lo oigo**; en Centro de control comprobar volumen multimedia y salida (altavoz/auriculares/Bluetooth/AirPlay), comparar sin salida externa y probar modo silencio. No se asume que esa sea la causa.
3. En diagnóstico, probar los enlaces directos WAV y MP3 y su botón nativo de reproducción. Después volver y reintentar Probar sonido sin recargar.
4. Pulsar **Jugar**: deben habilitarse música y efectos, salvo silencio elegido antes. Probar pista, respuesta acertada, incorrecta y victoria. Bloquear/desbloquear o cambiar de aplicación; si Safari vuelve a bloquear, reactivar con Probar sonido o Música.
5. Si sigue mudo, **error NO RESUELTO**: copiar diagnóstico, indicar modelo/iOS/Safari, si se oyen los archivos directos y qué salida aparece en Centro de control. No enviar datos del caso. Esa evidencia permite distinguir bloqueo de play, archivo/MIME, ruta del sistema y error de la aplicación.

## Restauración

Si el nuevo despliegue de demo falla, restaurar únicamente el anterior de `esto-es-legal-demo` o desplegar manualmente el commit anterior `e8346217b0135c973ab20a0f6ae6b3648a2a59c7`. Ese rollback no corrige el silencio anterior: solo restaura la aplicación conocida. No afecta a producción ni requiere borrar datos o cambiar secretos.


Para repetir en desarrollo: generar la salida con `node scripts/build-game-preview.mjs`, servir `preview-dist` en loopback puerto 3203 y, con las dependencias de pruebas instaladas, ejecutar `npm run audio` dentro de `tests/game`. La suite comprueba decodificación/progreso y simula bloqueos/volumen ignorado; no certifica sonido físico.
