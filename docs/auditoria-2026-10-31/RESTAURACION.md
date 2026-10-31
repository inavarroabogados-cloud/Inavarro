# Procedimiento propuesto de restauración y recuperación

**Runbook para aprobar y ensayar; no se ha restaurado ni modificado ningún dato real.** No hay evidencia aquí de que los backups actuales satisfagan estos requisitos. Un rollback de HTML no restaura usuarios, permisos o documentos externos.

## Antes de una publicación autorizada

1. Identificar último deploy realmente verificado, SHA, manifiesto de componentes y artefacto inmutable. Registrar servicio/tipo/branch/build/publish path y nombres de variables; guardar valores secretos solo en gestor seguro, nunca en el acta o Git.
2. Confirmar backup y restaurabilidad de esquema, RLS, RPC, permisos, metadatos y objetos Supabase; inventariar IDs/checksums/permisos de Drive y su relación con los originales sin copiar documentos a equipos de desarrollo.
3. Mantener un paquete anterior verificable y no dependiente de una fuente editorial mutable. Recompilar un commit viejo descargando noticias actuales **no** garantiza recuperar el mismo sitio.
4. Para migraciones, usar expand/contract: versión previa y nueva compatibles mientras dure la ventana de reversión. Una migración destructiva no entra en un release ordinario sin plan de restauración y aprobación específica.
5. Preparar staging con datos sintéticos y acceso restringido. Las copias reales, si fueran imprescindibles, requieren habilitación, destino/contrato adecuado y minimización; no son el camino por defecto.

## Ante fallo de código o despliegue

1. Registrar ID de deploy, hora, SHA y síntomas. Distinguir build fallido, rutas ausentes, permisos y problema de proveedor. Si la versión anterior sigue sirviendo, no sustituirla con redeploys repetidos.
2. Elegir rollback nativo de Render al deploy anterior o republicación de su artefacto exacto, tras comprobar que la API/plan lo permite y con autorización del titular. El runner actual no implementa rollback: OPS-02 debe añadir/verificar esa operación. No inventar un endpoint ni equiparar «clear cache» a recuperación.
3. Verificar estado `live`, logs, SHA y contenido público/privado con cuentas ficticias. Confirmar ausencia de exposición y estabilidad de callbacks, enlaces y permisos. Usar el marcador si existe; no aceptar un 200 con página de error.
4. Conservar build fallido y diagnóstico sin secretos. Corregir en PR independiente, repetir pruebas y pedir autorización para otro intento.

## Ante fallo de datos o almacenamiento

1. Valorar contención. Restringir escrituras o revocar un acceso afectado solo según procedimiento de incidente autorizado, sin borrar ni sobrescribir expedientes. Preservar evidencia y decidir obligaciones de comunicación con el titular.
2. Restaurar primero **en un destino aislado aprobado**. Verificar versiones coherentes de BD y objetos; no reemplazar la BD activa por una copia antigua y perder consultas/documentos recibidos después.
3. Reconciliar diferencias por IDs, checksums, fechas y auditoría. Una copia Drive huérfana no se elimina hasta acreditar si el original y la actualización están conservados; el handler actual preserva copias ante respuesta ambigua.
4. Probar grants, RLS, visibilidad de documentos, asignaciones y revocaciones, incluyendo ACL de Google. Restaurar permisos sin compartir carpetas o archivos con destinatarios nuevos.
5. Revisar cambios de contraseñas y revocaciones posteriores al backup para no reactivar accesos retirados. La rotación de claves debe estar coordinada con la configuración activa; nunca restaurar una clave revocada desde Git.
6. Solo tras validación y aprobación planificar el cambio al destino restaurado. Mantener un registro de operaciones y preservar información nueva. No hacer pruebas de borrado sobre el repositorio real de documentos.

## Objetivos propuestos, no garantías actuales

Acordar RPO/RTO con el titular según volumen y sensibilidad. Como punto de discusión: recuperar HTML/estáticos en menos de 60 minutos si existe artefacto previo y acceso operativo; para datos, RPO ≤24 h y RTO ≤8 h, revisables a objetivos más exigentes si el uso lo requiere. Ninguno se afirma conseguido ni adecuado universalmente para un despacho.

Simulacro inicial: recuperar sitio, esquema, objetos ficticios y permisos, verificar dos clientes y un staff, y dejar acta con tiempos reales y pérdidas simuladas. Repetir tras cambios de proveedor/esquema y con periodicidad aprobada. El coste de backups, retención, restauraciones y revisión humana se incluye en la decisión de proveedor, no se da por cubierto por un plan gratuito.
