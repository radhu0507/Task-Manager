# Contributing to Task Manager

Thanks for your interest in contributing! Please take a moment to review these guidelines before opening an issue or PR.

## Code of Conduct

Be respectful and constructive. Harassment or discrimination of any kind is not tolerated.

## Getting Started

1. Fork the repository and clone your fork.
2. Create a branch: `git checkout -b feature/my-feature` (or `fix/my-fix`).
3. Follow the [local setup instructions in the README](./README.md#local-setup).
4. Make your changes and keep them focused.

## Development Workflow

- Run checks before pushing:

  ```bash
  npm run typecheck
  npm run lint
  npm test --prefix server
  npm run build
  ```

- Run the E2E suite when your change touches the UI flow:

  ```bash
  npx playwright install chromium
  npm run test:e2e
  ```

- Add unit/integration tests for new backend logic (server `tests/`), using the existing Vitest + Supertest patterns.
- Do not leave TypeScript errors, lint errors, or failing tests in your branch.

## Code Style

- TypeScript with strict mode; avoid `any` unless genuinely necessary.
- Small, reusable components and services; clear naming.
- Reuse `validators/`, `middleware/`, and `utils/` — no duplicated logic.
- Keep controllers lean; put business logic in `services/`.
- The API contract stays `{ success, data, message }` and `{ success: false, error: { code, message } }`.

## Commit Conventions

- Write concise, imperative commit messages (e.g. `Add task assignee sync`).
- Reference issues when relevant: `Fix #42`.

## Pull Requests

- Describe what and why, and reference the issue resolved.
- Keep the diff small and reviewable.
- Ensure CI (typecheck → lint → test → build → docker build) passes.

## Reporting Bugs

Open an issue with: steps to reproduce, expected vs actual behavior, environment (OS, Node version), and anything from the server/client logs that helps.

## License

By contributing you agree that your contributions are licensed under the [MIT License](./LICENSE).