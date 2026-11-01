import functools
import http.server
import importlib.util
from pathlib import Path
import threading
import unittest
import urllib.request
import urllib.error

spec = importlib.util.spec_from_file_location('mobile_preview', Path(__file__).resolve().parents[2] / 'scripts' / 'probar-movil.py')
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)

class MobilePreviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(preview.GameHandler, directory=str(preview.ROOT)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = 'http://127.0.0.1:' + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_game_and_head(self):
        with urllib.request.urlopen(self.origin + '/') as response:
            self.assertEqual(response.status, 200)
            self.assertIn('¿ESTO ES LEGAL?', response.read().decode())
        with urllib.request.urlopen(urllib.request.Request(self.origin + '/esto-es-legal/game.js', method='HEAD')) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.read(), b'')
            self.assertEqual(response.headers['X-Content-Type-Options'], 'nosniff')

    def test_editor_repository_and_directory_listing_are_not_served(self):
        for route in ['/game-editor/', '/game-editor/data/questions.json', '/.git/config', '/esto-es-legal/../../../game-editor/server.mjs', '/esto-es-legal/svg/']:
            with self.subTest(route=route):
                with self.assertRaises(urllib.error.HTTPError) as raised:
                    urllib.request.urlopen(self.origin + route)
                self.assertIn(raised.exception.code, [403, 404])
