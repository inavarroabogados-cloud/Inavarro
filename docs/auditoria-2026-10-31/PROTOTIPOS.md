# E · Prototipos conceptuales de las funciones prioritarias

Baja fidelidad, sin código de aplicación, backend, envíos ni reservas. Todos los identificadores de ejemplo son ficticios. Las rutas propuestas no son enlaces existentes. Se conserva el símbolo iN y la firma iNavarro Abogados, azul tinta, marfil, cobre discreto, titulares editoriales y lectura clara. Reutilizar los recursos de marca reales. No se atribuyen al despacho disponibilidad, precios o resultados no confirmados.

## P1 · Solicitar una consulta voluntariamente

```text
[iN] iNavarro Abogados                    [Contacto]
Solicitar una consulta
Ya puedes usar el orientador sin dejar tus datos.

Nombre o forma de dirigirse a ti  [________________]
¿Cómo prefieres que contactemos? ( ) Correo ( ) Teléfono
Medio de contacto                 [________________]
Tema general                     [Seleccionar ▾]

No incluyas DNI, datos de terceros ni documentación.
Información básica de privacidad + enlace completo
[Enviar solicitud]               [Volver al orientador]

No confirma una cita ni la aceptación de un encargo.
```

No pedir un relato por defecto, ni subir archivos. Sin checkbox obligatorio de publicidad; cualquier marketing futuro es separado, opcional y desmarcado. La base jurídica de atención se revisa, no se sustituye por consentimiento genérico obligatorio. En móvil: una columna y labels persistentes; errores junto al campo y resumen con foco.

Estados: vacío → validando → enviando → solicitud registrada con referencia **solo tras persistencia**. Si falla correo después de guardar: «Solicitud registrada; aviso al despacho pendiente»; no duplicar al reintentar. Si falla BD: error sin éxito. Mostrar el medio de contacto para corregirlo; no incorporar respuestas del orientador automáticamente.

## P2 · Bandeja del despacho

```text
[iN] Despacho       Consultas | Citas | Editorial | Clientes
Consultas                             [Filtrar estado ▾]
Referencia       Recibida        Estado          Responsable
CONS-DEMO-001    [fecha real]    Nueva           Sin asignar

Detalle autorizado → Medio de contacto · Tema general
Estado: Nueva → Contactada → Cita propuesta → Cerrada
[Asignar] [Proponer cita] [Cerrar con motivo]
Historial de cambios y acceso restringido
```

Recepción no ve expedientes completos ni facturación por defecto. Filtros sin etiquetas estigmatizantes, puntuaciones jurídicas o probabilidad de éxito. Error/denegación no revela si existe otra consulta. Estados cerrados son reversibles según permisos y quedan auditados. Exportación no activada por defecto.

## P3 · Cita: seleccionar y confirmar sin inventar huecos

```text
Solicitar una cita
Zona horaria: Atlantic/Canary [cambiar zona de visualización]
[Fecha]  [Solo huecos devueltos por agenda aprobada]
Modalidad: [Opciones reales habilitadas por el despacho]

Resumen: día, hora y zona · modalidad · condiciones validadas
[Solicitar / Confirmar según política real] [Cambiar selección]
```

Mantener la zona visible en todos los pasos y correo. Sin calendario configurado: ofrecer contacto, no una parrilla ficticia. Estados: comprobando → retenido temporalmente → confirmado solo cuando la operación de negocio y el proveedor están confirmados; explicar expiración y colisión. Título externo genérico «Consulta iNavarro», no categoría o hechos del caso. Cancelación accesible e idempotente, según reglas aprobadas. Sin trackers incrustados por defecto.

## P4 · Editor y revisión de contenido

```text
Editorial / Borrador DEMO
Título [________________________________]
Tipo [Guía / Noticia / Comentario de resolución]
Fuentes [Añadir URL oficial, identificador y fecha de consulta]
Texto  [Editor con vista previa]
Estado [Borrador → Pendiente de revisión → Aprobado]

Panel de control:
[ ] Fuente accesible y corresponde con la afirmación
[ ] Vigencia, jurisdicción y fecha contrastadas
[ ] Sin datos confidenciales ni promesas de resultado
Revisor [Persona real autorizada]     Revisión [Fecha real]

[Guardar borrador] [Pedir revisión]
[Publicar] solo con rol, aprobación y autorización suficientes
```

Si una referencia ECLI no está contrastada, queda como «Pendiente» y bloquea la publicación de esa cita; nunca se genera para rellenar un campo. Conservar versiones y correcciones sin fingir novedades por cambiar fechas. Un fallo de fuente no convierte contenido nuevo en «comprobado». La publicación debe mostrar SHA/versión y permitir restaurar la versión anterior.

## P5 · Carrusel jurídico

```text
Crear carrusel desde contenido aprobado
Plantilla [iNavarro / 4:5]   Páginas [1…N según plantilla]
[Portada] [Idea 1] [Idea 2] [Fuente y alcance] [CTA discreta]

Vista previa móvil       Validación: contraste · texto seguro
[Exportar PNG/PDF]        [Volver a revisión]
```

Textos editables sin aportación de casos privados. Exportar con firma, origen y fecha real de revisión si existe, además de versión. Si desborda una slide, impedir exportación o pedir ajuste explícito; no recortar texto ocultamente. No publicar en Instagram automáticamente en la primera fase. Los avisos o ejemplos de marca no son testimonios.

## P6 · Evolución del portal, encargo y métricas

- Cliente: lista de **solo sus asuntos**, estado compartido, documentos autorizados, solicitud de ayuda. Recepción técnica y revisión jurídica son estados distintos. Explicitar si un archivo se está revisando o requiere un canal diferente.
- Personal: detalle con secciones separadas «visible al cliente» e «interno»; compartir documento requiere selección consciente y confirmación del destinatario. Revocación explica el alcance en Supabase y Drive, sin borrar originales.
- Gestión económica: presupuesto y hoja de encargo versionados → revisión → aceptación por canal validado → referencia de factura externa. Botón de emisión deshabilitado si falta proveedor o información requerida. No mostrar una factura ficticia como emitida.
- Métricas: consultas recibidas, contactadas y citas confirmadas con periodo y definición. Sin tasas de éxito jurídico, datos de expedientes en gráficos públicos ni atribución individual de problemas legales.

## Prueba de diseño antes de implementar

Revisión con el titular y usuarios ficticios: entender límites del orientador, corregir contacto, distinguir solicitud/cita/encargo, verificar zonas horarias y compartir solo el documento deseado. Probar 360/390/768/1440 px, teclado y lector de pantalla, zoom 200–400%, errores, espera y vacío. Objetivo WCAG 2.2 AA; estos esquemas no certifican conformidad.
