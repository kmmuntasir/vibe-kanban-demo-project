---
trigger: model_decision
description: Ruleset that MUST be followed when executing ANY git command
---

# Git Guidelines

## Sacred Rule:
- NEVER run `git` command without explicit user approval.

## Merge Policy:
- **Rebase and Merge ONLY** — repo uses "Rebase and Merge" policy
- **No merge commits** — never use `git merge`
- **No squash merging** — never use `--squash` flag
- **No local branch merging** — all merging via PR rebase on GitHub

## Project Slug:
- PROJECTSLUG = shortened project name, used for abbreviations (e.g. JIRA tickets).
- PROJECTSLUG for this project: **VKD**
- Defined in `./project-metadata.md`.

## Branch Naming:
- Format: `type/PROJECTSLUG-TICKET_NUMBER-hyphenated-short-description`
- Example: `feature/VKD-123-add-review-timeout`, `bugfix/VKD-234-fix-clone-failure`
- Exception: Release branches = `release/1.2.3` — version only, no description or ticket number.
- Description: imperative, hyphenated style.
- No ticket number? Omit it. Never assume.
- Trello project? Use Card Number in place of Ticket number.

## Commit Messages:
- ALWAYS single line
- Format: `PROJECTSLUG-TICKET_NUMBER: message`
- Example: `VKD-123: Add review timeout handling`
- Extract ticket number from branch name.
- No identifiable ticket? Omit prefix, write message only.

## .gitignore
Ensure these entries exist. Never commit sensitive build artifacts:
- `node_modules/`
- `dist/`
- `*.log`
- `.env` (actual secrets, not `.env.example`)
- `/app/logs/`