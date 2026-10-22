"""Rebuild the existing static release from portal/dist and the maintained source."""
import base64
import gzip
import json
import pathlib
import re

root = pathlib.Path(__file__).resolve().parents[1]
release_file = root / 'portal-release.mjs'
text = release_file.read_text()
match = re.search(r"Buffer.from\('([A-Za-z0-9+/=]+)'", text)
if not match:
    raise RuntimeError('Existing release payload not found')
release = json.loads(gzip.decompress(base64.b64decode(match[1])))
for name in list(release):
    if name.startswith(('public/', 'source/')):
        del release[name]
for folder, prefix in [(root / 'portal/dist', 'public/'), (root / 'portal', 'source/')]:
    for path in folder.rglob('*'):
        if not path.is_file():
            continue
        rel = path.relative_to(folder)
        if any(p in ('node_modules', 'dist', 'repo') for p in rel.parts):
            continue
        if path.name.startswith('.env') and path.name not in ('.env.production', '.env.example'):
            continue
        if path.name == '.env.production':
            for line in path.read_text().splitlines():
                if line.strip() and not line.lstrip().startswith('#') and not line.startswith('VITE_'):
                    raise RuntimeError('Only public VITE_ settings may be bundled')
        release[prefix + str(rel)] = base64.b64encode(path.read_bytes()).decode()
encoded = base64.b64encode(gzip.compress(json.dumps(release).encode(), mtime=0)).decode()
release_file.write_text(text[:match.start(1)] + encoded + text[match.end(1):])
