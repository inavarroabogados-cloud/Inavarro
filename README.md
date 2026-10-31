# iNavarro Abogados

Web pública de servicios y noticias de Imanol Navarro Pérez, abogado ICATF 6738, en Tenerife. No contiene expedientes privados.

Render: servicio estático, build `node deploy.mjs`, directorio `dist`. El origen se toma de SITE_ORIGIN o RENDER_EXTERNAL_URL. Los recursos de marca y vistas sociales están en assets.tar.gz.

## Herramienta «¿Y ahora qué?»

Se publica en `/y-ahora-que/` en el mismo despliegue estático, sin sustituir el portal ni el área de clientes. `build-render.mjs` instala el paquete `orientador-static.tar.gz` al finalizar; funciona tanto con `node build-render.mjs` como con `node deploy.mjs`. `install-orientador.mjs` añade un acceso desde la portada y el pie público, preservando las rutas de clientes y administración. La herramienta conserva la etiqueta de demostración y noindex; los borradores jurídicos no se presentan como validados.

Fuente y pruebas: repositorio `inavarroabogados-cloud/INAVARRO-repositorio`. Para actualizar el paquete desde ese checkout: `STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/y-ahora-que NEXT_TELEMETRY_DISABLED=1 npm run build`, seguido de `tar -czf /workspace/Inavarro/orientador-static.tar.gz -C out .`. Verificar el flujo estático antes del commit. No editar el paquete a mano. El despliegue no necesita instalar Next ni nuevos servicios. La exportación no aplica cabeceras HTTP de Next: se incorporan CSP y referrer mediante HTML; las demás cabeceras deben configurarse en el alojamiento.

Dominio externo confirmado por el titular: https://inavarro-abogados.onrender.com. La herramienta se monta en `/y-ahora-que/`. El dominio de ChatGPT de config.json es la fuente editorial histórica, no el enlace público de esta herramienta. Un push no acredita despliegue terminado; verificar estado y commit en Render.

## Ciclo completo de publicación

Consulta [DEPLOYMENT.md](DEPLOYMENT.md) para configurar el secreto de Render de forma segura, verificar el servicio real y publicar con seguimiento de estado, registros y pruebas HTTP mediante `ops/render.py`. No declarar una publicación por el mero hecho de hacer push. No ejecutar `deploy` sin autorización del titular.
