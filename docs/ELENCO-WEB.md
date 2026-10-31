# ¿ESTO ES LEGAL? — integración

La rama `feat/elenco-esto-es-legal` añade un videojuego casual de demostración en `/esto-es-legal/` y conserva la galería en `/esto-es-legal/personajes/`. No modifica herramientas existentes ni el área privada. Los siete personajes, 42 ilustraciones y código de animación original están conservados y probados mediante hashes respecto a `ea2e59b`.

Ver [cómo probar, reglas, arquitectura y límites](game/README.md) y [editor privado local](../game-editor/README.md). Capturas y resultados están en `docs/game/`.

Los dos entrypoints de compilación instalan recursos estáticos desde `web/esto-es-legal/` mediante `install-personajes.mjs`. El panel editorial queda fuera del build. No se indexa el juego demo. No se ha publicado ni fusionado a main. Se mantiene la publicación verificable y restauración descritas en `DEPLOYMENT.md`.
