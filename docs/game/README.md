# ¿ESTO ES LEGAL? — Versión jugable local

Rama `feat/elenco-esto-es-legal`. Sin despliegue, fusión a main, contratación ni conexiones a datos reales.

## Probar desde el móvil

[Guía sencilla para iPhone y Android](PROBAR-EN-MOVIL.md). El paquete incluye lanzadores para Mac y Windows que muestran la dirección de tu Wi-Fi. No existe aún un enlace público jugable.

## Prueba rápida del juego, sin compilar

Con Python 3, dentro del repositorio en la rama de revisión:

```sh
git switch feat/elenco-esto-es-legal
python3 -m http.server 3201 --bind 127.0.0.1 --directory web
```

Abrir **http://127.0.0.1:3201/esto-es-legal/**. Sirve solo el juego y su galería; los enlaces de vuelta al portal y a otras herramientas requieren la compilación completa siguiente. No abrir index.html directamente con file://, porque los módulos necesitan HTTP. Detener con Ctrl+C.

## Probar dentro de la compilación del portal

Requiere Node.js 22.7 o posterior, Python 3 y tar. Desde la raíz del repositorio:

```sh
tar -xzf assets.tar.gz
node build.mjs
node install-orientador.mjs
python3 -m http.server 3201 --bind 127.0.0.1 --directory dist
```

Abrir **http://127.0.0.1:3201/esto-es-legal/**. Esta dirección solo funciona en la máquina que ejecuta el servidor. No es un enlace público de Render. La compilación local usa `posts.json` existente; no ejecuta la actualización editorial remota. El juego y la galería están preparados en los dos entrypoints de build existentes.

Para probar en tu iPhone en la misma red, detener el servidor Python y ejecutarlo con `--bind 0.0.0.0`; abrir `http://IP-LOCAL-DEL-ORDENADOR:3201/esto-es-legal/`. Hacerlo solo en una red privada de confianza, sin exponer puertos del router. El panel editorial **no** debe cambiar su bind ni abrirse a esa red. Web Share y portapapeles pueden estar limitados por HTTP; siguen disponibles la descarga de tarjeta y las alternativas de interfaz. Antes de la publicación real hace falta una prueba en Safari/iPhone físico sobre HTTPS.

1. Elegir «A tu ritmo» y empezar: dos preguntas nivel 1, dos nivel 2 y una nivel 3.
2. Pedir una pista de Aura, acertar/fallar y leer a Lexi. Trampín reacciona; Don Lex presenta, Brinco activa el nivel intermedio, Elion el matiz final y Lúmina celebra.
3. Completar cinco preguntas, abrir el repaso y descargar la tarjeta de Instagram.
4. Repetir en «Reto rápido»: 20 s por pregunta, pausa manual ilimitada y pausa al ocultar la pestaña. No se pierde la opción de jugar sin reloj.
5. Activar música y efectos de forma independiente, reducir movimiento, salir/cancelar y reiniciar.

## Reglas del juego

Banco de **15 casos ficticios de contenido jurídico provisional**, con cinco preguntas por nivel y selección aleatoria de cinco sin repetir dentro de una partida. Temas: contratos, vivienda, consumo, trabajo, imagen, garantías, prueba digital, protección de datos, sucesiones y procedimiento. Cada caso incluye un documento simulado, una pregunta, una explicación y referencias normativas propuestas para contraste.

Se han retirado las reglas imaginarias de Villa Lex. Los casos son ficticios; las referencias apuntan a textos normativos del BOE o EUR-Lex, pero **no se han consultado ni contrastado sus versiones en esta entrega** y no se presentan como revisión profesional. No se inventa jurisprudencia. El ámbito propuesto es España/UE, pendiente de confirmación antes de publicar; `editorialScope` mantiene `publicationAllowed:false` y `jurisdictionConfirmed:false`. No se ha utilizado vLex Vincent.

Ver [los 15 retos y sus respuestas propuestas](RETOS-JURIDICOS.md) para revisión editorial; es un documento con soluciones, no una pantalla del jugador.

Acierto: 100 puntos base; con pista: 80. Racha: +10 por acierto previo consecutivo, hasta +30. Reto rápido: +20 si se acierta en los primeros 15 segundos activos. Error o tiempo agotado: cero, sin restar. Máximo sin pistas: 590 normal / 690 rápido. Medallas por aciertos: 5 «Ojo de Elion», 3–4 «Criterio en marcha», 0–2 «La curiosidad cuenta». No son puntuaciones jurídicas.

Los estados y respuestas viven solo en memoria; recargar borra la partida. Sin cookies del juego, localStorage, sesión persistida, analítica, IA, rankings ni datos personales. Las ilustraciones originales y sus animaciones se conservan byte a byte. La galería permanece en `/esto-es-legal/personajes/`.

## Sonido y movimiento

Música y efectos originales sintetizados durante la generación de recursos, servidos como archivos MP3/WAV del mismo origen. El motor de reproducción usa HTMLMediaElement y no depende de AudioContext; consulta el informe de corrección de audio. No se utilizan muestras ni servidores de audio de terceros. Apagado al entrar; la música se solicita al pulsar Jugar, se respeta el silencio elegido y se detiene al ocultar la página. Los efectos son opcionales y las señales también son visuales y textuales.

Entradas, flotación, reacciones, estrellas y confeti mediante transformaciones CSS; no hay canvas de animación por fotograma ni dependencia gráfica. El canvas se usa solo al solicitar una tarjeta PNG. `prefers-reduced-motion` desactiva movimiento; control manual adicional. No se imponen destellos, vibración ni movimiento al contenido que hay que leer.

## Compartir

WhatsApp abre un mensaje genérico para revisión antes de enviarlo. Web Share cuando existe; alternativa de copiar o seleccionar el enlace si se deniega el portapapeles. URL limpia, sin consulta, fragmento, respuesta o puntuación. Instagram: PNG 1080 × 1920 mediante menú nativo de archivos cuando es compatible o descarga para subir manualmente. No hay API que publique en Instagram desde este juego. Cancelar no se presenta como envío realizado. En loopback se informa de que el desafío no es públicamente accesible.

## Archivos y pruebas

- `web/esto-es-legal/game-core.js`: reglas puras y puntos.
- `questions.js`: banco exclusivamente demo.
- `game.js`, `game.css`, `audio.js`: experiencia y síntesis.
- `game-editor/`: servidor/editor local privado, fuera del sitio estático.
- `tests/game/`: unidad, seguridad del editor y recorrido Chromium.

```sh
node --test tests/game/*.test.mjs tests/test_personajes.mjs
python3 -m unittest discover -s tests -p 'test_render.py' -q
# Opcional, dependencias de desarrollo solo para pruebas de navegador:
cd tests/game
npm install
npx playwright install chromium
# Con el servidor de vista previa ejecutándose en 3201:
npm run browser
```

El recorrido usa el Chromium descargado por Playwright; para uno ya instalado: `CHROMIUM_PATH=/usr/bin/chromium npm run browser`. Los tests del editor necesitan puertos locales 3219/3221 libres y usan directorios temporales y contraseñas aleatorias, sin credenciales reales. No iniciar esas pruebas contra sistemas existentes. Resultados y capturas en este directorio. Las pruebas de navegador no envían mensajes ni publican contenido.

## Límites de esta entrega

No integra vLex ni publica contenidos revisados automáticamente; los casos siguen siendo ficticios y su contenido jurídico está pendiente de revisión. El editor es de un solo operador local, no un CMS multiusuario de producción. Sin prueba física en iPhone ni validación real de instalación en Render; no equivale a certificar WCAG o Core Web Vitals en producción. El backend privado no puede desplegarse como parte de un Static Site.

## Restauración

La integración es aditiva. Para deshacer esta iteración, revertir su commit en otra rama y revisar el PR: el commit anterior mantiene la galería. No toca migraciones ni datos existentes. No borrar `game-editor/data`; hacer copia antes de cualquier mantenimiento. Cualquier futura publicación exige aprobación y el procedimiento de `DEPLOYMENT.md` con SHA, registros y verificación pública. Esta entrega no lo ejecuta.

## Vista de revisión HTTPS independiente

[Configuración de un Static Site separado en Render, sin API Key, sin main y sin Auto-Deploy](REVISION-HTTPS-RENDER.md). Comando de build aislado: `node scripts/build-game-preview.mjs`; directorio publicable: `preview-dist`. Este comando solo prepara archivos, no despliega.

La música permanece apagada al cargar la página y se activa al pulsar **Jugar**, dentro del gesto del usuario. Un silencio elegido expresamente en el control Música se respeta al empezar otra partida. Los efectos continúan siendo opcionales. Fallos de audio no impiden jugar.


## Corrección del audio iOS

[Diagnóstico, solución, pruebas y despliegue exclusivo de la demo](AUDIO-IOS.md). Incluye botón temporal PROBAR SONIDO, confirmación humana y diagnóstico copiable sin respuestas. Los tests no equivalen a escuchar un iPhone físico.
