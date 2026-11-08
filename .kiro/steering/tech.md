# Tech Stack — Gaoshu Lab

## Runtime
- Python 3.10+ with SymPy for symbolic computation
- Node.js 22.12+ with Vite for the frontend build
- Vanilla JavaScript in `src/`, KaTeX for formula rendering,
  Lucide for icons, responsive CSS
- Docker: frontend build + Python runtime in one image

## Backend
- `server.py`: `ThreadingHTTPServer` on `127.0.0.1:8000` by default
  - `GET /api/health` returns `{"status": "ok", "engine": "SymPy"}`
  - `POST /api/calculate` accepts JSON up to 8 KB, max 4 parallel
    calculations, 12-second timeout per calculation
  - Serves only the built `dist/` directory; never exposes source,
    directories or dotfiles
  - Security headers: `X-Content-Type-Options: nosniff`,
    `Referrer-Policy: same-origin`, `X-Frame-Options: DENY`
  - Host / Origin check on POST; dev origin `http://127.0.0.1:5173`
    is allowed
  - 408 on timeout, 429 when all 4 slots are busy, 400 / 403 / 413
    for bad input, cross-site or oversize requests
- `engine.py`: AST-whitelist expression parser. User strings are
  never passed to `eval`, `sympify` or `parse_expr`.
  Symbols `x`, `y`, `z`, `t` (real). Constants `pi`, `e`, `E`, `oo`,
  also `π`, `∞`. Functions: `sin`, `cos`, `tan`, `asin`, `acos`,
  `atan`, `sinh`, `cosh`, `tanh`, `exp`, `log`, `ln`, `sqrt`, `abs`.
  Input is 1–240 characters, at most 120 AST nodes, finite numbers
  with absolute value at most `10^12`.
- `worker.py`: one calculation per isolated subprocess, so a bad
  calculation cannot take down the server.

## Frontend
- `index.html` + `src/` (vanilla JavaScript), `vite.config.js`,
  `package.json`. Dev server on `http://127.0.0.1:5173` proxies
  `/api` to port 8000.
- Plotting is a 601-point numeric sample; extreme values are clipped
  and not every singularity or fast oscillation is detected. Plots do
  not replace domain / convergence proofs.
- History is stored only in the browser `localStorage` (30 items,
  one-click clear). No third-party fonts or analytics requests.

## Tests and CI
- Python: `python -m unittest discover -s tests -v`
- Frontend: `npm run build`
- GitHub Actions runs the same checks on Linux and Windows.
- Test coverage includes basic calculus, improper integrals and
  singularities, one-sided limits, partial derivatives, matrices,
  domains, exact decimals, malicious-input rejection, parameter
  validation, process isolation and timeouts.

## Constraints
- Do not add a cloud math or AI API, a database, or an API key
  requirement. Keep the app runnable offline after build.
- Do not weaken the AST whitelist, the 12-second timeout, the
  4-slot limit or the 8 KB request limit without a spec change.
- Do not commit credentials, `.env` files or personal history.
- Keep `/.kiro` in the repository. Do not add it to `.gitignore`.
