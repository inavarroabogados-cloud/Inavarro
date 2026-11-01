#!/usr/bin/env python3
"""Private-WiFi static game preview. Python 3.9+, standard library only."""
import argparse
import functools
import http.server
import ipaddress
import json
from pathlib import Path
import socket
import subprocess
import sys
import threading
import urllib.parse
import webbrowser

MOUNT = '/esto-es-legal/'
ROOT = Path(__file__).resolve().parents[1] / 'web' / 'esto-es-legal'

def lan_addresses():
    addresses = set()
    try:
        addresses.update(socket.gethostbyname_ex(socket.gethostname())[2])
    except OSError:
        pass
    # Read local interface addresses; never connect to external address discovery services.
    commands = [['ip', '-j', '-4', 'address', 'show']] if sys.platform.startswith('linux') else ([['ipconfig', 'getifaddr', 'en0'], ['ipconfig', 'getifaddr', 'en1']] if sys.platform == 'darwin' else [])
    for command in commands:
        try:
            output = subprocess.run(command, capture_output=True, text=True, timeout=3, check=False).stdout.strip()
            if command[0] == 'ip':
                for interface in json.loads(output or '[]'):
                    addresses.update(info['local'] for info in interface.get('addr_info', []) if info.get('family') == 'inet')
            else:
                addresses.add(output)
        except (OSError, ValueError, subprocess.TimeoutExpired):
            pass
    result = []
    for value in addresses:
        try:
            address = ipaddress.ip_address(value)
            if address.version == 4 and address.is_private and not address.is_loopback and not address.is_link_local:
                result.append(str(address))
        except ValueError:
            pass
    return sorted(result)

class GameHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass  # Do not log visitors, query strings or request contents.

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        super().end_headers()

    def do_GET(self):
        request_path = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        if request_path in ('/', '/esto-es-legal'):
            self.send_response(302)
            self.send_header('Location', MOUNT)
            self.end_headers()
            return
        if not request_path.startswith(MOUNT):
            self.send_error(404, 'Esta revision solo sirve el videojuego.')
            return
        relative = request_path[len(MOUNT):]
        target = (ROOT / relative).resolve()
        try:
            target.relative_to(ROOT.resolve())
        except ValueError:
            self.send_error(403)
            return
        if target.is_dir():
            target = target / 'index.html'
        if not target.is_file():
            self.send_error(404)
            return
        self.path = '/' + urllib.parse.quote(str(target.relative_to(ROOT)), safe='/')
        super().do_GET()

    def do_HEAD(self):
        # Reuse routing while suppressing the response body in copyfile.
        self.do_GET()

    def copyfile(self, source, outputfile):
        if self.command != 'HEAD':
            super().copyfile(source, outputfile)

    def list_directory(self, _):
        self.send_error(404)
        return None

def main():
    parser = argparse.ArgumentParser(description='Prueba del juego desde un movil en la misma Wi-Fi. No publica en Internet.')
    parser.add_argument('--port', type=int, default=3201)
    parser.add_argument('--local-only', action='store_true')
    parser.add_argument('--no-open', action='store_true')
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error('El puerto debe estar entre 1024 y 65535.')
    if not (ROOT / 'index.html').is_file():
        parser.error('No se encuentra el juego. Conserva scripts/ junto a web/.')
    handler = functools.partial(GameHandler, directory=str(ROOT))
    try:
        server = http.server.ThreadingHTTPServer(('127.0.0.1' if args.local_only else '0.0.0.0', args.port), handler)
    except OSError:
        parser.error('No se pudo abrir el puerto. Cierra otra vista previa o usa --port 3202.')
    local = f'http://127.0.0.1:{args.port}{MOUNT}'
    print('\n¿ESTO ES LEGAL? — PRUEBA MOVIL\n', flush=True)
    print('En este ordenador: ' + local, flush=True)
    if not args.local_only:
        addresses = lan_addresses()
        if addresses:
            print('\nEn el movil, conectado a la MISMA Wi-Fi, abre una direccion:', flush=True)
            for address in addresses:
                print(f'  http://{address}:{args.port}{MOUNT}', flush=True)
        else:
            print('\nNo se encontro una IP local. Consulta la IPv4 Wi-Fi de este ordenador y abre:', flush=True)
            print(f'  http://IP-DEL-ORDENADOR:{args.port}{MOUNT}', flush=True)
    print('\nNo es un enlace publico ni funciona desde otra red. No abras puertos del router.', flush=True)
    print('Si el cortafuegos pregunta, permite solo tu red privada.', flush=True)
    print('Solo se sirve el juego: el editor, expedientes y repositorio no son accesibles.', flush=True)
    print('Musica: actívala dentro del juego. Compartir puede estar limitado por HTTP.', flush=True)
    print('Para cerrar: Ctrl+C o cerrar esta ventana.\n', flush=True)
    if not args.no_open:
        threading.Timer(.4, lambda: webbrowser.open(local)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nRevision cerrada.', flush=True)
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
