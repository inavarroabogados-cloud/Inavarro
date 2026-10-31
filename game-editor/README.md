# Estudio editorial privado — local

Este servidor **no se incorpora a dist**, no está enlazado desde la web y no modifica las herramientas privadas existentes. Es un panel funcional para un operador local; no es una autenticación compartida de producción.

## Arrancar

Node.js 22.7+. Desde la raíz del repositorio, en Bash:

```sh
read -rsp 'Contraseña local (mínimo 16 caracteres): ' GAME_EDITOR_PASSWORD
export GAME_EDITOR_PASSWORD
node game-editor/server.mjs
# Al terminar el servidor:
unset GAME_EDITOR_PASSWORD
```

Abrir **http://127.0.0.1:3210**. Usar la contraseña elegida. El valor no se imprime ni se guarda en Git. Puede suministrarse mediante un gestor de secretos. No pegarlo en chats ni crear una contraseña pública de demostración.

Entorno opcional: `GAME_EDITOR_PORT` (3210 por defecto), `GAME_EDITOR_DATA_DIR` (directorio privado fuera de Git). No hay integración automática con dotenv ni proveedor externo. Si falta contraseña o tiene menos de 16 caracteres, el servidor no arranca. Solo escucha en 127.0.0.1 y rechaza otros Host/Origin.

## Flujo editorial

Crear enunciado, tres opciones y respuesta, explicación, pista, nivel, escenario y jurisdicción explícita. Añadir título, artículo/referencia y enlace HTTPS de legislación; jurisprudencia opcional con órgano/resolución y referencia exacta (ECLI si existe). No inventar fuentes ni usar datos de casos reales.

Guardar inicialmente como borrador; corregir campos señalados. Antes de declarar contraste: revisar personalmente textos originales, vigencia, ámbito y excepciones con vLex Vincent, identificar revisor, fecha y notas. El servidor valida que haya datos, **no** verifica que esa consulta haya ocurrido ni garantiza corrección jurídica. El estado «Contraste declarado» registra la declaración humana y no equivale a publicación aprobada.

La exportación JSON requiere sesión y marca `publicationAllowed:false`. No hay botón de publicación ni importación automática al banco del juego. Pasar de demo a contenido real requiere revisión profesional, validación de las fuentes y un cambio revisable de código; nunca copiar borradores al directorio público. No hay credenciales ni API de vLex configuradas.

## Modelo de amenazas y controles

- No usar para información confidencial: solo redacción editorial general y ejemplos ficticios.
- Acceso por contraseña, derivada con scrypt y sal aleatoria; sesiones aleatorias en memoria, caducidad fija de una hora, cookie HttpOnly/SameSite Strict. No hay recuperación de contraseña por correo; el operador cambia el secreto local y reinicia para revocar sesiones.
- Cinco intentos fallidos por origen local y ventana de 15 minutos. No es un sistema distribuido ni apto para exposición a Internet.
- POST exige Origin exacto y token CSRF de la sesión. Host exacto evita DNS rebinding básico. No se habilita CORS.
- Datos/editorial API requieren sesión; archivo de datos no tiene ruta HTTP. CSP, no-store, nosniff, frame-ancestors none y sin servicios externos.
- Límites de tamaño y longitud, opciones validadas, enlaces HTTPS sin credenciales y render por textContent. No se ejecuta HTML del editor ni se descargan las fuentes.
- Escritura con archivo temporal y renombrado atómico; permisos 0600 y directorio 0700 en sistemas POSIX. Control de versión evita sobrescribir una edición desactualizada (409).
- Fallos de disco o JSON corrupto no devuelven éxito; se conserva el archivo y se informa de guardado no confirmado. No se registran contraseña, preguntas ni fuentes en logs. No hay borrado desde UI.
- HTTP es aceptable solo en loopback para esta revisión. La cookie no usa Secure en este modo. **No** abrir el servidor a la red, no tunelizar ni reutilizarlo en Render. Para producción: backend separado con HTTPS, sesión Secure, identidad individual/MFA, autorización de editor/revisor, auditoría, rate limiting duradero, almacén transaccional, política de retención y gestión de incidentes.

## Copias y protección de datos

Guardar/exportar solo contenido editorial; el nombre del revisor puede ser dato personal. En revisión usar identificaciones ficticias. Antes de uso real, definir responsables, acceso, finalidad/base aplicable, plazos de conservación y aviso a revisores; no afirmar cumplimiento automático de RGPD/LOPDGDD.

Hacer copia cifrada del directorio de datos fuera del repositorio, con acceso restringido. Exportación JSON no cifra el contenido. Para restaurar: detener el servidor, conservar el archivo averiado, restaurar una copia de `questions.json`, comprobar permisos, reiniciar y revisar lista/exportación. Probar la restauración con datos ficticios antes de confiar en el proceso. El secreto de acceso se gestiona aparte; las sesiones no se restauran. Mantener varias versiones y no subir copias al directorio público.

Limitaciones conocidas: un único secreto local, bloqueo se reinicia con el proceso, sin historial de auditoría persistente, sin cifrado propio del disco ni integración de almacenamiento remoto. No habilitado para expedientes, documentos, datos de clientes ni equipo multiusuario.
