# AGENTS.md

## Purpose
Fast context bootstrap for AI agents working in this repository.
Do not restate product decisions from memory; always read the source files listed below.

## Start Here (Order)
1. Read `CONTEXT.md` for product intent and boundaries.
2. Read `docs/architechture.md` for architecture and locked decisions.
3. Read `docs/permissions-matrix.md` for role/action rules.
4. Read `docs/data-model-v1.md` for entities, constraints, and integrity rules.
5. Read `docs/milestones-v1.md` for execution sequence.
6. Read `docs/email-templates-v1.md` for notification content.
7. Read `docs/decisions-v1.md` as index only.

## Source of Truth Policy
- Product/architecture decisions: `docs/architechture.md`
- Access control behavior: `docs/permissions-matrix.md`
- Data constraints: `docs/data-model-v1.md`
- Delivery phases: `docs/milestones-v1.md`

If documents appear inconsistent, align secondary docs to the source-of-truth files above.

## Working Rules for Agents
- Prefer updating existing docs over creating new overlapping docs.
- Keep changes scoped and traceable.
- When proposing behavior changes, update docs first, then code.
- For feature implementation, map work to the current milestone in `docs/milestones-v1.md`.

## Repo Status
- This repository currently contains planning/specification docs for V1.
- Application code bootstrap should follow the selected stack in `docs/architechture.md`.
