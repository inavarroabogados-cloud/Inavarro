# D y G · Plan por fases y primera mejora

## Primera mejora recomendada

**Crear una base verificable de seguridad y recuperación del portal antes de aumentar su tratamiento de datos.** En concreto: documentar y probar autorización de Supabase por expediente y documento, MFA del personal, límites efectivos de almacenamiento, backup/restore y una publicación verificable en staging. No es un rediseño ni una migración de documentos. Si las políticas actuales resultan correctas, se conserva su comportamiento y se versionan; si no, se propondrá la corrección antes de aplicarla.

Razón: ya existe código capaz de recibir documentos y administrar asuntos. Añadir CRM, agenda o facturas sobre permisos y copias no verificados aumenta el riesgo y el coste de rehacerlo. La primera función nueva de negocio recomendada, una vez superada esa base, es **recepción y seguimiento de consultas voluntarias**, con datos mínimos y sin documentos.

## Fases y puertas de aprobación

Estimaciones orientativas de ingeniería: una jornada = 8 horas, una persona senior familiarizada con el repositorio. Incluyen desarrollo, revisión y pruebas del módulo; no incluyen tiempos de decisión del titular, contratación, edición jurídica, auditoría independiente ni esperas de proveedores. No hay implementación aprobada por este documento.

| Fase | Alcance y resultado | Dependencias | Esfuerzo | Puerta de aceptación |
| --- | --- | --- | --- | --- |
| 0 · Seguridad y continuidad | Inventario sin datos, revisión RLS/Storage/RPC, staff/MFA, tratamiento, backup y restore sintético, inspección y smoke Render autorizados | Acceso mínimo a configuración, cuentas ficticias, decisiones de privacidad | 5–8 j | Matriz de acceso aprobada y pruebas negativas; restauración demostrada; no mover expedientes |
| 1 · Código y publicación reproducibles | Extraer fuente privada legible, CI, artefactos con procedencia, staging, checks de contenido y revisión editorial | F0; acceso GitHub/Render; no cambios visuales obligatorios | 4–6 j | Un PR reconstruye todos los componentes y permite rollback al artefacto anterior |
| 2 · Consultas voluntarias | Recepción mínima, validación servidor, antispam, estados, asignación y avisos | F0–F1; política de conservación y correo aprobado | 5–8 j | Idempotencia, permiso por rol, no mensajes de éxito sin persistencia; sin datos del orientador automáticos |
| 3 · Citas | Disponibilidad, reserva provisional/confirmada, cancelación, zona horaria y adaptador calendario | F2; calendario, reglas y cuenta elegidos | 4–7 j | Dos solicitudes simultáneas no reservan el mismo hueco; fallos externos no crean citas ficticias |
| 4 · Editorial y carruseles | Versiones, fuentes, revisión jurídica, publicación autorizada, plantillas PNG/PDF | F1; responsable/revisor y criterios editoriales | 8–12 j | No publicación sin fuente verificable y revisión; exports accesibles sin recortes ni datos privados |
| 5 · Portal y expedientes | Consolidar lo existente: permisos granulares, estado, documentos/cuarentena, auditoría y Drive opcional | F0–F1; inventario real y restauración; no se parte de cero | 8–15 j | Cliente A no ve B; revocación y ACL de ambos almacenes comprobadas; pruebas servidor |
| 6 · Encargo, presupuesto y facturación | Plantillas revisadas, aceptación versionada, adaptador de firma/facturación, conciliación | F5; proveedor y requisitos fiscales vigentes aprobados | 6–10 j | Exactitud decimal, permisos contables, trazabilidad, sin dobles facturas ni borrado de históricos |
| 7 · Estadísticas y mejora UX | Embudo agregado, estados comerciales, minimización, rendimiento y revisión manual accesible | F2 y esquema de eventos aprobado; ampliar con F3–F6 | 3–5 j | Sin datos personales/tema jurídico en analítica pública ni exportaciones sin permiso |

F4 y parte de F5 pueden avanzar en paralelo con F3 si hay más capacidad; no se presume un equipo contratado. Total secuencial: **43–71 jornadas**, más reserva del 20–30% por políticas externas, integración y decisiones: aproximadamente **52–92 jornadas**. No es una fecha comprometida. Un primer tramo F0–F2 suma **14–22 jornadas**, antes de reserva. Tras F0 se recalculan las fases privadas con evidencia del backend real.

## Viabilidad técnica de las siete funciones

| Función | Aprovechamiento actual | Trabajo real pendiente | Decisión económica recomendada |
| --- | --- | --- | --- |
| Consultas | Contacto y orientador; ninguna bandeja de leads demostrada | API, BD, permisos, estados y correo | Primera función nueva; evitar un CRM externo completo inicialmente |
| Citas | Canales de contacto; no agenda conectada demostrada | Reglas, exclusión de solapes, integración y cancelación | Enlace a agenda aprobada puede ser MVP; integración bidireccional después |
| Carruseles | SVG/textos de noticias, PNG de guías y un carrusel empaquetado | Editor de slides, versiones, validación visual, exportación | Reutilizar plantillas; publicar manualmente en redes primero |
| Editorial | JSON, render y fuentes enlazadas | Panel, workflow de aprobación, snapshots y correcciones | Panel pequeño ajustado al despacho, no plataforma editorial genérica |
| Portal privado | SPA, auth, asuntos/documentos, grants y handler Drive | Seguridad verificable, esquema legible, permisos, observabilidad y tests | Endurecer y recuperar lo existente antes de sustituir proveedor |
| Facturación/encargo | No módulo acreditado | Plantillas, aceptación, permisos e integración fiscal | Comparar proveedor especializado frente a motor fiscal propio |
| Estadísticas | Interfaz no-op en la herramienta; no panel comercial | Datos agregados, finalidad, roles y retención | Empezar con métricas operativas del propio sistema, sin rastreador publicitario |

## Orden de aprobación y costes

1. Aprobar solo F0, sus accesos mínimos y el entorno de pruebas. Sin datos reales en equipos de desarrollo.
2. Revisar resultados, presupuesto de F1–F2 y proveedor de correo. No habilitar formulario sin backend y privacidad aprobados.
3. Elegir calendario y facturación a partir de volumen, jurisdicción y obligaciones reales; no activar APIs de redes antes de necesitarlas.
4. Autorizar cada publicación tras PR, pruebas y restauración. Aprobar por separado cualquier cambio de tratamiento, proveedor, precio o traslado documental.

No se ha solicitado un presupuesto comercial ni se han consultado tarifas vigentes de proveedores. Para hacer comparable el plan: con una tarifa **hipotética** de 450 €/j, F0–F2 supone 6.300–9.900 € antes de impuestos y reserva; todo el programa, 19.350–31.950 €. Sustituir esa tarifa por la oferta real del equipo. No son honorarios pactados ni autorizaciones de gasto.

Como provisión de operación, no como precio de Render o Supabase: reservar inicialmente un orden de magnitud de 40–150 €/mes para backend/BD/correo/backup/staging, y de 120–400 €/mes al añadir más almacenamiento, supervisión y servicios privados; el coste puede exceder esas cifras según volumen y garantías. Facturación, firma, calendario, soporte profesional y consumo extraordinario se cotizan aparte. Verificar planes, región, límites, backups y disponibilidad actuales antes de contratar. No basar custodia profesional en un plan gratuito sin contrastar sus garantías.

**No se propone migrar documentos para ahorrar una tarifa sin inventario, DPA, garantías y restore.** Costes dominantes a medir: almacenamiento duplicado Supabase/Drive, transferencia, retención de copias, soporte y tiempo de edición jurídica. El calendario compartido y un proveedor fiscal pueden reducir desarrollo, pero añaden contratos, licencias, OAuth y mantenimiento de integraciones.

## Decisiones pendientes agrupadas

- Personas/roles del despacho y responsable de revisión; si hoy se reciben documentos reales y qué proveedor es el sistema de registro.
- Configuración efectiva Render y permisos de API; acceso de lectura al esquema/políticas y prueba con cuentas ficticias.
- Región y contratos de encargados, subencargados, transferencia y conservación; necesidad de EIPD y gestión de datos especialmente protegidos.
- Política de citas: duración, buffers, horarios, zona, cancelaciones y cuándo se considera confirmada; calendario existente.
- Volumen mensual de consultas/documentos, número de profesionales, objetivos medibles y presupuesto máximo.
- Proveedor de facturación/firma ya utilizado y requisitos vigentes; sin suponer que hay que reemplazarlo.
- Revisión profesional de contenidos y privacidad; fuentes jurídicas originales y reglas de publicación/corrección.

Estas decisiones no impiden entregar el diseño. Sí condicionan implementación, coste y puesta en producción de las funciones afectadas.
