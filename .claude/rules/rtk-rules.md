No file path — text pasted inline. Compressing directly per rules.

---

# RTK (Rust Token Killer) Rules

## Golden Rule
**ALWAYS prefix terminal commands with `rtk`** via `run_command` or similar tools.

RTK intercepts dev commands, compresses output. Save tokens, improve context relevance.

## Recommended Commands

### Git Operations
- `rtk git status`
- `rtk git diff`
- `rtk git log`
- `rtk git add`
- `rtk git commit`

### Node.js & npm
- `rtk npm test`
- `rtk npm run lint`
- `rtk npm run build`
- `rtk npx <tool>`
- `rtk node <script>`

### Tooling
- `rtk gh pr list`
- `rtk gh pr create`

## Benefits
- **Token Efficiency**: 60-90% output token reduction.
- **Speed**: Faster context processing.
- **Clarity**: Filters noise + ASCII art.

---
*Unsupported commands pass through unchanged. `rtk` prefix always safe.*