# Project Structure — Gaoshu Lab

## Repository layout
```
.
├── .kiro/
│   ├── steering/                  # Product, tech and structure (this file)
│   └── specs/gaoshu-lab/          # Requirements, design, tasks
├── .github/workflows/             # CI on Linux and Windows
├── docs/                          # Docs and preview image
├── public/                        # Static public assets
├── src/                           # Vanilla JavaScript, KaTeX, Lucide, CSS
├── tests/                         # Python calculation and security tests
├── .dockerignore
├── .gitignore                     # node_modules, dist, .venv, __pycache__, .env
├── Dockerfile                     # Frontend build + Python runtime
├── LICENSE                        # MIT
├── README.md
├── engine.py                      # AST-whitelist parser + SymPy computation
├── index.html                     # Frontend entry
├── package.json / package-lock.json
├── requirements.txt
├── server.py                      # HTTP app, /api/health, /api/calculate
├── vite.config.js
└── worker.py                      # Single-calculation isolated process
```

## Conventions
- Backend code is Python in the repository root: `engine.py`,
  `server.py`, `worker.py`. Keep calculation logic in `engine.py`,
  transport and limits in `server.py`, isolation in `worker.py`.
- Frontend code is vanilla JavaScript in `src/`; do not introduce
  a frontend framework without a spec change.
- Tests live in `tests/` and must cover any new calculation path,
  including its failure modes (singularities, bad input, timeouts).
- User-facing text is Chinese first, with math in KaTeX. Error
  messages must be actionable: say what to simplify or split.
- Input rules: multiplication must be explicit (`*`), power is
  `^` or `**`. Variables are `x`, `y`, `z`, `t`. Matrices use
  commas for columns and semicolons for rows, e.g. `1,2;3,4`.
- Do not expose source, directories or dotfiles from the server.
  Serve only the built `dist/` directory.
