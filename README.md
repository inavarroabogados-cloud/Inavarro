# iNavarro Abogados

Web pública de servicios y noticias de Imanol Navarro Pérez, abogado ICATF 6738, en Tenerife. No contiene expedientes privados.

Render: servicio estático, build `node deploy.mjs`, directorio `dist`. El origen se toma de SITE_ORIGIN o RENDER_EXTERNAL_URL. Los recursos de marca y vistas sociales están en assets.tar.gz.

## Herramienta «¿Y ahora qué?»

Se publica en `/y-ahora-que/` en el mismo despliegue estático, sin sustituir el portal ni el área de clientes. `deploy.mjs` instala el paquete `orientador-static.tar.gz` después del build existente. `install-orientador.mjs` añade un acceso desde la portada y el pie público, preservando las rutas de clientes y administración. La herramienta conserva la etiqueta de demostración y noindex; los borradores jurídicos no se presentan como validados.

Fuente y pruebas: repositorio `inavarroabogados-cloud/INAVARRO-repositorio`. Para actualizar el paquete desde ese checkout: `STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/y-ahora-que NEXT_TELEMETRY_DISABLED=1 npm run build`, seguido de `tar -czf /workspace/Inavarro/orientador-static.tar.gz -C out .`. Verificar el flujo estático antes del commit. No editar el paquete a mano. El despliegue no necesita instalar Next ni nuevos servicios. La exportación no aplica cabeceras HTTP de Next: se incorporan CSP y referrer mediante HTML; las demás cabeceras deben configurarse en el alojamiento.
