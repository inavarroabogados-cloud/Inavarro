# Probar desde iPhone, Android y tablet sin publicar

## Si tienes un ordenador y móvil en la misma Wi-Fi

1. Descarga y descomprime `inavarro-juego-revision.zip` en el ordenador.
2. Con Python 3 instalado, abre `Probar-en-movil.command` en Mac o `Probar-en-movil.bat` en Windows. Si el sistema no permite abrir el archivo de Mac por doble clic, usa Terminal en esa carpeta: `python3 scripts/probar-movil.py`.
3. Se abrirá el juego en el ordenador y aparecerá una dirección como `http://192.168.1.20:3201/esto-es-legal/`. **Ese ejemplo no es tu enlace**: usa la dirección que muestre tu ordenador.
4. Escribe esa dirección en Safari del iPhone o Chrome de Android, conectados a la misma Wi-Fi. Mantén el ordenador encendido y la ventana abierta.
5. Para cerrar, pulsa Ctrl+C o cierra la ventana del servidor.

No necesitas compilar ni instalar paquetes del juego. El lanzador solo sirve los recursos públicos del juego: nunca el panel editorial, datos privados ni archivos Git. No abre puertos del router ni crea servicios externos.

Si no carga: comprueba la misma Wi-Fi (evita redes de invitados con aislamiento), que el móvil no esté usando solo datos y que el cortafuegos permita el servidor en tu red privada. Si aparecen varias IP, usa la del adaptador Wi-Fi. Si el puerto está ocupado, cierra otras vistas previas o ejecuta `python3 scripts/probar-movil.py --port 3202`.

## Si solo tienes el móvil

El ZIP y los enlaces de GitHub no son una web jugable alojada. Hace falta una vista previa accesible por HTTPS para abrir el juego directamente desde el teléfono. Esta entrega **no crea ese alojamiento** ni modifica Render: se mantiene la instrucción de no desplegar. La IP del entorno de Codex tampoco es una IP de tu Wi-Fi.

## Qué comprobar en el teléfono real

- Pulsar respuestas y pistas, recorrer las cinco preguntas, reiniciar y girar el móvil.
- Activar música y efectos mediante sus botones; ajustar el volumen del teléfono.
- Cambiar de aplicación durante un reto rápido: al volver debe quedar pausado.
- Aumentar texto y activar «Reducir movimiento» en los ajustes de accesibilidad.
- Guardar la tarjeta final. En iOS su apertura o guardado depende de Safari y del menú del sistema.

En la Wi-Fi se utiliza HTTP. Web Share y portapapeles pueden exigir HTTPS; la revisión no convierte un enlace privado de Wi-Fi en un enlace público para compartir. Falta una comprobación en dispositivo real sobre HTTPS antes de publicar.

## Evidencias y comandos de desarrollo

`tests/game/mobile.mjs` recorre partidas completas mediante `tap()` con perfiles iPhone SE, iPhone 13 vertical/horizontal, Pixel 7 e iPad Mini. Usa Chromium: no equivale a Safari real ni a dispositivos físicos. Capturas y resultados en `docs/game/mobile/`.

Con las dependencias de pruebas de `tests/game/package.json` instaladas:

```sh
python3 scripts/probar-movil.py --port 3202 --local-only --no-open
# En otra terminal, desde la raíz:
node tests/game/mobile.mjs
python3 -m unittest discover -s tests/game -p 'test_mobile_preview.py' -v
```

El lanzador usa solo Python estándar y las direcciones locales de los adaptadores; no contacta con servicios para descubrir la IP. La prueba del servidor usa un puerto efímero y verifica acceso al juego y bloqueo de rutas privadas.
