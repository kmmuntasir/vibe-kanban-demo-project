---
name: breakdown-plan-into-tasks
description: Break down a large implementation plan into small, parallelizable tasks for individual developers. Use when user requests to break down a plan into tasks.
---

# Task Breakdown Skill

Read plan file. Follow two-phase process.

## Phase 1: Codebase Analysis

Before breaking down tasks, **analyze codebase** to build accurate understanding. Prevents tasks referencing nonexistent files, wrong abstractions, or outdated patterns.

- **Verify every file path/module** — confirm exist or note need creation
- **Map current architecture** — understand existing patterns, conventions, interfaces
- **Identify hidden coupling** — shared types, utilities, config plan doesn't call out
- **Check for prior art** — existing implementations partially covering plan (partial refactor, abandoned branch, utility already written)

Use up to **3 parallel subagents** (Agent tool). Example split:

| Subagent | Responsibility |
|----------|---------------|
| Subagent 1 | Verify file/module existence, map directory structure, check build/config files |
| Subagent 2 | Trace data flow and interfaces the plan references — read relevant source files |
| Subagent 3 | Search for prior art, existing utilities, and hidden coupling across the codebase |

Each subagent returns concise summary. Use summaries — not raw exploration — to inform breakdown.

## Phase 2: Task Breakdown

Using plan + codebase analysis, break work into small, self-contained tasks developers can pick up independently.

Use up to **3 parallel subagents** to draft task batches concurrently:

| Subagent | Responsibility |
|----------|---------------|
| Subagent 1 | Draft Batch 1 tasks (no dependencies) |
| Subagent 2 | Draft Batch 2 tasks (depends on Batch 1) |
| Subagent 3 | Draft Batch 3+ tasks and the visual dependency diagram |

Merge subagent outputs into final document, resolve conflicts/gaps.

## Output

Write results in new file alongside plan, named `{plan-filename}-tasks.md`.

## Task Format

Each task must include:

- **Title** — concise, action-oriented (e.g., "Extract WebSocket manager into ES module")
- **Description** — detailed enough for developer unfamiliar with plan to execute. Include source references (file paths, line numbers, function names, codeblocks), what to create/modify, relevant context
- **Acceptance Criteria** — specific, verifiable checklist items
- **Subtasks** — only if task complex enough to warrant them
- **Dependencies** — exact task numbers this depends on, or "None"

## Parallelization Strategy

Include batch-based execution model at top of document:

1. **Organize tasks into batches** based on dependency order — all tasks within batch run in parallel, zero merge conflicts
2. **Include visual batch diagram** showing dependency flow
3. **State merge order rules** — which batches must merge before others start
4. **Provide summary table** — columns: `#`, Batch, Target File, Dependencies, Can Parallel With
5. **Suggest developer assignment tracks** — 2–3 developer paths through batches

## Key Principles

- **One task = few files (tightly coupled set)** — minimize merge conflict surface
- **Dependencies explicit** — every dependency listed by task number
