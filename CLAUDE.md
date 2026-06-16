# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Runtime & Commands

This project runs on **Bun** (not Node). It uses Bun-specific APIs (`Bun.Glob`, `Bun.env`, `import.meta.dir`), so commands must be run with `bun`.

- `bun run start` — start the bot (`src/index.ts`)
- `bun run deploy` — register slash commands with Discord's API (`src/deploy-commands.ts`); run this whenever a command's `data` definition changes
- `bun run lint` — ESLint over `src/`
- `bun run format` / `bun run format:check` — Prettier write / check

There is no test setup. Lint config uses typescript-eslint `strict` + `stylistic`; Prettier enforces no semicolons, single quotes, trailing commas, 100-char width.

Required env vars (read via `requireEnv`, which throws if missing): `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`.

## Releases & Versioning

Versioning is fully automated by **semantic-release** (config in [.releaserc.json](.releaserc.json)) and driven by [Conventional Commits](https://www.conventionalcommits.org/) — there is no manual version bumping. The `version` field in `package.json` is a placeholder (`0.0.0-semantically-released`); the real version lives in git tags and is the single source of truth synced everywhere.

- Commit messages decide the bump: `fix:` → patch, `feat:` → minor, `feat!:` / `BREAKING CHANGE:` → major. `chore:`/`docs:`/`refactor:` etc. trigger no release.
- On every push to `main`, the `release` job in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) computes the next version, then: updates `package.json` + `CHANGELOG.md`, commits them back as `chore(release): X.Y.Z [skip ci]`, creates the `vX.Y.Z` git tag, and publishes a GitHub Release.
- Only when a release is actually published do the `build-and-push` and `deploy` jobs run. The GHCR image is tagged with the exact version plus rolling `X.Y`, `X`, and `latest` (e.g. `1.4.2`, `1.4`, `1`, `latest`). The server is deployed to the pinned `X.Y.Z` tag.
- Net effect: merges that contain only non-release commits build/deploy nothing; a release tag, a GHCR image, and a server deploy all share one synchronized version.

## Architecture

A Discord bot built on discord.js v14 with a convention-based loader.

- **Modular monolith**: the app runs as one Bun process started from [src/index.ts](src/index.ts), the *composition root*. Feature/domain logic lives in framework-agnostic modules under `src/<feature>/` (e.g. [src/music/](src/music/)); thin **adapters** drive them. Today `src/commands/` + `src/events/` are the Discord adapter; a future `src/api/` (Hono) would be the HTTP adapter in the **same process**, importing the same domain singletons (e.g. `musicManager`). Domains never import adapters. `index.ts` starts each subsystem (currently `await startBot()`).

- **Dynamic loading**: [src/bot.ts](src/bot.ts) (`startBot()`) uses `Bun.Glob` to scan `src/commands/` and `src/events/` at startup, instantiating each file's default-exported **class** and validating it with `instanceof`. Adding a feature means dropping a new file in the right directory — no central registry to update. The same glob scan is duplicated in [src/deploy-commands.ts](src/deploy-commands.ts) for command registration.

- **Commands** ([src/commands/](src/commands/)): each default-exports a **class extending the abstract `Command`** ([src/types/command.ts](src/types/command.ts)) — with `data` (SlashCommandBuilder), `execute(interaction)`, and an optional `cooldown` (seconds). Commands are keyed by `data.name` into `client.commands`.

- **Events** ([src/events/](src/events/)): each default-exports a **class extending the abstract `Event<K>`** ([src/types/event.ts](src/types/event.ts)) bound to a `ClientEvents` key, with `once` controlling `client.once` vs `client.on`. Set `name = Events.X` (e.g. `as const`) so `execute` args are typed from the event name.

- **Command dispatch & cooldowns**: [src/events/interactionCreate.ts](src/events/interactionCreate.ts) is the router — it looks up the command, enforces per-user/per-command cooldowns (default 3s, stored in `client.cooldowns`), runs `execute`, and handles errors centrally. Individual commands do not manage cooldowns or top-level error handling themselves.

- **Client augmentation**: `client.commands` and `client.cooldowns` are added to discord.js's `Client` via `declare module 'discord.js'` in [src/types/discord.ts](src/types/discord.ts) and [src/types/command.ts](src/types/command.ts).

- **Config** ([src/config/](src/config/)): `requireEnv` validates env vars; `src/config/index.ts` re-exports everything from `discord.ts`, so import tokens via `from './config'`.

## Conventions

- `GatewayIntentBits.Guilds` and `GuildVoiceStates` are enabled (the latter to read members' voice channels for music). New event handlers relying on other intents (e.g. message content, members) require adding the intent in [src/bot.ts](src/bot.ts).
- Use `MessageFlags.Ephemeral` (not the deprecated `ephemeral: true`) for new ephemeral replies — see [src/commands/ping.ts](src/commands/ping.ts).
