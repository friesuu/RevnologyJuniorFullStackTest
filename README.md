# Task Board

A small task board for a team: a React web page backed by a NestJS API and a PostgreSQL database.

> **Work in progress.** This repository is my take-home submission. The section below describes what is done at the tagged commit `deadline-submission` and what is still to come.

## Status at deadline

**Done**

- NestJS API and React frontend set up and connected
- The board shows tasks from the API, grouped into **To do / In progress / Done**
- PostgreSQL connected through TypeORM, with a `Task` entity that creates the `tasks` table:
  - `title` limited to 100 characters (`varchar(100)`)
  - `status` restricted to `todo`, `in_progress` or `done` (Postgres enum, default `todo`)
  - optional `description` and `due_date`, and an automatic `created_at` timestamp
- Database settings in an environment file (`backend/.env`), not in the code
- CORS restricted to the frontend's origin (`http://localhost:5173`)

**Still to do**

- `GET /tasks` still returns sample data; switch it to read from the database
- Create, edit and delete tasks (`POST`, `PATCH`, `DELETE /tasks`)
- Input validation with clear error messages (DTOs + `ValidationPipe`)
- Highlight overdue tasks (due date in the past and not done)
- Backend API tests (Jest + supertest)
- Full README: decisions, trade-offs and what I'd do with more time

## Tech stack

| Layer    | Choice                        | Why |
|----------|-------------------------------|-----|
| Frontend | React (with Vite), JavaScript | React is the company's frontend stack; Vite is the simplest way to run a plain React app without the extra concepts Next.js adds (routing, server rendering) |
| Backend  | NestJS (TypeScript)           | Same language family as the frontend; its controller → service → repository structure is close to what I know from Java |
| Database | PostgreSQL + TypeORM          | Strict about bad data; TypeORM is NestJS's documented integration and its entities look like Java JPA |

## How to run it

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- [PostgreSQL](https://www.postgresql.org/download/) running locally (pgAdmin is included in the installer)

### 1. Create the database

In pgAdmin's Query Tool (or `psql`), run:

```sql
CREATE DATABASE taskboard;
```

### 2. Start the backend

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env` and set `DB_PASSWORD` to your PostgreSQL password. Then:

```bash
npm run start:dev
```

The API runs on http://localhost:3000. The `tasks` table is created automatically on startup. Check it with http://localhost:3000/tasks.

### 3. Start the frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

> **Windows tip:** if PowerShell says *"running scripts is disabled on this system"*, use `npm.cmd` instead of `npm` (for example `npm.cmd install`).

## Decisions so far

- **Two separate apps** (`backend/`, `frontend/`), each with its own `package.json`: the API doesn't depend on the page, so it could also serve a mobile app later. Trade-off: two servers to run, and CORS to configure.
- **All frontend API calls live in `frontend/src/api.js`**, so components never build URLs themselves.
- **`TaskStatus` enum defined once** and reused by the entity (and later by validation).
- **snake_case columns in the database** (`due_date`, `created_at`), camelCase in JavaScript and JSON (`dueDate`, `createdAt`).
- **`dueDate` is a date only** (`YYYY-MM-DD`); **`createdAt` is a full UTC timestamp**. A due date is a calendar day, while creation is an exact moment.
- **`synchronize: true`** creates the table from the entity. It's fast for a take-home but unsafe in production, where I would use migrations.
- **`getOrThrow` for config**: the app fails at startup with a clear message if a setting is missing.
- **CommonJS + Jest** (NestJS's long-standing default) rather than ES modules + Vitest, to stay on the best-documented path.

## Use of AI tools

I used **Claude (Anthropic)** as a tutor throughout:

- to explain concepts that were new to me (NestJS modules and dependency injection, React state and effects, DTO validation, CORS, TypeORM entities)
- to review my code and point out bugs and the concept behind them. I then fixed them myself (for example, passing a string instead of an options object to `enableCors`, and a CSS rule nested inside the wrong block)
- to help with git and setup commands
- to draft this README from my notes

I wrote the application code myself.

## Notes

- I restarted the git history early on after accidentally committing `node_modules` and the build output, then added a `.gitignore`.
