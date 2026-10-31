# F · Backlog listo para desarrollar y probar

**No iniciado ni aprobado.** Cada tarea se entrega por PR pequeña, con responsable, evidencia de pruebas y autorización de publicación aparte. Estimaciones del PLAN son por fase; estas tareas no son otra suma de jornadas. P0 bloquea ampliar tratamiento confidencial. Datos de prueba sintéticos y entornos aislados.

| ID / fase | Tarea | Dependencias | Criterio de aceptación y prueba |
| --- | --- | --- | --- |
| SEC-01 / F0 / P0 | Inventariar configuración y esquema sin datos | Acceso de lectura habilitado | Config Render real, versión del servicio, región/proveedores y políticas SQL/Storage/RPC exportados sin secretos; diferencias con el repositorio documentadas |
| SEC-02 / F0 / P0 | Matriz de autorización por rol, caso y documento | SEC-01 | Casos sintéticos A/B; anónimo y cliente A no leen/escriben B ni acceden por URL directa; probado en tablas, Storage y RPC |
| SEC-03 / F0 / P0 | Step-up/MFA del personal y revocación | SEC-01–02 | Acciones privilegiadas denegadas con sesión sin MFA, staff retirado o token revocado; recuperación controlada sin bloquear definitivamente al titular |
| SEC-04 / F0/F5 / P0 | Restricciones efectivas de subida | SEC-02 | Solicitudes directas con tamaño/MIME/firma incorrectos o case_id ajeno rechazadas por servidor/bucket; cuota y cuarentena verificadas |
| OPS-01 / F0 / P0 | Inventario y simulacro de restauración | SEC-01 | Backups consistentes de metadatos/objetos/ACL; restore en destino aislado sin sobrescribir datos actuales; acta de resultado |
| OPS-02 / F0–F1 / P0 | Confirmar publicación exacta y modo autodeploy | SEC-01 | Deploy en staging autorizado por SHA, logs y páginas comprobados; desconexión del runner reanudable sin duplicados; ningún push no autorizado publica |
| SRC-01 / F1 / P1 | Extraer SPA y handler a fuente legible | OPS-01 | Archivos y lockfile versionados fuera del literal; JS/CSS reproducidos o diferencias justificadas; sin cambios funcionales ni datos |
| SRC-02 / F1 / P1 | Procedencia de orientador y carruseles | SRC-01 | Manifiesto con SHAs y checksums de componentes; mismatch bloquea ensamblaje; no se ejecuta un tar desconocido |
| CI-01 / F1 / P1 | Pipeline PR de checks independientes | SRC-01 | Tipos, reglas, pruebas de acceso, build y smoke son checks reales; sin claves ni documentos en logs/artefactos; PR no despliega producción |
| DEP-01 / F1 / P1 | Actualizar Vite vulnerable | SRC-01 | Avisos aplicables revisados, versión corregida y lockfile; build/auth/callbacks de prueba pasan; no actualizar a ciegas todo el árbol |
| WEB-01 / F1 / P1 | Navegación y cabeceras por aplicación | OPS-02 | Inicio lleva al dominio aprobado; CSP permite lo imprescindible por app; scripts/auth/PDF funcionan; cabeceras reales probadas |
| LEG-01 / F1/F4 / P1 | Revisión de textos e información profesional | Titular/revisor | Inventario de páginas, estado de aprobación y fecha real; no se cambia una bandera sin modificar/validar el contenido correspondiente |
| LEAD-01 / F2 / P1 | Modelo de consulta voluntaria y roles | SEC-02, LEG-01 | Esquema, conservación, versionado de aviso e índices; no crea cliente/expediente ni mezcla datos del orientador sin decisión explícita |
| LEAD-02 / F2 / P1 | Endpoint de recepción seguro | LEAD-01 | Validación servidor, tamaños máximos, antispam, rate limit y idempotencia; pruebas de abuso y fallo BD; no éxito ficticio |
| LEAD-03 / F2 / P1 | Bandeja, estados y responsable | LEAD-02 | Rol recepción solo ve campos necesarios; cambios auditados; dos ediciones concurrentes no pisan estado sin aviso |
| LEAD-04 / F2 / P1 | Avisos de correo transaccional | Proveedor aprobado, LEAD-02 | Outbox y reintento; fallo de correo no duplica consulta; cabeceras seguras y sin relatos; SPF/DKIM/DMARC revisados según proveedor |
| CAL-01 / F3 / P1 | Disponibilidad y reglas de agenda | Política de citas, LEAD-03 | Zona explícita y DST; buffer/cancelación; sin proveedor no hay huecos inventados; tests del mismo instante en dos zonas |
| CAL-02 / F3 / P1 | Reserva y sincronización idempotentes | CAL-01, cuenta habilitada | Dos peticiones al mismo hueco producen una confirmación; timeout externo queda pendiente; webhook repetido no duplica evento |
| ED-01 / F4 / P1 | Versiones y estados editoriales | SRC-01, responsable editorial | Borrador/revisión/aprobación/publicación; historial y diff; no publicar por cambiar JSON sin aprobación |
| ED-02 / F4 / P1 | Fuentes, vigencia y jurisprudencia | ED-01 | URL oficial, identificador auténtico, fecha y prueba de correspondencia; ECLI no confirmado bloquea; corrección conserva historia |
| ED-03 / F4 / P1 | Publicación editorial con recuperación | ED-02, OPS-02 | Artefacto aprobado por SHA, revisor real, preview; rollback a edición anterior sin consultar una fuente mutable |
| SOCIAL-01 / F4 / P2 | Plantillas y editor de carruseles | ED-02, tokens de marca | Formatos elegidos, contraste, límites de texto y prueba visual; ningún input privado; marca/versión/fuente coherentes |
| SOCIAL-02 / F4 / P2 | Exportación y compartir con alternativas | SOCIAL-01 | PNG/PDF válidos, sin recortes; errores/cancelación/copia manual accesibles; sin publicación en redes no autorizada |
| CASE-01 / F5 / P1 | Roles granulares y separación interno/cliente | SEC-02–04 | Crear/editar/compartir según rol; campo interno nunca llega a respuesta cliente; revisión de select('*') y paginación |
| DOC-01 / F0/F5 / P0 | Preservar subidas ante errores ambiguos | SEC-04, OPS-01 | Simular inserción confirmada en servidor con respuesta perdida: no borrar original; reconciliar por ID y limpiar solo tras comprobar referencias |
| CASE-02 / F5 / P1 | Descarga y retención coordinadas | CASE-01, OPS-01 | Objeto inaccesible tras revocación; retención y bloqueo legal documentados; ningún borrado de originales automático |
| DRIVE-01 / F5 / P1 | ACL y copias huérfanas reconciliables | CASE-02, garantías proveedor | Simular error entre upload y PATCH; localizar copia por ID y recuperar sin pérdida ni duplicar; aprobación y actor auditados |
| MONEY-01 / F6 / P2 | Presupuesto y hoja de encargo versionados | CASE-01, plantillas revisadas | Importes decimales, impuestos configurados con revisión, aceptación ligada a versión; sin aceptación no se marca contratado |
| MONEY-02 / F6 / P2 | Adaptador a facturación/firma | MONEY-01, proveedor aprobado | Idempotencia, estados reales, permisos contables, conciliación y evidencias; normativa vigente contrastada, sin motor fiscal improvisado |
| MET-01 / F7 / P2 | Diccionario de eventos y finalidades | LEAD-03, revisión privacidad | Solo eventos y atributos aprobados; tests que impiden contactos, tema, relato y case_id en analítica pública |
| MET-02 / F7 / P2 | Panel operativo agregado | MET-01 | Definiciones reproducibles de métricas, periodo y exclusiones; permisos; cero estadísticas inventadas y sin éxito jurídico puntuado |
| UX-01 / transversal | Tokens y flujos accesibles | Prototipos aprobados | Marca conservada; teclado/lector de pantalla, errores y vacíos; 360/390/768/1440 y zoom; no depender solo de axe |
| PERF-01 / transversal | Presupuestos y CWV medibles | OPS-02 | Medir carga por ruta, caché y JS; no confundir peso artefacto con descarga; campo p75 solo con muestra y privacidad aprobadas |

Definición de terminado: revisión técnica y funcional, comprobaciones de permisos pertinentes, registro del tratamiento cuando cambie, plan de reversión y documentación. «Mergeado» no equivale a «desplegado»; «desplegado» no equivale a «verificado». Ninguna tarea de esta lista está marcada como completada por haber redactado este plan.
