# Product Overview — Gaoshu Lab (高数实验室)

## What it is
Gaoshu Lab is a free, open-source Chinese advanced-mathematics workbench.
It revives the classic desktop symbolic-math workstation — the kind of
single-purpose calculator students used to keep beside a textbook — as a
modern local web app: real symbolic computation plus interactive function
plots, with every step shown.

Kiroween 2026 category: **Resurrection**. The dead technology being
revived is the offline symbolic calculator / graphing workstation,
reimagined with today's web UI, local SymPy computation and Kiro
spec-driven development.

## Who it is for
Chinese university students learning advanced mathematics (calculus,
linear algebra), and anyone who wants an exact symbolic answer instead
of a decimal approximation.

## Core features
- Derivatives and partial derivatives, 1st–8th order
- Indefinite, definite and improper integrals
- Limits: two-sided, left, right and at infinity
- Taylor series, 1–12 order truncation at a chosen point
- Equations: real-domain symbolic solution sets
- Matrices up to 5×5: determinant, inverse, reduced row echelon form, rank
- Exact simplification, e.g. `sin(x)^2+cos(x)^2`
- Plotting: real curves, derivative / series overlay, hover coordinates,
  zoom, SVG export
- KaTeX formula rendering, step and intermediate-result display,
  result / LaTeX copy, worked examples, math keyboard,
  `Ctrl/⌘ + Enter` to calculate, 30-item local history, mobile layout

## What it is not
- Not a tutoring app and not a full proof generator: step display shows
  computation and intermediate results, not complete teaching derivations.
- Not a cloud service: no API key, no AI service and no database are
  required. Computation runs locally.
- Not a production public endpoint by default: the Python server binds
  only localhost. Public deployment needs a proper web server, reverse
  proxy, TLS, auth, rate limiting and container limits.

## Success criteria
- Every listed tool returns an exact symbolic result, or honestly keeps
  an integral / conditional solution in symbolic form when SymPy has
  no closed form — never invents an answer.
- A first-time user can go from `git clone` to a working page at
  `http://127.0.0.1:8000` with only `pip install`, `npm ci`,
  `npm run build` and `python server.py`.
- All checks pass: `python -m unittest discover -s tests -v` and
  `npm run build`, on Linux and Windows in CI.
