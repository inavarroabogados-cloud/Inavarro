# Auditoría y propuesta de modernización · iNavarro Abogados

Fecha: 31 de octubre de 2026. **Propuesta para revisión; no autoriza implementación ni despliegue.**

La base pública puede conservarse: genera HTML estático, tiene metadatos y canales reales de contacto, y el orientador mantiene las respuestas en el navegador. El mayor riesgo antes de ampliar el sistema es no poder demostrar desde estos repositorios las políticas efectivas que separan cuentas, expedientes y documentos en Supabase. No se ha demostrado una fuga ni se han consultado datos de clientes.

| Entregable | Documento |
| --- | --- |
| A · Auditoría, evidencias y pruebas | [AUDITORIA.md](AUDITORIA.md) |
| B · Riesgos y esfuerzo | [RIESGOS.md](RIESGOS.md) |
| C · Arquitectura y componentes | [ARQUITECTURA.md](ARQUITECTURA.md) |
| D · Fases, dependencias y coste orientativo | [PLAN.md](PLAN.md) |
| E · Prototipos conceptuales | [PROTOTIPOS.md](PROTOTIPOS.md) |
| F · Backlog con criterios de aceptación | [BACKLOG.md](BACKLOG.md) |
| G · Primera mejora recomendada | Fase 0 de PLAN.md: seguridad verificable y recuperación del portal |
| Restauración y continuidad | [RESTAURACION.md](RESTAURACION.md) |
| Resultados y procedencia | [evidencias](evidencias/) |

Se auditó `Inavarro/main` en `290e12e9d8bd7f5eca82827d0555d5162b1de507`, que ya integra el flujo de despliegue de la PR #2. Para la herramienta: `INAVARRO-repositorio/main`, `5da3576da187353c9041fade572ad769e3e6996f`. El antiguo `904d355` ya no es la punta de main. Estas revisiones no prueban qué SHA sirve Render.

Trabajo realizado en `audit/modernizacion-2026-10-31`. Solo documentación y resultados de auditoría; sin cambios funcionales, sin modificar main, sin publicar, contratar ni acceder a expedientes. Los prototipos son esquemas de experiencia, no formularios conectados ni nuevas funciones implantadas.

Se han ejecutado 19 pruebas del runner, 5 pruebas aisladas de Drive, 7 pruebas de reglas y tipos de la herramienta, compilación y tipos del portal extraído, 24 comprobaciones locales axe/móvil y un recorrido del orientador. El JS y CSS del portal se reprodujeron exactamente. No se ha medido Core Web Vitals en producción ni verificado RLS real, disponibilidad del servicio o cumplimiento normativo.

La aprobación solicitada al terminar es del **plan y su primera fase**. Una autorización futura de implementación no se interpreta automáticamente como autorización de despliegue ni de gasto.
