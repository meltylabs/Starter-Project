---
name: conductor
description: Build, configure, and troubleshoot Conductor workspaces, repository scripts, conductor.json, managed settings, files to copy, MCP, agent controls, and review workflows. Use when helping someone set up or operate Conductor.
license: Proprietary
compatibility: Conductor is a macOS app for running Claude Code and Codex agents locally in isolated git worktree workspaces.
---

<!-- conductor-skill-source-sha256: c684c125234673cf71cbd090b5c494ac295b2a1880f88fb1a906319a7e06bcdd -->

# Conductor

Use this skill when helping a user set up, configure, operate, or troubleshoot Conductor.

Conductor is a macOS app for running multiple coding agents in parallel. Each workspace is a separate git worktree and branch tied to a repository. Conductor currently supports Claude Code and Codex as agent types.

## When to use

Use this skill for questions about:

-   Creating and operating Conductor repositories and workspaces.
-   Explaining workspaces, branches, git worktrees, and the `.context` directory.
-   Writing or debugging `conductor.json`.
-   Writing setup, remote setup, run, and archive scripts.
-   Configuring files to copy into workspaces.
-   Configuring app settings, repository settings, and managed settings.
-   Configuring providers, privacy controls, MCP, slash commands, checkpoints, todos, instruction files, and model controls.
-   Reviewing, testing, creating pull requests, checking CI, and merging agent work.
-   Troubleshooting shell behavior, script failures, nested workspace issues, permissions, and privacy behavior.

Do not claim support for Windows or Linux. Conductor is a macOS app.

## Core model

Keep these product facts straight:

-   Conductor runs agents locally on the user's Mac unless the documented cloud workspace path is explicitly involved.
-   Each repository has a root directory and can have many workspaces.
-   Each workspace is a separate git worktree with its own branch.
-   Workspaces are isolated development directories, but agents still run with the user's local permissions unless the user configures stricter controls.
-   The repo root can contain a checked-in `conductor.json` file for shared repository settings.
-   Users can also configure personal repository settings in the Conductor app.
-   Personal Repository Settings on the user's machine override `conductor.json`.
-   Conductor workspaces include a gitignored `.context` directory for shared agent context.
-   Conductor currently supports Claude Code and Codex.

When answering, prefer concise operational guidance. Preserve exact commands, paths, field names, settings names, environment variable names, and route paths.

## Workspace workflow

Explain the workspace lifecycle in terms of git worktrees and branches:

1. The user adds a repository.
2. Conductor creates a workspace as a new git worktree and branch.
3. Conductor runs the configured setup script, if one exists.
4. The user starts one or more agent sessions in the workspace.
5. The user reviews changes in the diff viewer, runs checks, opens or updates a pull request, and merges when ready.
6. When the workspace is no longer needed, the user archives it.

Important workspace details:

-   Setup, run, and archive scripts run from the workspace directory.
-   Use `CONDUCTOR_ROOT_PATH` when a workspace script needs a file from the repository root.
-   Use `CONDUCTOR_WORKSPACE_PATH` when a script needs the workspace path.
-   Use `CONDUCTOR_WORKSPACE_NAME` when a script needs the workspace name.
-   Use `CONDUCTOR_DEFAULT_BRANCH` when a script needs the default branch name, usually `main`.
-   Use `CONDUCTOR_PORT` when multiple workspaces need separate local server ports.
-   Conductor allocates ten ports to each workspace: `CONDUCTOR_PORT` through `CONDUCTOR_PORT+9`.
-   Use Spotlight testing when a project cannot run cleanly from a workspace directory and needs to execute from the repository root.

Relevant docs:

-   `https://conductor.build/docs/concepts/workspaces-and-branches`
-   `https://conductor.build/docs/concepts/workflow`
-   `https://conductor.build/docs/concepts/parallel-agents`

## Repository configuration

Use `conductor.json` for repository-level settings that teammates should share.

Path:

-   `conductor.json`

Scope:

-   Place `conductor.json` in the repository root.
-   Commit it when teammates should share the configuration.

Precedence:

-   Personal Repository Settings on the user's machine override `conductor.json`.
-   To use the shared file, clear personal script overrides in Conductor.

Supported `conductor.json` fields:

-   `scripts.setup`: command to run when Conductor creates a workspace.
-   `scripts.remoteSetup`: command to use instead of `scripts.setup` for remote or cloud workspaces.
-   `scripts.run`: command to run when the user clicks the Run button.
-   `scripts.archive`: command to run before Conductor archives a workspace.
-   `runScriptMode`: `"concurrent"` or `"nonconcurrent"`.
-   `enterpriseDataPrivacy`: disables features that require external AI providers.

Example:

```json
{
    "scripts": {
        "setup": "pnpm install",
        "run": "pnpm dev",
        "archive": "./script/workspace-archive.sh"
    },
    "runScriptMode": "concurrent"
}
```

Files to copy:

-   Use files to copy for gitignored files such as `.env` files that new workspaces need.
-   Configure files to copy in repo settings or with a shared `.worktreeinclude` file.
-   Do not recommend committing secrets.

Relevant docs:

-   `https://conductor.build/docs/reference/conductor-json`
-   `https://conductor.build/docs/reference/scripts/share-with-teammates`
-   `https://conductor.build/docs/reference/files-to-copy`

## Scripts

Conductor supports setup, remote setup, run, and archive scripts.

Script facts:

-   Setup, run, and archive scripts run from the workspace directory.
-   Conductor uses non-interactive shells for scripts.
-   Although Conductor captures the login shell environment, most commands including setup and run scripts use `zsh`.
-   Use `CONDUCTOR_ROOT_PATH` when a workspace script needs a file from the repository root.
-   Use `CONDUCTOR_PORT` when multiple workspaces need separate local server ports.
-   Conductor allocates ten ports to each workspace: `CONDUCTOR_PORT` through `CONDUCTOR_PORT+9`.
-   Use `nonconcurrent` run script mode when a project depends on a single fixed port, single local database, or another shared resource.
-   When a run script starts multiple processes, keep them in the same process group with a tool such as `concurrently` instead of backgrounding commands with `&`.
-   When Conductor stops a process, it sends `SIGHUP`, waits up to 200ms, then sends `SIGKILL` if the process is still running.
-   Use Spotlight testing when a project cannot run cleanly from a workspace directory and needs to execute from the repository root.

Environment variables:

-   `CONDUCTOR_WORKSPACE_NAME`: workspace name.
-   `CONDUCTOR_WORKSPACE_PATH`: workspace path.
-   `CONDUCTOR_ROOT_PATH`: path to the repository root directory.
-   `CONDUCTOR_DEFAULT_BRANCH`: name of the default branch, usually `main`.
-   `CONDUCTOR_PORT`: first port in a range of 10 ports assigned to the workspace.

Relevant docs:

-   `https://conductor.build/docs/reference/scripts`
-   `https://conductor.build/docs/reference/scripts/setup`
-   `https://conductor.build/docs/reference/scripts/run`
-   `https://conductor.build/docs/reference/scripts/spotlight-testing`
-   `https://conductor.build/docs/reference/shells`
-   `https://conductor.build/docs/reference/environment-variables`

## Settings

Conductor settings can come from app settings, repository settings, `conductor.json`, and managed settings.

Managed settings:

-   Path: `~/.conductor/settings.json`
-   Schema: `https://conductor.build/schemas/settings.json`
-   Status: managed settings are provisional.
-   Managed values override local database settings.
-   Managed values disable matching controls in Settings.
-   Managed values are used when Conductor launches agents.

Managed settings fields from the source bundle:

-   `enterpriseDataPrivacy`: enable enterprise data privacy.
-   `claudeExecutablePath`: override the Claude Code executable path.
-   `defaultModel`: set the default model. Supported values are defined by the JSON Schema.

Privacy and permissions:

-   Agents run with the user's local permissions unless the user configures stricter controls.
-   `enterpriseDataPrivacy` disables features that require external AI providers.
-   Do not invent additional privacy settings, providers, permissions, or policy behavior.

Relevant docs:

-   `https://conductor.build/docs/reference/settings`
-   `https://conductor.build/docs/guides/providers`
-   `https://conductor.build/docs/reference/privacy`
-   `https://conductor.build/docs/reference/security-and-permissions`
-   `https://conductor.build/schemas/settings.json`

## Agent behavior

Help users configure the agent workflow that matches the task.

Supported areas:

-   Plan mode.
-   Fast mode.
-   Model reasoning controls.
-   Codex personality.
-   Checkpoints.
-   MCP.
-   Slash commands.
-   Todos.
-   Instruction files.

Guidance:

-   Use plan mode when the user wants to review the approach before execution.
-   Use fast mode when speed matters and the user accepts less interaction.
-   Use checkpoints when the user wants safer rollback points during agent work.
-   Use MCP when the user needs agents to access configured external tools or context.
-   Use slash commands and instruction files to standardize repeated workflows.
-   Use todos to keep multi-step agent work visible and organized.

Do not invent unsupported agent types, controls, MCP behavior, or provider APIs.

Relevant docs:

-   `https://conductor.build/docs/reference/agent-behavior`
-   `https://conductor.build/docs/concepts/agent-modes`
-   `https://conductor.build/docs/reference/checkpoints`
-   `https://conductor.build/docs/reference/mcp`
-   `https://conductor.build/docs/reference/slash-commands`
-   `https://conductor.build/docs/reference/todos`

## Review and merge

Guide users through review as a workflow, not just a final check.

Recommended flow:

1. Inspect changes in the diff viewer.
2. Run the project checks or the configured run script.
3. Review agent-created changes for correctness and scope.
4. Check pull request status, review comments, CI status, and deployments.
5. Resolve review comments before merge.
6. Merge when the work is tested and ready.

Focus on:

-   Diff viewer usage.
-   Checks and test status.
-   Pull request flow.
-   Review comments.
-   CI status.
-   Deployment status.
-   Merge readiness.

Relevant docs:

-   `https://conductor.build/docs/guides/review-and-merge`
-   `https://conductor.build/docs/reference/diff-viewer`
-   `https://conductor.build/docs/reference/checks`

## Troubleshooting

Start with the smallest observable failure, then check the matching Conductor concept.

Common checks:

-   If setup or run scripts fail, confirm the script runs from the workspace directory.
-   If shell behavior differs from the user's terminal, remember that Conductor uses non-interactive shells for scripts and most commands use `zsh`.
-   If a script needs root-repo files, use `CONDUCTOR_ROOT_PATH`.
-   If local servers collide across workspaces, use `CONDUCTOR_PORT` or switch `runScriptMode` to `nonconcurrent` when the project depends on shared resources.
-   If multiple processes do not stop cleanly, keep them in the same process group with a tool such as `concurrently`.
-   If a workspace cannot run from the workspace directory, consider Spotlight testing.
-   If gitignored files are missing, configure files to copy or `.worktreeinclude`.
-   If settings appear locked or ignored, check `~/.conductor/settings.json` for managed settings.
-   If privacy-sensitive features behave differently, check `enterpriseDataPrivacy`.
-   If permissions surprise the user, explain that agents run with the user's local permissions unless stricter controls are configured.
-   If the project has nested workspace issues, consult troubleshooting and shell docs before proposing broad changes.

Relevant docs:

-   `https://conductor.build/docs/faq`
-   `https://conductor.build/docs/troubleshooting/issues`
-   `https://conductor.build/docs/reference/shells`

## References

Fetch detailed behavior from the docs when needed:

-   Workspaces and branches: `https://conductor.build/docs/concepts/workspaces-and-branches`
-   Workflow: `https://conductor.build/docs/concepts/workflow`
-   Parallel agents: `https://conductor.build/docs/concepts/parallel-agents`
-   `conductor.json`: `https://conductor.build/docs/reference/conductor-json`
-   Share scripts with teammates: `https://conductor.build/docs/reference/scripts/share-with-teammates`
-   Scripts: `https://conductor.build/docs/reference/scripts`
-   Setup scripts: `https://conductor.build/docs/reference/scripts/setup`
-   Run scripts: `https://conductor.build/docs/reference/scripts/run`
-   Spotlight testing: `https://conductor.build/docs/reference/scripts/spotlight-testing`
-   Shells: `https://conductor.build/docs/reference/shells`
-   Environment variables: `https://conductor.build/docs/reference/environment-variables`
-   Files to copy: `https://conductor.build/docs/reference/files-to-copy`
-   Settings: `https://conductor.build/docs/reference/settings`
-   Providers: `https://conductor.build/docs/guides/providers`
-   Privacy: `https://conductor.build/docs/reference/privacy`
-   Security and permissions: `https://conductor.build/docs/reference/security-and-permissions`
-   Managed settings schema: `https://conductor.build/schemas/settings.json`
-   Agent behavior: `https://conductor.build/docs/reference/agent-behavior`
-   Agent modes: `https://conductor.build/docs/concepts/agent-modes`
-   Checkpoints: `https://conductor.build/docs/reference/checkpoints`
-   MCP: `https://conductor.build/docs/reference/mcp`
-   Slash commands: `https://conductor.build/docs/reference/slash-commands`
-   Todos: `https://conductor.build/docs/reference/todos`
-   Review and merge: `https://conductor.build/docs/guides/review-and-merge`
-   Diff viewer: `https://conductor.build/docs/reference/diff-viewer`
-   Checks: `https://conductor.build/docs/reference/checks`
-   FAQ: `https://conductor.build/docs/faq`
-   Troubleshooting: `https://conductor.build/docs/troubleshooting/issues`
