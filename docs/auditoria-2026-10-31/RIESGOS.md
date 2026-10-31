# B · Matriz de riesgos

C = confirmado; R = exposición potencial; V = requiere prueba/configuración externa. La gravedad refleja el impacto si el riesgo se materializa, no un incidente demostrado. P0 = condición previa a ampliar datos confidenciales; P1 = siguiente iteración; P2 = mejora programable. Esfuerzo en jornadas de 8 horas de una persona; estimaciones de corrección/prueba, sin espera de terceros ni asesoría jurídica. No sumar filas con dependencias compartidas.

| ID | Hallazgo y estado | Gravedad | Prioridad | Esfuerzo | Acción propuesta y prueba de cierre |
| --- | --- | --- | --- | --- | --- |
| H01 | Dependencia de RLS/Storage/RPC sin políticas versionadas (C); filtración no demostrada (R/V) | Crítica potencial | P0 | 3–6 j | Exportar esquema/políticas sin datos, revisar grants y probar anónimo, cliente A, B y staff; denegación cruzada en tablas, objetos y RPC |
| H02 | Sesión localStorage, contraseña mínima 6 y sin flujo MFA suministrado (C); controles reales desconocidos (V) | Alta | P0 para staff | 2–4 j | MFA/step-up servidor, revocación, caducidad y recuperación segura; probar sesión robada/revocada en staging con cuentas ficticias |
| H03 | Validación inicial de archivos en cliente (C); límites de bucket/cuarentena no confirmados (V) | Alta | P0 para nuevas subidas | 3–5 j | Límite servidor, formatos/tamaño, cuota, nombre, cuarentena y análisis; rechazar bypass directo y contenido inválido |
| H04 | Doble almacenamiento y permisos independientes (C) | Alta | P0 antes de más traslados | 2–4 j | Inventario y política de revocación/retención; restaurar original y copia con permisos sin ampliarlos |
| H05 | Fuente remota mutable y badge de revisión no acreditado técnicamente (C); exactitud jurídica pendiente (V) | Alta | P1, revisión de contenido inmediata | 2–4 j técnicos + revisión letrada | Snapshot, checksum, dominio oficial, fecha/revisor y aprobación; ninguna cita pasa a publicado sin evidencia |
| H06 | Paquetes comprimidos y ensamblaje sin procedencia completa (C) | Alta | P1 | 3–5 j | Fuente legible, lockfiles, pruebas, artefacto por SHA y manifiesto de todos los componentes; reconstrucción determinista |
| H07 | Vite 8.0.13 con avisos npm high (C); exploit del sitio estático no demostrado | Alta en entorno vulnerable | P1 | 0,5–1 j | Actualizar versión corregida, revisar advisories y reproducir bundle; no exponer dev server |
| H08 | Enlace Inicio histórico y tokens divergentes (C) | Media | P2 | 1–2 j | Navegación del dominio confirmado, inventario de enlaces, tokens comunes y regresión móvil |
| H09 | Cabeceras Next no aplicables a export; política real Render desconocida (C/V) | Alta potencial | P1 | 1–2 j | CSP adaptada a portal/orientador, frame-ancestors y nosniff HTTP, HTTPS/HSTS si procede; verificar sin romper auth/PDF |
| H10 | Peso de bundles/fuentes y ausencia de CWV de campo (C/V) | Media | P2 | 1–3 j | Presupuesto por ruta, fuentes reducidas, caché y pruebas de laboratorio; p75 de campo cuando exista muestra |
| H11 | Demo y borradores pendientes; robots anidado sin efecto de dominio (C) | Media; alta si se presentan como definitivos | P1 antes de lanzamiento validado | 1–3 j + revisión jurídica | Revisión del alcance, privacidad y schema; noindex/SEO verificable por ruta y sin indexar datos privados |
| H12 | Runner mockeado, conexión real y restore no acreditados (C/V) | Alta | P0 operativo | 2–4 j | Inspección Render, staging, deploy autorizado con SHA, logs y web, simulacro de vuelta al artefacto anterior |
| H14 | Compensación cliente borra objeto ante cualquier fallo de metadatos (C); pérdida por respuesta ambigua posible (R) | Alta | P0 integridad documental | 1–3 j | Simular commit de metadatos seguido de timeout; original conservado y reconciliación idempotente, sin borrados en duda |
| H13 | Nuevos CRM, calendario y facturación pueden duplicar datos y costes (R) | Alta | P1 antes de diseñar integraciones | 1–2 j de decisión | Mapa de tratamientos, contratos, volúmenes, coste máximo y proveedor aprobado; no contratar sin decisión |

No se ha identificado una vulnerabilidad crítica explotada ni se afirma que existan brechas. H01 es crítico como escenario de impacto y falta de evidencia verificable. Si ya se tratan documentos sensibles, el titular debe priorizar la revisión controlada de políticas actuales; esta auditoría no desactiva ni modifica el portal.

Dependencias: H01 condiciona H02–H04 y todas las nuevas funciones privadas. H12 y H06 facilitan corregir el resto con trazabilidad. H05 depende además de revisión letrada; una validación JSON no sustituye esa revisión. H10 solo puede cerrarse completamente con acceso al sitio/medición autorizada.
