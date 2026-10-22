# Documentos del área de clientes en Google Drive

Estado: integración preparada. No activar hasta completar OAuth y una prueba real.

El portal conserva cuentas, expedientes, asignaciones y metadatos en Supabase. La función `drive-documents` guarda los archivos en Drive. Cada expediente tiene una subcarpeta identificada por su UUID mediante `appProperties`; su nombre visible es la referencia del expediente. No se crean permisos públicos ni enlaces de descarga de Drive para los clientes. Las descargas pasan por la función y vuelven a comprobar los permisos actuales del portal.

## Conexión pendiente

La conexión de Google Drive de ChatGPT no entrega credenciales al servidor. Hay que crear un cliente OAuth de aplicación web propio, habilitar Drive API y autorizar la cuenta del despacho con acceso offline. El consentimiento de Google debe quedar en un estado apto para uso continuado; no depender de un refresh token de pruebas que caduque a los siete días.

Usar el alcance `https://www.googleapis.com/auth/drive.file`. Para la carpeta existente hay que seleccionarla mediante Google Picker con ese mismo cliente OAuth. Otra opción es crear la carpeta con el propio cliente OAuth. Un refresh token con `drive.file` no da acceso por sí solo a una carpeta creada desde otra aplicación. No ampliar a todo Drive silenciosamente para eludir esta selección.

Carpeta privada creada desde ChatGPT, aún pendiente de autorizar a la aplicación:
https://drive.google.com/drive/folders/1Rao3q7DP3vxqWec8G5lA5vUIS4HTo1mT

Registrar estos secretos exclusivamente en Edge Functions > Secrets de Supabase, nunca en el frontend, repositorio ni conversación:

- GOOGLE_DRIVE_CLIENT_ID
- GOOGLE_DRIVE_CLIENT_SECRET
- GOOGLE_DRIVE_REFRESH_TOKEN
- GOOGLE_DRIVE_ROOT_FOLDER_ID = 1Rao3q7DP3vxqWec8G5lA5vUIS4HTo1mT (después de la selección con Picker)
- PORTAL_PRIVACY_VERSION = versión vigente del aviso del portal
- ALLOWED_ORIGINS = https://inavarro-abogados.onrender.com

SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase en la función. Esta última nunca se devuelve al navegador. La función usa el JWT del cliente y las políticas existentes para leer el expediente y los documentos. Solo el registro de metadatos del archivo usa la clave de servidor, porque la política INSERT para navegadores exige un objeto en Supabase Storage y prohíbe registrar identificadores de Drive directamente. Los navegadores no pueden insertar referencias arbitrarias a Drive.

## Activación

1. Aplicar el cambio de esquema de `sql/google-drive-storage.sql` y desplegar `supabase/functions/drive-documents` con comprobación de JWT y completar los secretos OAuth.
2. Comprobar `GET /functions/v1/drive-documents?action=status` desde una sesión del despacho. Debe devolver `configured: true`; no basta para acreditar que las credenciales funcionan.
3. Completar en entorno de prueba una subida y descarga real, y verificar los permisos con dos usuarios de expedientes diferentes.
4. Actualizar el aviso de privacidad para recoger el almacenamiento documental en Google Drive y su configuración efectiva. Incrementar la versión y configurar PORTAL_PRIVACY_VERSION a juego; obtener nueva lectura por los usuarios cuando corresponda.
5. Compilar el portal con `VITE_DOCUMENT_STORAGE=google-drive` y regenerar el paquete de publicación usando `scripts/package-portal.py`.
6. Publicar la nueva versión. No borrar el almacén antiguo: los documentos con proveedor supabase siguen descargándose desde Supabase.

Si no hay autorización OAuth o la subida falla, no se confirma recepción ni se desvía silenciosamente el archivo a otro proveedor. Las nuevas subidas siguen usando Supabase mientras no se cambie el proveedor de compilación.

## Verificación y recuperación

`node --test tests/drive-documents.test.mjs`, `cd portal && npm ci && npm run check && npm run build`.

No se han migrado documentos; la consulta inicial no encontró objetos en Supabase Storage. Una escritura de metadatos puede fallar después de que Drive guarde el archivo. El servidor conserva entonces el archivo privado para evitar pérdida de documentación. Un operador puede reconciliarlo mediante `appProperties.portal_document_id` y `portal_case_id`; el cliente recibe error, no una confirmación de recepción. No borrar archivos ante respuestas ambiguas de la base de datos.

La creación simultánea de la primera subcarpeta de un mismo expediente puede producir carpetas duplicadas con el mismo UUID en Drive. Los archivos conservan su identidad y se localizan por appProperties. Antes de un uso intensivo, añadir una asignación transaccional de carpetas en base de datos para asegurar unicidad.
