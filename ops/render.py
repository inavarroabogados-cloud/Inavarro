#!/usr/bin/env python3
"""Render release runner. No third party dependencies, no environment writes or secret dumps.
API contract checked against render-oss/cli ccd220c, pkg/client/types_gen.go.
"""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'ops/render.json').read_text())
API = 'https://api.render.com/v1'
FAILED = {'build_failed', 'pre_deploy_failed', 'update_failed', 'canceled', 'deactivated'}

class ReleaseError(Exception):
    pass

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ReleaseError('Redirección rechazada: no reenviar credenciales a otro destino.')

class Render:
    def __init__(self):
        self.key = os.environ.get('RENDER_API_KEY')
        if not self.key:
            raise ReleaseError('Falta RENDER_API_KEY. Configúrala como secreto del entorno para api.render.com; nunca en chat ni en Git.')
        self.opener = urllib.request.build_opener(NoRedirect())

    def request(self, path, method='GET', payload=None):
        if not path.startswith('/') or path.startswith('//'):
            raise ReleaseError('Ruta de API inválida.')
        req = urllib.request.Request(API + path, method=method,
            data=json.dumps(payload).encode() if payload is not None else None,
            headers={'Authorization': 'Bearer ' + self.key, 'Accept': 'application/json', 'Content-Type': 'application/json'})
        try:
            with self.opener.open(req, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            # Never echo provider bodies: errors can contain secrets or infrastructure details.
            raise ReleaseError(f'Render API: HTTP {error.code}. Revisar permisos/red; no se ha modificado la configuración.') from None
        except (urllib.error.URLError, ValueError, TimeoutError):
            raise ReleaseError('No se pudo completar la petición a Render. No se reintentan peticiones POST para evitar despliegues duplicados.') from None

    def service(self):
        service_id = os.environ.get('RENDER_SERVICE_ID')
        if service_id:
            if not re.fullmatch(r'srv-[A-Za-z0-9]+', service_id):
                raise ReleaseError('RENDER_SERVICE_ID inválido.')
            service = self.request('/services/' + service_id)
        else:
            cursor = None
            matches = []
            for _ in range(20):
                query = {'name': CONFIG['service_name'], 'limit': 100}
                if cursor:
                    query['cursor'] = cursor
                page = self.request('/services?' + urllib.parse.urlencode(query))
                if not isinstance(page, list):
                    raise ReleaseError('Respuesta de servicios inesperada.')
                matches += [row['service'] for row in page if row.get('service', {}).get('name') == CONFIG['service_name']]
                if len(page) < 100:
                    break
                next_cursor = page[-1].get('cursor')
                if not next_cursor or next_cursor == cursor:
                    raise ReleaseError('No se pudo completar la lista de servicios.')
                cursor = next_cursor
            else:
                raise ReleaseError('Lista de servicios incompleta; indica RENDER_SERVICE_ID.')
            if len(matches) != 1:
                raise ReleaseError('Servicio no encontrado o nombre ambiguo; indica el ID srv-… como variable no secreta RENDER_SERVICE_ID.')
            service = self.request('/services/' + matches[0]['id'])
        if service.get('name') != CONFIG['service_name']:
            raise ReleaseError('El servicio seleccionado no es inavarro-abogados.')
        return service


def configuration_summary(service):
    details = service.get('serviceDetails', {})
    env = details.get('envSpecificDetails', {})
    return {k: v for k, v in {
        'id': service.get('id'), 'name': service.get('name'), 'repository': service.get('repo'),
        'branch': service.get('branch'), 'type': service.get('type'), 'rootDir': service.get('rootDir'),
        'autoDeploy': service.get('autoDeployTrigger', service.get('autoDeploy')),
        'buildCommand': details.get('buildCommand', env.get('buildCommand')),
        'publishPath': details.get('publishPath'), 'startCommand': env.get('startCommand'),
        'url': details.get('url'),
    }.items() if v is not None}


def validate_service(service):
    s = configuration_summary(service)
    expected = {'repository': CONFIG['expected_repository'], 'branch': CONFIG['expected_branch'],
                'type': CONFIG['expected_type'], 'publishPath': CONFIG['expected_publish_path'], 'url': CONFIG['public_origin']}
    for key, value in expected.items():
        actual = (s.get(key) or '').removesuffix('.git').rstrip('/')
        if actual != value.rstrip('/'):
            raise ReleaseError(f'Configuración no confirmada: {key}. Ejecutar inspect y revisar antes de desplegar; no se cambia automáticamente.')
    if service.get('suspended') not in (None, 'not_suspended'):
        raise ReleaseError('El servicio está suspendido; no se activa ni modifica automáticamente.')
    if s.get('rootDir') not in ('', '.', None):
        raise ReleaseError('El directorio raíz del servicio no coincide con el proyecto.')
    if s.get('buildCommand') not in CONFIG['accepted_build_commands']:
        raise ReleaseError('Comando de compilación inesperado. Revisar inspect antes de desplegar.')
    return s


def git_commit(ref):
    # Argument list, never shell interpolation. Resolve only commit objects.
    if not re.fullmatch(r'[0-9a-fA-F]{7,40}', ref):
        raise ReleaseError('Indica un SHA de commit (7–40 caracteres hexadecimales).')
    try:
        subprocess.run(['git', 'fetch', 'origin', CONFIG['expected_branch']], cwd=ROOT, check=True, capture_output=True)
        sha = subprocess.check_output(['git', 'rev-parse', '--verify', ref + '^{commit}'], cwd=ROOT, text=True).strip()
        subprocess.run(['git', 'merge-base', '--is-ancestor', sha, 'origin/' + CONFIG['expected_branch']], cwd=ROOT, check=True, capture_output=True)
        return sha
    except subprocess.CalledProcessError:
        raise ReleaseError('No se pudo verificar el commit en origin/main. No se inicia el despliegue.') from None


def build_logs(api, service, deploy):
    if not service.get('ownerId') or not deploy.get('createdAt'):
        raise ReleaseError('No se pueden delimitar los registros de este despliegue.')
    query = {'ownerId': service['ownerId'], 'resource': service['id'], 'type': 'build',
             'direction': 'forward', 'startTime': deploy['createdAt'], 'limit': 100}
    if deploy.get('finishedAt'):
        query['endTime'] = deploy['finishedAt']
    count = warnings = errors = 0
    seen = set()
    for _ in range(500):
        result = api.request('/logs?' + urllib.parse.urlencode(query))
        if not isinstance(result.get('logs'), list):
            raise ReleaseError('Respuesta de registros inesperada.')
        for log in result['logs']:
            if log.get('id') in seen:
                continue
            seen.add(log.get('id'))
            count += 1
            labels = {label.get('name'): label.get('value') for label in log.get('labels', [])}
            level = str(labels.get('level', '')).lower()
            text = log.get('message', '')
            errors += int(level in ('error', 'fatal') or bool(re.search(r'\b(error|failed)\b', text, re.I)))
            warnings += int(level in ('warn', 'warning'))
            # Messages are inspected in memory, never printed or stored: build logs may contain secrets.
        if not result.get('hasMore'):
            break
        next_range = (result.get('nextStartTime'), result.get('nextEndTime'))
        if not all(next_range) or next_range == (query.get('startTime'), query.get('endTime')):
            raise ReleaseError('Paginación de registros incompleta.')
        query['startTime'], query['endTime'] = next_range
    else:
        raise ReleaseError('Registros incompletos: se alcanzó el límite de páginas.')
    print(json.dumps({'buildLogEntriesReviewed': count, 'errorIndicators': errors, 'warningEntries': warnings}))
    if not count:
        raise ReleaseError('Sin registros de compilación accesibles; no se confirma el despliegue.')
    # Warnings/error words can occur in successful builds. Actual Render status controls outcome;
    # errorIndicators require human review before the assistant describes the logs as clean.
    return count


def public_checks(sha, allow_missing_marker=False):
    opener = urllib.request.build_opener(NoRedirect())
    def read(path):
        request = urllib.request.Request(CONFIG['public_origin'] + path, headers={'Cache-Control': 'no-cache'})
        try:
            with opener.open(request, timeout=45) as response:
                if response.status != 200:
                    raise ReleaseError(f'La web no responde 200 en {path}.')
                return response.read(4_000_001).decode('utf-8')
        except urllib.error.HTTPError as error:
            raise ReleaseError(f'La web responde HTTP {error.code} en {path}.') from None
        except (urllib.error.URLError, TimeoutError, UnicodeError):
            raise ReleaseError(f'No se pudo verificar la página {path}.') from None
    for path, content in CONFIG['checks'].items():
        text = read(path)
        if content not in text or (path.startswith('/y-ahora-que/') and 'noindex' not in text):
            raise ReleaseError(f'El contenido esperado no está disponible en {path}.')
        print('HTTP 200 + contenido esperado: ' + path)
    try:
        marker = json.loads(read('/deployment.json?commit=' + sha))
    except ReleaseError as error:
        if not allow_missing_marker or 'HTTP 404' not in str(error):
            raise
        print('Commit histórico sin marcador; la versión se verifica con la API de Render.')
        return
    if marker.get('commit') != sha:
        raise ReleaseError('El commit servido por el CDN no coincide con el solicitado.')


def monitor(api, service, deploy_id, sha, timeout=1200, allow_missing_marker=False):
    end = time.monotonic() + timeout
    last_status = None
    while time.monotonic() < end:
        deploy = api.request(f'/services/{service["id"]}/deploys/{deploy_id}')
        status = deploy.get('status')
        if status != last_status:
            print(f'Despliegue {deploy_id}: {status}', flush=True)
            last_status = status
        if status in FAILED:
            build_logs(api, service, deploy)
            raise ReleaseError('El despliegue ha fallado o se ha cancelado; no está publicado.')
        if status == 'live':
            if deploy.get('commit', {}).get('id') != sha:
                raise ReleaseError('Render ha desplegado otro commit.')
            build_logs(api, service, deploy)
            public_checks(sha, allow_missing_marker)
            latest = api.request(f'/services/{service["id"]}/deploys?limit=1')
            current = latest[0].get('deploy', {}) if latest else {}
            if current.get('id') != deploy_id or current.get('status') != 'live' or current.get('commit', {}).get('id') != sha:
                raise ReleaseError('Otro despliegue ha comenzado; no se confirma el estado final.')
            print('PUBLICACIÓN VERIFICADA: Render live, commit exacto, registros revisados y web comprobada.')
            return
        time.sleep(10)
    raise ReleaseError('Tiempo agotado; no se confirma publicación. Continuar con verify --deploy-id, sin crear otro despliegue.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['inspect', 'deploy', 'verify'])
    parser.add_argument('--commit')
    parser.add_argument('--deploy-id')
    parser.add_argument('--allow-missing-marker', action='store_true', help='Solo para commits históricos sin deployment.json (p. ej. 904d355).')
    args = parser.parse_args()
    api = Render()
    service = api.service()
    if args.command == 'inspect':
        print(json.dumps(configuration_summary(service), ensure_ascii=False, indent=2))
        validate_service(service)
        print('Vinculación y compilación confirmadas. Servicio estático: no requiere comando de arranque.')
        return
    validate_service(service)
    sha = git_commit(args.commit or '')
    if args.command == 'deploy':
        # This command is only invoked after the user authorizes publication. No configuration PATCH.
        latest = api.request(f'/services/{service["id"]}/deploys?limit=1')
        existing = latest[0].get('deploy', {}) if latest else {}
        active = existing.get('status') in {'created', 'queued', 'build_in_progress', 'pre_deploy_in_progress', 'update_in_progress'}
        same_commit = existing.get('commit', {}).get('id') == sha
        if active and not same_commit:
            raise ReleaseError('Hay otro despliegue en curso. No se solicita uno que pueda sustituirlo.')
        if same_commit and (active or existing.get('status') == 'live'):
            deploy = existing
            print('Se reutiliza el despliegue existente; no se duplica la petición.', flush=True)
        else:
            deploy = api.request(f'/services/{service["id"]}/deploys', 'POST', {'commitId': sha})
        deploy_id = deploy.get('id')
        if not deploy_id or not re.fullmatch(r'dep-[A-Za-z0-9]+', deploy_id):
            raise ReleaseError('Respuesta de creación no confirmada. Revisar Render antes de reintentar POST.')
        print('Despliegue solicitado: ' + deploy_id, flush=True)
    else:
        deploy_id = args.deploy_id or ''
        if not re.fullmatch(r'dep-[A-Za-z0-9]+', deploy_id):
            raise ReleaseError('verify requiere un --deploy-id válido.')
    monitor(api, service, deploy_id, sha, allow_missing_marker=args.allow_missing_marker)

if __name__ == '__main__':
    try:
        main()
    except ReleaseError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
    except (KeyError, TypeError, ValueError):
        print('Respuesta inesperada; publicación no confirmada. No se muestran datos de API.', file=sys.stderr)
        sys.exit(1)
