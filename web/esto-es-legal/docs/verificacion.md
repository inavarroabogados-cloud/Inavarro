# Verificación — 31 de octubre de 2026

Ejecutado en Chromium local con Playwright y axe-core. Resultados brutos: `verificacion.json`.

- 42 SVG parseados como XML; IDs sin duplicados dentro de cada archivo, sin scripts ni recursos externos.
- 42 combinaciones seleccionadas en la galería; estado y recurso HTTP comprobados.
- Fin de animación y movimiento reducido comprobados.
- Anchos 360, 390, 768 y 1440 px: sin desplazamiento horizontal; ninguna incidencia en las reglas automatizadas WCAG A/AA ejecutadas por axe. Esto no certifica conformidad completa.
- Galería de escritorio y móvil inspeccionada visualmente; tarjetas PNG generadas con Chromium. Sin errores JavaScript capturados.
- 21 plantillas sociales exportadas a PNG y SVG.
- Cada mascota pesa 3.232–5.364 bytes sin comprimir; sprite completo 173.671 bytes. Preferir archivos individuales y caché HTTP en integración.

No se ha realizado prueba manual con lector de pantalla, Safari/iOS, dispositivos físicos, ni validación de marca registrada. No se entrega una integración con el juego existente.

## Repetir pruebas opcionales

La galería funciona sin Node. Solo para pruebas, instalar las dependencias de desarrollo con `npm install`, ejecutar `npx playwright install chromium`, iniciar el servidor Python del README en puerto 3200 y ejecutar `npm run verify`. Si se usa Chromium del sistema, definir `CHROMIUM_PATH=/usr/bin/chromium`. Las pruebas regeneran PNG y capturas. No se han contratado servicios.
