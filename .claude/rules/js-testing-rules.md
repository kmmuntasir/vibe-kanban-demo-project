# JavaScript/Node.js Testing Rules

## Overview

Use Jest or Vitest as the test framework for this project. Both provide built-in assertion libraries, mocking, and coverage reporting. Vitest is preferred for ESM projects; Jest is preferred for CommonJS projects. Be consistent — pick one and use it throughout.

## Test Organization

```
src/
    routes/
        kanban.js
        kanban.test.js        # Co-located with source
    middleware/
        auth.js
        auth.test.js
    services/
        boardService.js
        boardService.test.js
    db/
        database.js
        database.test.js
```

Tests live alongside the code they test, in `*.test.js` or `*.spec.js` files within the same directory.

## Unit Tests

### Describe/It Structure

The preferred pattern for organizing tests:

```js
describe('validateBoardPayload', () => {
    it('returns null for valid payload', () => {
        const result = validateBoardPayload({ title: 'Sprint Board', columns: ['To Do', 'In Progress', 'Done'] });
        expect(result).toBeNull();
    });

    it('returns error when title is missing', () => {
        const result = validateBoardPayload({ columns: ['To Do'] });
        expect(result).toBeDefined();
        expect(result.message).toContain('title');
    });

    it('returns error when columns array is empty', () => {
        const result = validateBoardPayload({ title: 'Board', columns: [] });
        expect(result).toBeDefined();
        expect(result.message).toContain('columns');
    });
});
```

### Setup and Teardown

Use `beforeEach`, `afterEach`, `beforeAll`, `afterAll` for common setup:

```js
describe('BoardService', () => {
    let db;
    let service;

    beforeEach(async () => {
        db = await createTestDatabase(':memory:');
        await runMigrations(db);
        service = new BoardService(db);
    });

    afterEach(async () => {
        await db.close();
    });

    it('creates a board with default columns', async () => {
        const board = await service.createBoard({ title: 'Sprint 1' });
        expect(board.id).toBeDefined();
        expect(board.title).toBe('Sprint 1');
    });
});
```

### AAA Pattern (Arrange-Act-Assert)

Structure each test with clear phases:

```js
it('moves a card to a different column', async () => {
    // Arrange
    const board = await service.createBoard({ title: 'Test Board' });
    const card = await service.addCard(board.id, { title: 'New Task', columnId: 'todo' });

    // Act
    const result = await service.moveCard(board.id, card.id, 'in-progress');

    // Assert
    expect(result.columnId).toBe('in-progress');
});
```

## HTTP Handler Testing

Use `supertest` with the Express app for handler tests:

```js
const request = require('supertest');
const app = require('../../src/app'); // Import the Express app, not the server

describe('POST /api/boards', () => {
    it('creates a new board and returns 201', async () => {
        const response = await request(app)
            .post('/api/boards')
            .send({ title: 'Sprint Board' })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(response.body.id).toBeDefined();
        expect(response.body.title).toBe('Sprint Board');
    });

    it('returns 400 when title is missing', async () => {
        const response = await request(app)
            .post('/api/boards')
            .send({})

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
    });

    it('returns 401 when not authenticated', async () => {
        const response = await request(app)
            .post('/api/boards')
            .send({ title: 'Board' });

        expect(response.status).toBe(401);
    });
});
```

**Important**: Import the Express `app` instance, not the HTTP server. The app should be created in a separate module from `server.listen()` so tests can use `supertest` to manage the server lifecycle.

## Database Testing

Use SQLite in-memory databases for test isolation — each test or test suite gets a fresh database:

```js
const Database = require('better-sqlite3');

describe('CardRepository', () => {
    let db;

    beforeEach(() => {
        db = new Database(':memory:');
        db.exec(`
            CREATE TABLE cards (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                column_id TEXT NOT NULL,
                position INTEGER NOT NULL DEFAULT 0
            )
        `);
    });

    afterEach(() => {
        db.close();
    });

    it('inserts a card and returns it', () => {
        const repo = new CardRepository(db);
        const card = repo.insert({ id: 'c1', title: 'Task', columnId: 'todo', position: 0 });

        expect(card.id).toBe('c1');
        expect(card.title).toBe('Task');

        const row = db.prepare('SELECT * FROM cards WHERE id = ?').get('c1');
        expect(row).toBeDefined();
        expect(row.title).toBe('Task');
    });
});
```

For async SQLite drivers (e.g., `better-sqlite3` wrapped in promises):

```js
beforeEach(async () => {
    db = await openDatabase(':memory:');
    await runMigrations(db);
});

afterEach(async () => {
    await db.close();
});
```

## Mocking

### jest.mock / vi.mock

Mock entire modules at the top of the test file:

```js
// Jest
jest.mock('../services/boardService', () => ({
    createBoard: jest.fn(),
    getBoard: jest.fn(),
}));

const { createBoard, getBoard } = require('../services/boardService');

it('returns created board', async () => {
    createBoard.mockResolvedValue({ id: '1', title: 'Board' });

    const result = await createBoard({ title: 'Board' });
    expect(result.title).toBe('Board');
    expect(createBoard).toHaveBeenCalledWith({ title: 'Board' });
});
```

### Manual Mocks

For simple cases, create mock objects directly:

```js
// In tests
const mockDb = {
    prepare: jest.fn().mockReturnThis(),
    run: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
    get: jest.fn().mockReturnValue({ id: '1', title: 'Board' }),
    all: jest.fn().mockReturnValue([{ id: '1', title: 'Board' }]),
};
```

### Spying on Existing Functions

```js
// Jest
const logger = require('../utils/logger');
jest.spyOn(logger, 'info');

it('logs when a board is created', () => {
    createBoard({ title: 'Test' });
    expect(logger.info).toHaveBeenCalledWith('Board created', expect.objectContaining({
        title: 'Test',
    }));
});
```

## Running Tests

```bash
# All tests
npm test

# Specific test file
npx jest src/routes/kanban.test.js

# Watch mode
npm test -- --watch

# Verbose output
npm test -- --verbose

# Coverage report
npm test -- --coverage

# Coverage with HTML report
npm test -- --coverage --coverageReporters html
```

For Vitest:

```bash
# All tests
npx vitest

# Specific file
npx vitest run src/routes/kanban.test.js

# Coverage
npx vitest run --coverage
```

## Best Practices

### Test Naming

- `describe` blocks: the function, module, or feature being tested (e.g., `'validateBoardPayload'`, `'POST /api/boards'`).
- `it` blocks: describe expected behavior in plain language (e.g., `'returns 400 when title is missing'`, `'creates a board with default columns'`).

### Test Behavior, Not Implementation

```js
// Good — tests the observable behavior
it('returns boards sorted by creation date', async () => {
    const boards = await service.getAllBoards();
    expect(boards).toHaveLength(2);
    expect(boards[0].createdAt).toBeLessThan(boards[1].createdAt);
});

// Bad — tests internal implementation details
it('calls db.prepare with the correct SQL', () => {
    // Don't test which SQL string is used — test that the result is correct
});
```

### Helpers

Extract common setup into shared test utilities:

```js
// test/helpers/setup.js
const Database = require('better-sqlite3');

function createTestDb() {
    const db = new Database(':memory:');
    db.exec(getSchemaSQL());
    return db;
}

module.exports = { createTestDb };
```

### Error Case Coverage

Always test error paths alongside happy paths:

```js
describe('deleteBoard', () => {
    it('deletes an existing board', async () => {
        await service.createBoard({ id: 'b1', title: 'Board' });
        await expect(service.deleteBoard('b1')).resolves.not.toThrow();
        await expect(service.getBoard('b1')).rejects.toThrow('not found');
    });

    it('throws when board does not exist', async () => {
        await expect(service.deleteBoard('nonexistent')).rejects.toThrow('not found');
    });
});
```

## Coverage Targets

- Business logic (services, middleware): >80%
- Route handlers: >70%
- Validation/utility functions: 100%
- Integration: critical flows only
