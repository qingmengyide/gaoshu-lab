"""Local HTTP app with a separate, time-bounded worker per calculation."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import subprocess
import sys
import threading

ROOT = Path(__file__).resolve().parent
SLOTS = threading.BoundedSemaphore(4)


def run_calculation(data, timeout=12):
    try:
        completed = subprocess.run(
            [sys.executable, str(ROOT / 'worker.py')],
            input=json.dumps(data, ensure_ascii=False), capture_output=True,
            text=True, encoding='utf-8', timeout=timeout, cwd=ROOT,
            env={**os.environ, 'PYTHONIOENCODING': 'utf-8'},
        )
    except subprocess.TimeoutExpired:
        return 408, {'error': '计算超过时间限制（12 秒），请简化表达式后重试。'}
    if completed.returncode:
        return 500, {'error': '计算进程异常，请尝试更简单的表达式。'}
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError:
        return 500, {'error': '计算结果无法解析。'}
    return (400 if 'error' in result else 200), result


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'dist'), **kwargs)

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'same-origin')
        self.send_header('X-Frame-Options', 'DENY')
        super().end_headers()

    def respond(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/api/health':
            return self.respond(200, {'status': 'ok', 'engine': 'SymPy'})
        # Serve only built public assets; never expose source, directories or dotfiles.
        target = Path(self.translate_path(self.path)).resolve()
        public = (ROOT / 'dist').resolve()
        if not target.is_relative_to(public) or any(p.startswith('.') for p in target.relative_to(public).parts):
            return self.respond(404, {'error': '未找到资源。'})
        if target.is_dir() and not (target / 'index.html').is_file():
            return self.respond(404, {'error': '未找到资源。'})
        return super().do_GET()

    def do_POST(self):
        if self.path != '/api/calculate':
            return self.respond(404, {'error': '未找到接口。'})
        # Check host + origin to keep local services from being used cross-site.
        host = self.headers.get('Host', '')
        origin = self.headers.get('Origin')
        allowed = {f'http://{host}', f'https://{host}', 'http://127.0.0.1:5173', 'http://localhost:5173'}
        if origin and origin not in allowed:
            return self.respond(403, {'error': '不允许跨站请求。'})
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 8192:
                return self.respond(413, {'error': '请求过大或为空。'})
            data = json.loads(self.rfile.read(size))
        except (ValueError, UnicodeError):
            return self.respond(400, {'error': '需要有效的 JSON。'})
        if not SLOTS.acquire(blocking=False):
            return self.respond(429, {'error': '计算任务较多，请稍后再试。'})
        try:
            code, payload = run_calculation(data)
            self.respond(code, payload)
        finally:
            SLOTS.release()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Gaoshu Lab · 高数实验室')
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    print(f'Gaoshu Lab: http://{args.host}:{args.port}', flush=True)
    try:
        ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()
    except KeyboardInterrupt:
        pass
