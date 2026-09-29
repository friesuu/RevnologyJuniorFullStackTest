# Task Board
A simple task board: React frontend, NestJS API and PostgreSQL database.

**Work in progress.**

## Status
**Done:** backend and frontend connected, board showing tasks grouped by status, PostgreSQL connected with a `tasks` table.

**To do:** read tasks from the database, create/edit/delete, validation, overdue highlight, tests.

## How to run
Needs Node.js 20+ and PostgreSQL.

1. Create the database (e.g. in pgAdmin's Query Tool):
   ```sql
   CREATE DATABASE taskboard;
   ```
2. Backend: copy `backend/.env.example` to `backend/.env` and set your PostgreSQL password, then:
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```
   API: http://localhost:3000/tasks
3. Frontend (second terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open http://localhost:5173

## Use of AI tools
I used Claude as a tutor to explain concepts, review my code and help with setup commands. I wrote the application code myself with help from built in AI in google search.

## Notes
I restarted the git history early on after accidentally committing `node_modules`, then added a `.gitignore`.
