# Welcome to Conductor

This is the starter project for Conductor, a macOS app for running multiple coding agents in parallel in isolated git worktree workspaces.

The app itself is a small React + TypeScript + Vite project. It gives new Conductor workspaces something quick to install, run, edit, review, and ship.

## How Conductor Uses This Project

Conductor creates each workspace as its own git worktree and branch. The checked-in `conductor.json` tells Conductor how to prepare and run this starter app:

```json
{
  "scripts": {
    "setup": "npm install",
    "run": "npm run dev"
  }
}
```

When you create a workspace, Conductor runs the setup script from the workspace directory. When you click Run, Conductor starts the Vite dev server.

## Local Development

Install dependencies:

```sh
npm install
```

Start the dev server:

```sh
npm run dev
```

Build for production:

```sh
npm run build
```

Run lint checks:

```sh
npm run lint
```

## Project Structure

- `src/App.tsx` contains the starter app UI and interactions.
- `src/App.css` and `src/index.css` contain the app styling.
- `conductor.json` contains the shared Conductor workspace scripts.
- `.context/` is available in Conductor workspaces for gitignored notes and handoff files between agents.

## Learn More

- [Conductor docs](https://conductor.build/docs)
- [Vite docs](https://vite.dev)
- [React docs](https://react.dev)
