# Task Board
A simple task board. You can add tasks, move them between TO DO, IN PROGRESS and DONE, edit, delete, and see which ones are overdue.

- Frontend: React
- Backend: NestJS
- Database: PostgreSQL

## What it does
- Add a task (title, description, due date)
- Change a task's status
- Edit or delete a task
- Late tasks are shown in red with an "Overdue" label
- Tasks are saved, so they're still there after a restart

## How to run it
You need **Node.js** and **PostgreSQL** installed.

**1. Create the databases**

In pgAdmin, open the Query Tool and run these SQL Queries one at a time:

CREATE DATABASE taskboard;

CREATE DATABASE taskboard_test;

**2. Start the backend**

- In the terminal: 
cd backend
npm install

Copy `.env.example` to a new file called `.env`, and put your PostgreSQL password in it. 

- Then in the same terminal:
npm run start:dev

**3. Start the frontend** (in a new terminal)

cd frontend
npm install
npm run dev

Open http://localhost:5173 in your browser.

- If **npm** doesn't work, use **npm.cmd** instead

## Running the tests
cd into the `backend` folder in terminal and run:

npm run test:e2e

The tests use the `taskboard_test` database, so they don't touch your real tasks.

## The API
| Method | URL | What it does |
|--------|-----|--------------|
| GET | `/tasks` | Get all tasks |
| POST | `/tasks` | Add a task |
| PATCH | `/tasks/:id` | Change a task |
| DELETE | `/tasks/:id` | Delete a task |

If something is wrong, the API sends back an error. For example:
- An empty title or a wrong status gives **400 Bad Request**
- A task that doesn't exist gives **404 Not Found**

I didn't add the `?status=` filter from the suggested API, because the page gets all tasks once and puts them into columns itself.

## Decisions I made
- **I used the company's tools** (React, NestJS, PostgreSQL) even though they were new to me, so it took longer.
- **The database table is made automatically** when the app starts. This is easy for a small project, but a real app should use migrations.
- **The API checks all input** (title not empty, max 100 characters, valid status, real date). The form checks some things too, but the API is the real safety net.
- **"Overdue" is worked out in the browser**, because "today" depends on where the user is. A task due today is not overdue yet.
- **The page only updates after the save works.** If it fails, an error is shown and nothing changes.

## What I'd do with more time
- Search and filter tasks
- Drag and drop cards between columns

## AI tools I used
- **Claude:** helped me learn React and NestJS, gave me hints if what I wrote doesn't work, explained errors, reviewed my code so I could fix my bugs, helped with git commands, changed my CSS colours into variables, and helped me write this README.
- **Google Search AI:** is used mostly to know what't the syntax for specific functions and how it is written in javascript. I also used this to generate the color theme codes for vscode's tokyo night

## Time spent
About 1 week learning and building at the same time

## Notes
- I restarted the git history at the start because I accidentally uploaded `node_modules`.
- The `deadline-submission` tag shows what I had at the deadline.
