# Contributing to SheetForge

Thank you for your interest in contributing to SheetForge!

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+

## Setup

```bash
# Clone the repository
git clone https://github.com/Popovonline/stanford_project_spreadsheet.git
cd stanford_project_spreadsheet

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes following the conventions in [CLAUDE.md](CLAUDE.md)
3. Run the test suite:
   ```bash
   npm run test        # Unit tests
   npm run test:e2e    # E2E tests (requires dev server running)
   ```
4. Verify the build:
   ```bash
   npm run build
   ```
5. Commit with a descriptive message and open a pull request

## Code Conventions

- **TypeScript** — strict mode enabled; no `any` types
- **shadcn/ui** — all UI chrome uses shadcn/ui primitives (see [CLAUDE.md](CLAUDE.md) for details)
- **CSS** — Tailwind CSS v4 with `--sf-*` design tokens defined in `app/globals.css`
- **State** — all spreadsheet state managed via `useReducer` in `state/spreadsheet-context.tsx`
- **Testing** — Vitest for unit tests, Playwright for E2E (see [docs/testing.md](docs/testing.md))

## Project Structure

See the [README](README.md#project-structure) for the full directory layout.

## Testing

```bash
npm run test          # Run unit tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run test:e2e      # Run Playwright E2E tests
npm run test:all      # Run everything
npm run lint          # ESLint
```

For detailed testing conventions and coverage maps, see [docs/testing.md](docs/testing.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
