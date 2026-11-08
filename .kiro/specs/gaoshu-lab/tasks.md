# Implementation Tasks — Gaoshu Lab (Kiroween 2026, Resurrection)

> Status: the app in this repository already implements the core
> workbench. These tasks record what was built with Kiro, what was
> verified, and what remains for the Kiroween submission.

## 1. Spec and steering
- [x] Add `.kiro/steering/product.md` — product, users, features,
  and what the app is not
- [x] Add `.kiro/steering/tech.md` — Python / SymPy + Node / Vite,
  API limits, tests and constraints
- [x] Add `.kiro/steering/structure.md` — repository layout and
  conventions
- [x] Add `.kiro/specs/gaoshu-lab/requirements.md` — EARS
  requirements for derivatives, integrals, limits, series,
  equations, matrices, plotting, safety and privacy
- [x] Add `.kiro/specs/gaoshu-lab/design.md` — frontend, HTTP
  layer, engine / worker architecture and testing strategy
- [x] Add `.kiro/specs/gaoshu-lab/tasks.md` — this checklist

## 2. Core calculation (already implemented, verify)
- [x] Implement AST-whitelist parsing in `engine.py` (no `eval` /
  `sympify` / `parse_expr`)
- [x] Implement derivatives (1–8 order, partials), integrals
  (indefinite / definite / improper), limits, Taylor series
  (1–12 order), equations (real domain) and matrices (≤ 5×5)
- [x] Implement plotting data (601-point sample) and KaTeX display

## 3. Local server and safety (already implemented, verify)
- [x] Implement `server.py`: `/api/health`, `/api/calculate`,
  8 KB limit, 4 parallel slots, 12-second timeout, localhost-only
  bind, security headers, Host / Origin check
- [x] Implement `worker.py`: one calculation per isolated process
- [x] Verify `python -m unittest discover -s tests -v` passes
- [x] Verify `npm run build` passes
- [x] Verify Docker build and run on `127.0.0.1:8000`

## 4. Kiroween submission
- [ ] Confirm the Resurrection framing in the Devpost submission:
  reviving the classic desktop symbolic-math workstation as
  Gaoshu Lab, a modern local web workbench
- [ ] Add a public running-app URL if deployed, or document the
  local run (`python server.py` → `http://127.0.0.1:8000`)
- [ ] Record a ≤ 3-minute demo video on public YouTube showing the
  app working, with the GitHub repo linked
- [ ] Confirm the repo is public, has an MIT license visible in
  About, and that `/.kiro` is at the root and not in `.gitignore`
- [ ] Submit on Devpost before 2026-12-04 14:00 PT with the
  Resurrection category, English description and Kiro usage notes
