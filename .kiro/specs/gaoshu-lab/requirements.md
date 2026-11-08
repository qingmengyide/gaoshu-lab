# Requirements — Gaoshu Lab (Kiroween 2026, Resurrection)

## Introduction
Gaoshu Lab revives the classic desktop symbolic-math workstation as a
modern, local, open-source Chinese advanced-math workbench. A student
types a Chinese-friendly math expression and gets an exact symbolic
result, the steps that produced it, and an interactive plot — without
an account, an API key or a cloud service.

## Glossary
- **Expression**: a user-typed math string, 1–240 characters, using
  variables `x`, `y`, `z`, `t`, constants `pi`, `e`, `oo` and the
  whitelisted functions in `engine.py`.
- **Exact result**: a SymPy symbolic result, not a decimal approximation.
- **Plot**: a 601-point numeric sample of a real curve, with hover,
  zoom and SVG export.

## Requirements

### Requirement 1 — Derivatives
**User Story:** As a student, I want derivatives and partial
derivatives, so I can check calculus homework exactly.

#### Acceptance Criteria
1. WHEN a user enters `sin(x*y)` and asks for the derivative with
   respect to `y`, THE SYSTEM SHALL return the exact symbolic result.
2. WHEN a user asks for an order from 1 to 8, THE SYSTEM SHALL compute
   that order, and WHEN the order is outside 1–8, THE SYSTEM SHALL
   reject it with an actionable message.

### Requirement 2 — Integrals
**User Story:** As a student, I want indefinite, definite and improper
integrals, so I can verify integration work.

#### Acceptance Criteria
1. WHEN a user enters `sin(x)` from `0` to `pi`, THE SYSTEM SHALL
   return the exact definite integral.
2. WHEN a definite integral has a singularity inside the interval,
   THE SYSTEM SHALL refuse direct computation and ask the user to
   split it into one-sided improper integrals, and SHALL NOT treat a
   Cauchy principal value as an ordinary definite integral.
3. WHEN SymPy has no closed form, THE SYSTEM SHALL keep the integral
   in symbolic form and SHALL NOT invent an answer.

### Requirement 3 — Limits and series
**User Story:** As a student, I want limits and Taylor series, so I
can check convergence and approximation work.

#### Acceptance Criteria
1. WHEN a user enters `sin(x)/x` with `x → 0`, THE SYSTEM SHALL
   return the exact two-sided limit, and SHALL support left, right
   and at-infinity limits.
2. WHEN a user asks for a Taylor expansion of `exp(x)` at `0`,
   THE SYSTEM SHALL expand to the requested 1–12 order truncation.

### Requirement 4 — Equations and matrices
**User Story:** As a student, I want equation and matrix tools, so I
can check algebra and linear-algebra work in one place.

#### Acceptance Criteria
1. WHEN a user enters `x^3-6*x^2+11*x-6 = 0`, THE SYSTEM SHALL
   return the real-domain symbolic solution set.
2. WHEN a user enters a matrix up to 5×5 such as `1,2;3,4`,
   THE SYSTEM SHALL return its determinant, inverse, reduced row
   echelon form and rank.

### Requirement 5 — Plotting and display
**User Story:** As a student, I want to see a function, so I can
understand a result visually.

#### Acceptance Criteria
1. WHEN a calculation has a plottable result such as `exp(-x^2)`,
   THE SYSTEM SHALL show a real curve with derivative / series
   overlay, hover coordinates, zoom and SVG export.
2. WHEN a formula is displayed, THE SYSTEM SHALL render it with
   KaTeX and SHALL allow copying the result and its LaTeX form.

### Requirement 6 — Input safety
**User Story:** As a user, I want malicious input rejected, so the
local service cannot be abused through the input box.

#### Acceptance Criteria
1. WHEN a user submits a string, THE SYSTEM SHALL parse it with an
   AST whitelist and SHALL NEVER pass it to `eval`, `sympify` or
   `parse_expr`.
2. WHEN input exceeds 240 characters, 120 AST nodes, or a finite
   number exceeds `10^12` in absolute value, THE SYSTEM SHALL
   reject it with an actionable message.
3. WHEN a calculation exceeds 12 seconds, THE SYSTEM SHALL stop it
   and return a timeout message, and WHEN more than 4 calculations
   run at once, THE SYSTEM SHALL return a busy message.

### Requirement 7 — Local and private by default
**User Story:** As a user, I want my work to stay on my machine,
so I can use the tool without an account or network service.

#### Acceptance Criteria
1. WHEN the app runs, THE SYSTEM SHALL NOT require an API key, an
   AI service or a database, and SHALL bind only to localhost
   by default (`127.0.0.1:8000`).
2. WHEN history is saved, THE SYSTEM SHALL store at most 30 items
   only in browser `localStorage`, with one-click clear, and
   SHALL make no third-party font or analytics requests.
