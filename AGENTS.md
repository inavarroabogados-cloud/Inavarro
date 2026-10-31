# iNavarro: desarrollo y publicación

Repositorio del portal externo: inavarroabogados-cloud/Inavarro. Servicio esperado: Render inavarro-abogados. Dominio confirmado: https://inavarro-abogados.onrender.com. La vinculación real se comprueba mediante API; no inferirla de estos datos esperados.

Lee DEPLOYMENT.md antes de publicar. Usa el checkout existente; cada tarea está aislada, no crees worktrees salvo petición explícita. Conserva las instrucciones editoriales de EDITORIAL.md, sin interpretar sus tareas diarias como autorización para publicar cualquier cambio solicitado.

Cuando el usuario autorice publicar, completa pruebas relevantes, confirma la rama remota, ejecuta `python3 ops/render.py inspect` y usa `deploy --commit SHA` para solicitar, seguir y verificar el despliegue. Guarda el ID `dep-…` del resultado y, si se interrumpe la tarea, continúa con `verify` en vez de crear un despliegue duplicado. No cambies variables del servicio ni autodeploy sin entender la configuración y el alcance autorizado. Si autodeploy ya está activo, informa de que un push a su rama puede publicar; usa una rama no desplegable para cambios pendientes de autorización.

No declarar una publicación solo por commit/push o estado `live`. Deben revisarse logs de compilación y comprobarse la versión exacta y las páginas públicas. No ocultar fallos de API, logs vacíos, 404, timeout ni respuestas de otro despliegue. Distingue pruebas con fixtures de verificación en Render.

Secretos exclusivamente en los ajustes seguros del entorno. No imprimir claves, valores de variables sensibles ni mensajes íntegros de logs sin inspección controlada. No buscar credenciales en archivos privados. No usar hooks como prueba de despliegue finalizado. Si falta acceso, seguir el procedimiento concreto de DEPLOYMENT.md; nunca solicitar tokens por chat. No hay que recrear el servicio ni contratar otro plan.
