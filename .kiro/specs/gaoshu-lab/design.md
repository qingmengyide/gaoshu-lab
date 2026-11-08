# Design — Gaoshu Lab

## Overview
A local two-part app: a Vite-built vanilla-JavaScript frontend served
from `dist/`, and a Python `ThreadingHTTPServer` that runs each
calculation in an isolated subprocess. No cloud service is involved.

## Architecture
```
Browser (Vite / vanilla JS, KaTeX)
  │  POST /api/calculate (JSON ≤ 8 KB)
  │  GET  /api/health
  ▼
server.py (127.0.0.1:8000, max 4 parallel, 12 s timeout)
  │  subprocess: python worker.py
  ▼
worker.py → engine.py (AST whitelist → SymPy)
```

## Components

### Frontend (`src/`, `index.html`, `vite.config.js`)
- Vanilla JavaScript, KaTeX rendering, Lucide icons, responsive CSS.
- Math keyboard, worked examples, `Ctrl/⌘ + Enter` to calculate,
  30-item `localStorage` history, mobile layout.
- Dev server on `http://127.0.0.1:5173` proxies `/api` to port 8000.
- Plotting is a 601-point numeric sample; extreme values are
  clipped and singularities are not guaranteed to be detected.

### HTTP layer (`server.py`)
- `GET /api/health` → `{"status": "ok", "engine": "SymPy"}`.
- `POST /api/calculate` → JSON result or an error object.
  Status codes: 200 ok, 400 bad input, 403 cross-site, 408 timeout,
  413 oversize / empty, 429 busy, 500 worker failure.
- Serves only built files under `dist/`; never exposes source,
  directories or dotfiles. Security headers: `nosniff`,
  `same-origin`, `X-Frame-Options: DENY`.
- Host / Origin check on POST; `http://127.0.0.1:5173` is allowed
  for development.

### Calculation engine (`engine.py`, `worker.py`)
- `engine.py` parses with an AST whitelist: symbols `x`, `y`, `z`,
  `t` (real); constants `pi`, `e`, `E`, `oo`; functions `sin`,
  `cos`, `tan`, `asin`, `acos`, `atan`, `sinh`, `cosh`, `tanh`,
  `exp`, `log`, `ln`, `sqrt`, `abs`. No `eval` / `sympify` /
  `parse_expr` on user strings.
- `worker.py` runs one calculation per subprocess, so a timeout or
  crash is isolated from the server.

## Data model
- Request: `{tool, expression, ...tool options}` as JSON, ≤ 8 KB.
- Response: `{result, steps, latex, plot}` on success, or
  `{error}` with an actionable Chinese message on failure.
- No persistent server-side storage. History lives only in the
  browser.

## Testing strategy
- `python -m unittest discover -s tests -v`: calculus, improper
  integrals and singularities, one-sided limits, partial
  derivatives, matrices, domains, exact decimals, malicious-input
  rejection, parameter validation, process isolation, timeouts.
- `npm run build`: frontend build must succeed.
- GitHub Actions runs the same checks on Linux and Windows.
- Docker: `docker build -t gaoshu-lab .` then
  `docker run --rm -p 127.0.0.1:8000:8000 gaoshu-lab`.
