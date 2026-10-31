# Publicación verificable en Render

## Estado real

- Servicio indicado por el titular: `inavarro-abogados`.
- URL confirmada: https://inavarro-abogados.onrender.com.
- Repositorio esperado según instrucciones y archivos: `inavarroabogados-cloud/Inavarro`, rama `main`.
- `904d355c725c4b5e7068838c4e48fff1f0b1ad4f` verificado mediante Git en `origin/main`.
- **La vinculación, los comandos y el autodespliegue configurados realmente en Render todavía no están verificados**: esta sesión no tiene integración Render ni `RENDER_API_KEY`, y su red actual no permite acceder al proveedor. No confundir el repositorio esperado con una lectura de la configuración del servicio.
- No se ha iniciado ni confirmado un despliegue mediante API. Los anteriores pushes están confirmados como cambios en Git, no como despliegues terminados.

## Configuración segura, una sola vez

1. Entra en tu cuenta de [Render](https://dashboard.render.com/), abre **Account Settings → API Keys** y crea una clave con un nombre identificable, por ejemplo `Codex-iNavarro`. La cuenta debe poder consultar y desplegar el servicio y leer sus registros en el workspace correspondiente. Las claves heredan permisos de la cuenta; no se presume que tengan alcance exclusivo por servicio. Usa una cuenta dedicada con los permisos mínimos disponibles si tu organización lo permite.
2. En los **ajustes de este entorno de Codex**, añade el valor como secreto **`RENDER_API_KEY`**, asociado al destino HTTPS **`api.render.com`**. La declaración del secreto está guardada en el borrador; falta introducir su valor de forma segura. No pegarlo en el chat, Git, `.env` versionados, logs ni parámetros de comandos. No es una variable que deba añadirse al frontend o al servicio Render.
3. Revisa y guarda los cambios del entorno; publica el entorno para hacer reutilizable su configuración. El borrador conserva los dominios previos y añade `api.render.com`. Deben estar permitidos `api.render.com`, `inavarro-abogados.onrender.com` y la fuente editorial `inavarro-noticias.creamaphid4.chatgpt.site`. `api.github.com` se mantiene para futuras comprobaciones de GitHub. No desactivar el proxy ni TLS.
4. Si hay varios servicios con el mismo nombre, añade la variable **no secreta** `RENDER_SERVICE_ID` con el identificador `srv-…` que aparece en la URL del servicio de Render. Si el nombre es único, el comando lo descubre sin pedirte el ID.
5. Después de guardar y aplicar la configuración, pide comprobar el acceso. Se ejecutará `inspect` antes de desplegar. La presencia de una variable por sí sola no acredita que la clave tenga permisos ni que la red esté habilitada.

No hace falta crear otro alojamiento ni compartir tu contraseña. Un Deploy Hook aislado **no basta** para el objetivo: puede solicitar una publicación, pero no permite por sí solo comprobar repositorio, rama, estado y registros. La clave puede revocarse en Render y eliminarse desde los ajustes seguros cuando deje de utilizarse.

## Comandos (Python 3.10+, biblioteca estándar)

```sh
# Solo lectura: servicio real, repositorio, rama, tipo, comandos, directorio y autodespliegue.
python3 ops/render.py inspect

# Publicación autorizada del commit histórico solicitado. Este commit no tiene deployment.json.
python3 ops/render.py deploy --commit 904d355 --allow-missing-marker

# Publicar una versión posterior que ya incluye el marcador: usar su SHA real.
python3 ops/render.py deploy --commit SHA_CONFIRMADO

# Reanudar seguimiento de un deploy ya creado; no solicitar otro despliegue si se corta la sesión.
python3 ops/render.py verify --commit SHA_CONFIRMADO --deploy-id dep_ID_CONFIRMADO

# Pruebas locales del flujo, sin API ni credenciales.
python3 -m unittest discover -s tests -p 'test_render.py' -v
```

`deploy` exige un SHA y confirma que pertenece a `origin/main`. Solo se ejecuta cuando el titular autoriza publicar; no se instala un workflow que publique automáticamente en cada push. Si el servicio ya tiene autodeploy activado, `inspect` lo informará: habría que acordar desactivarlo o trabajar en ramas sin despliegue para que los cambios no salgan antes de autorización. No se cambia esa preferencia a ciegas.

El runner usa el contrato del cliente oficial [render-oss/cli](https://github.com/render-oss/cli), revisado en `ccd220c88de25433f1e77fe1e66a64adefa41c43`. Solo realiza GET de servicios, deploys y registros; el único POST solicita el despliegue. No usa endpoints de variables de entorno, no modifica secretos del servicio y no reintenta POST automáticamente. Las credenciales solo viajan en Authorization hacia api.render.com; las comprobaciones públicas no reciben esa cabecera. Se rechazan redirecciones para no reenviarlas a otro destino.

## Compilación y arranque

Configuración **esperada, pendiente de contrastar con Render**:

| Campo | Esperado |
| --- | --- |
| Tipo | Static Site |
| Repositorio | `inavarroabogados-cloud/Inavarro` |
| Rama | `main` |
| Root directory | Raíz del repositorio |
| Build command | `node deploy.mjs` (también soportado `node build-render.mjs`) |
| Publish directory | `dist` |
| Start command | No aplica a un Static Site |

El comando prepara recursos, actualiza noticias desde la fuente editorial, genera el portal y el área privada, instala `/y-ahora-que/` y escribe un marcador público `deployment.json` con el SHA. La ejecución directa también extrae recursos en checkouts nuevos. Si Render tiene tipo o comandos diferentes, el runner se detiene para diagnosticarlo sin cambiar variables sensibles ni convertir el servicio a ciegas.

La compilación depende de una fuente editorial alojada en ChatGPT; el sitio público sigue en Render. Un fallo de esa fuente puede impedir un build y mantener el despliegue anterior. El runner detecta el estado fallido y no afirma publicación. Eliminar esa dependencia sería otro cambio de arquitectura que debe conservar noticias y proceso editorial.

## Criterio de éxito y fallos

El ciclo es: desarrollar → pruebas pertinentes → commit/push autorizado → `inspect` → desplegar SHA → seguir `dep-…` → revisar registros de build → estado `live` con el SHA solicitado → comprobar portada, herramienta, primera pregunta y guía → comprobar SHA servido por `deployment.json` → confirmar que ningún deploy posterior lo ha sustituido.

El runner consulta todas las páginas de registros en la ventana del deploy y los inspecciona en memoria, emitiendo conteos de errores/avisos, nunca mensajes que podrían contener secretos. Los indicadores de error requieren diagnóstico antes de describir los registros como limpios. Un `live` no permite ignorar un 404, contenido incorrecto o un marcador viejo. Cero registros, permisos denegados, respuestas inesperadas, cambio de commit o timeout dejan el resultado **sin confirmar**. La excepción `--allow-missing-marker` solo permite un 404 del marcador en commits históricos; no permite ignorar un marcador incorrecto ni fallos de otras páginas.

En caso de fallo, se conserva el ID y se revisan los registros del deploy y su estado; no se fuerzan redeploys ni borrados de caché en bucle. La revisión detallada de mensajes debe hacerse de forma controlada y sin copiar secretos al chat. Los tests del runner usan respuestas simuladas para verificar sus controles; no sustituyen la primera prueba real una vez configuradas credenciales y red.
