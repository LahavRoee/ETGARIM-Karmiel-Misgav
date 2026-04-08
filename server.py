#!/usr/bin/env python3
"""Etgarim Karmiel-Misgav — Web server with public + admin APIs."""

import json
import os
import hashlib
import secrets
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from datetime import datetime
from urllib.parse import urlparse, parse_qs

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINEE_FILE = os.path.join(DATA_DIR, 'trainee_data.json')
STORIES_FILE = os.path.join(DATA_DIR, 'stories.json')
SIGNUPS_FILE = os.path.join(DATA_DIR, 'signups.json')
VOLUNTEERS_FILE = os.path.join(DATA_DIR, 'volunteers.json')
ASSIGNMENTS_FILE = os.path.join(DATA_DIR, 'assignments.json')

# Admin password hash (SHA-256 of "etgarim2025" — change on first deploy!)
ADMIN_PASSWORD_HASH = '180e7e16333f7904f7dc60367929e9e94cbab98a3fee260fd022d4c29c7aed80'
# Active sessions: token -> expiry timestamp
SESSIONS = {}

def _load(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return [] if filepath != TRAINEE_FILE else {}

def _save(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def _json_response(handler, data, status=200):
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Access-Control-Allow-Origin', '*')
    handler.end_headers()
    handler.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

def _read_body(handler):
    length = int(handler.headers.get('Content-Length', 0))
    return json.loads(handler.rfile.read(length).decode('utf-8')) if length > 0 else {}

def _check_auth(handler):
    """Check if request has valid admin session token."""
    auth = handler.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth[7:]
        if token in SESSIONS and SESSIONS[token] > time.time():
            return True
    return False

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # ── Public APIs ──
        if path == '/api/stories':
            stories = _load(STORIES_FILE)
            # Only return visible stories for public
            public_stories = [s for s in stories if s.get('visible', True)]
            _json_response(self, public_stories)

        # ── Admin APIs (require auth) ──
        elif path == '/api/trainees':
            if not _check_auth(self): return _json_response(self, {'error': 'unauthorized'}, 401)
            _json_response(self, _load(TRAINEE_FILE))

        elif path == '/api/volunteers':
            if not _check_auth(self): return _json_response(self, {'error': 'unauthorized'}, 401)
            _json_response(self, _load(VOLUNTEERS_FILE))

        elif path == '/api/signups':
            if not _check_auth(self): return _json_response(self, {'error': 'unauthorized'}, 401)
            _json_response(self, _load(SIGNUPS_FILE))

        elif path == '/api/assignments':
            if not _check_auth(self): return _json_response(self, {'error': 'unauthorized'}, 401)
            _json_response(self, _load(ASSIGNMENTS_FILE))

        elif path == '/api/admin/stories':
            if not _check_auth(self): return _json_response(self, {'error': 'unauthorized'}, 401)
            _json_response(self, _load(STORIES_FILE))

        elif path == '/api/auth/check':
            _json_response(self, {'authenticated': _check_auth(self)})

        else:
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # ── Public APIs ──
        if path == '/api/volunteer-signup':
            body = _read_body(self)
            name = body.get('name', '').strip()
            phone = body.get('phone', '').strip()
            if not name or not phone:
                return _json_response(self, {'error': 'name and phone required'}, 400)

            signups = _load(SIGNUPS_FILE)
            if not isinstance(signups, list):
                signups = []
            body['id'] = secrets.token_hex(4)
            body['date'] = datetime.now().isoformat()
            body['status'] = 'new'
            signups.append(body)
            _save(SIGNUPS_FILE, signups)
            _json_response(self, {'ok': True, 'message': 'signup saved'})

        # ── Auth ──
        elif path == '/api/auth/login':
            body = _read_body(self)
            pw = body.get('password', '')
            pw_hash = hashlib.sha256(pw.encode()).hexdigest()
            if pw_hash == ADMIN_PASSWORD_HASH:
                token = secrets.token_hex(32)
                SESSIONS[token] = time.time() + 86400 * 7  # 7 day session
                _json_response(self, {'ok': True, 'token': token})
            else:
                _json_response(self, {'error': 'wrong password'}, 401)

        elif path == '/api/auth/logout':
            auth = self.headers.get('Authorization', '')
            if auth.startswith('Bearer '):
                SESSIONS.pop(auth[7:], None)
            _json_response(self, {'ok': True})

        # ── Admin APIs (require auth) ──
        elif path == '/api/trainee':
            if not _check_auth(self): return _json_response(self, {'error': 'unauthorized'}, 401)
            body = _read_body(self)
            name = body.get('name')
            if not name:
                return _json_response(self, {'error': 'name required'}, 400)

            data = _load(TRAINEE_FILE)
            if not isinstance(data, dict):
                data = {}
            if name not in data:
                data[name] = {}
            data[name].update(body.get('fields', {}))
            data[name]['lastUpdated'] = datetime.now().isoformat()
            _save(TRAINEE_FILE, data)
            _json_response(self, {'ok': True})

        elif path == '/api/volunteer':
            if not _check_auth(self): return _json_response(self, {'error': 'unauthorized'}, 401)
            body = _read_body(self)
            volunteers = _load(VOLUNTEERS_FILE)
            if not isinstance(volunteers, list):
                volunteers = []

            # Update existing or add new
            vol_id = body.get('id')
            if vol_id:
                for i, v in enumerate(volunteers):
                    if v.get('id') == vol_id:
                        volunteers[i].update(body)
                        volunteers[i]['lastUpdated'] = datetime.now().isoformat()
                        break
            else:
                body['id'] = secrets.token_hex(4)
                body['created'] = datetime.now().isoformat()
                volunteers.append(body)

            _save(VOLUNTEERS_FILE, volunteers)
            _json_response(self, {'ok': True})

        elif path == '/api/story':
            if not _check_auth(self): return _json_response(self, {'error': 'unauthorized'}, 401)
            body = _read_body(self)
            stories = _load(STORIES_FILE)
            if not isinstance(stories, list):
                stories = []

            story_id = body.get('id')
            if story_id:
                for i, s in enumerate(stories):
                    if s.get('id') == story_id:
                        stories[i].update(body)
                        stories[i]['lastUpdated'] = datetime.now().isoformat()
                        break
            else:
                body['id'] = secrets.token_hex(4)
                body['created'] = datetime.now().isoformat()
                body['visible'] = body.get('visible', True)
                stories.insert(0, body)  # newest first

            _save(STORIES_FILE, stories)
            _json_response(self, {'ok': True})

        elif path == '/api/story/delete':
            if not _check_auth(self): return _json_response(self, {'error': 'unauthorized'}, 401)
            body = _read_body(self)
            story_id = body.get('id')
            stories = _load(STORIES_FILE)
            stories = [s for s in stories if s.get('id') != story_id]
            _save(STORIES_FILE, stories)
            _json_response(self, {'ok': True})

        elif path == '/api/assignment':
            if not _check_auth(self): return _json_response(self, {'error': 'unauthorized'}, 401)
            body = _read_body(self)
            assignments = _load(ASSIGNMENTS_FILE)
            if not isinstance(assignments, list):
                assignments = []
            body['id'] = secrets.token_hex(4)
            body['created'] = datetime.now().isoformat()
            assignments.insert(0, body)
            _save(ASSIGNMENTS_FILE, assignments)
            _json_response(self, {'ok': True})

        elif path == '/api/training-log':
            if not _check_auth(self): return _json_response(self, {'error': 'unauthorized'}, 401)
            body = _read_body(self)
            name = body.get('name')
            if not name:
                return _json_response(self, {'error': 'name required'}, 400)

            data = _load(TRAINEE_FILE)
            if not isinstance(data, dict):
                data = {}
            if name not in data:
                data[name] = {}
            if 'log' not in data[name]:
                data[name]['log'] = []
            entry = body.get('fields', body)
            entry['date'] = entry.get('date', datetime.now().strftime('%Y-%m-%d'))
            data[name]['log'].append(entry)
            data[name]['lastUpdated'] = datetime.now().isoformat()
            _save(TRAINEE_FILE, data)
            _json_response(self, {'ok': True})

        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def log_message(self, format, *args):
        # Cleaner logging
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]}")

if __name__ == '__main__':
    os.chdir(DATA_DIR)
    port = int(os.environ.get('PORT', 8080))
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f'Etgarim web server running on http://0.0.0.0:{port}')
    server.serve_forever()
