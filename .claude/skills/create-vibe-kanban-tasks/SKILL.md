---
name: create-vibe-kanban-tasks
description: Create tasks in Vibe Kanban Board from a task plan file. Use when user wants to add tasks/issues to their Vibe Kanban dashboard from a markdown task breakdown file.
---

# Create Kanban Tasks Skill

Read task plan file. Create each task as Vibe Kanban issue. Preserve content, order, dependencies.

## Inputs

Need two things (explicit or implied by context):

1. **Task plan file path** — markdown with numbered tasks, descriptions, acceptance criteria, dependencies (e.g., `docs/task_plan/frontend-es-module-migration/frontend-esm-migration-plan-tasks.md`)
2. **Project name** — Vibe Kanban project target (e.g., "Nano Review")

If user says "create all these tasks in the todo column for the <project-name> project", extract project name from message. If file path unclear, ask.

## Execution Steps

Follow in order. No skip, no merge.

### Step 1: Read the task plan file

Read entire file with Read tool. MUST read full file — no truncate. If large, read in chunks.

### Step 2: Discover the Vibe Kanban project

Call MCP tools in sequence:

1. `list_organizations` — get org ID
2. `list_organizations` result → take first (or only) org's `id`
3. `list_projects` with `organization_id` set to that org ID
4. Find project matching user-specified name (case-insensitive)
5. Save `project_id` for subsequent calls

Project not found → stop, list available projects. No guess.

### Step 3: Parse all tasks from the file

Parse markdown. Extract every task. Typical structure:

```
### Task N: <title>
...description...
**Acceptance Criteria**
- [ ] item 1
- [ ] item 2
**Dependencies**: ...
```

Extract per task:
- **Task number** (from heading, e.g., "Task 5")
- **Title** (from heading)
- **Full description** — everything between title heading and Acceptance Criteria/Dependencies, including code blocks, tables, bullets
- **Acceptance criteria** — all checkbox items, full text preserved
- **Subtasks** — if present, all subtask items
- **Dependencies** — task numbers (e.g., "Tasks 2, 4, 5" or "None")

Store parsed tasks in ordered list. Count and report total before proceeding.

### Step 4: Create issues one at a time

For **each task** in order (Task 1, Task 2, Task 3, ...):

#### Build the description

Construct issue description as single markdown string:

````markdown
## Description

<full task description — include everything: paragraphs, tables, code blocks, lists, source references. Copy verbatim from the plan. Do NOT summarize or truncate.>

## Acceptance Criteria

- [ ] <criterion 1>
- [ ] <criterion 2>
...

## Dependencies

<dependency text from the plan, e.g., "Tasks 2, 4, 5" or "None">
````

If task has subtasks, add between Description and Acceptance Criteria:

````markdown
## Subtasks

- [ ] <subtask 1>
- [ ] <subtask 2>
...
````

#### Call create_issue

Use `create_issue` MCP tool:

| Parameter | Value |
|-----------|-------|
| `title` | **Required.** Format: `Task N: <title>` (e.g., `"Task 5: Extract js/stream-parser.js — JSONL stream parser"`) |
| `description` | **Required.** Full markdown description built above |
| `project_id` | **Required.** UUID from Step 2 |
| `priority` | Only set if plan explicitly mentions priority (e.g., "urgent", "high", "medium", "low"). Otherwise omit entirely — no null. |
| `parent_issue_id` | Only set if task explicitly marked as subtask of another. Otherwise omit. |

**Critical rules:**

- MUST pass `project_id`. Never omit.
- `title` MUST include task number prefix (e.g., "Task 1:", "Task 12:").
- `description` MUST contain full content. No summarize, abbreviate, truncate. Include all code blocks, tables, lists verbatim.
- Save returned `id` (issue UUID) for every created issue — need these for Step 5.

#### After each creation

Report: "Created Task N: <title>"

### Step 5: Link dependencies

After ALL issues created, iterate tasks again. Create dependency relationships.

For each task with dependencies (not "None"):

- Parse dependency task numbers (e.g., "Tasks 2, 4, 5" → [2, 4, 5])
- For each, call `create_issue_relationship` with:
  - `issue_id` — UUID of dependency task (the blocker)
  - `related_issue_id` — UUID of current task (the blocked)
  - `relationship_type` — `"blocking"`

"Task 2 blocks Task 8" → `issue_id` = Task 2's UUID, `related_issue_id` = Task 8's UUID.

Report: "Linked dependencies for Task N: blocked by Tasks X, Y, Z"

### Step 6: Set initial status

If user specified target column/status (e.g., "todo column"), update each issue's status.

Call `update_issue` per issue:
- `issue_id` — UUID
- `status` — status name (e.g., `"todo"`)

Status name must match project exactly. Unsure → create without status, inform user to move manually.

### Step 7: Final report

After all tasks created and dependencies linked:

```
Done. Created N tasks in project "<project-name>":
- Task 1: <title>
- Task 2: <title>
- ...
- Task N: <title>

Dependencies linked: X relationships
```

## Error Handling

- `create_issue` fails → report error, skip task, continue. Don't stop entire process.
- Dependency references failed task → skip that link, report it.
- Project not found → list available projects, stop.
- File unreadable → ask user verify path.

## Important Rules

1. **Never truncate** — descriptions must contain complete content. Most important rule.
2. **Never skip tasks** — create every task found, first to last.
3. **Never summarize** — copy descriptions, acceptance criteria, code blocks verbatim.
4. **Maintain order** — create in file order (Task 1, Task 2, ...).
5. **One at a time** — create each issue individually (no batching). Wait for each `create_issue` before next.
6. **Save UUIDs** — store every returned issue ID. Need all for dependency linking.
7. **Title format** — always prefix "Task N: " for easy board identification.