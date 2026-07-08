# CPS Safaris Frontend

A monorepo frontend application for CPS Safaris built with React, TypeScript, and Vite.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
  - [Feature Code Structure](#feature-code-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Development](#development)
- [Building](#building)
- [Contributing](#contributing)

## Overview

This monorepo contains the frontend applications and shared packages for CPS SOL. It uses pnpm workspaces to manage multiple packages and applications efficiently.

## Tech Stack

### Core

- **React** 19.2.0
- **TypeScript** 5.9.3
- **Vite** 7.2.4
- **pnpm** 10.11.0

### State Management & Data Fetching

- **TanStack Query** (React Query) 5.90.17 - Server state management
- **Zustand** 5.0.10 - Client state management

### UI & Styling

- **Tailwind CSS** 4.1.18 - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Radix UI** - Accessible component primitives

### Internationalization

- **react-i18next** 16.5.3 - Internationalization framework
- **i18next** 25.7.4 - Core i18n library

### Testing & Development

- **Playwright** - End-to-end testing
- **MSW** (Mock Service Worker) 2.12.7 - API mocking for development
- **ESLint** 9.39.1 - Code linting
- **Prettier** 3.7.4 - Code formatting
- **Husky** 9.1.7 - Git hooks

## Project Structure

```
cpc_safaris-frontend/
├── apps/
│   ├── admin/          # Admin application
│   │   ├── e2e/        # Playwright E2E tests
│   │   ├── src/
│   │   │   ├── stores/ # Zustand stores (UI, preferences)
│   │   │   └── ...
│   │   └── playwright.config.ts
│   └── client/         # Client-facing application
│       ├── e2e/        # Playwright E2E tests
│       ├── src/
│       │   ├── stores/ # Zustand stores (UI, preferences)
│       │   └── ...
│       └── playwright.config.ts
├── packages/
│   ├── api-client/     # API client package
│   │   ├── src/
│   │   │   ├── msw/    # MSW handlers and setup
│   │   │   ├── providers/ # QueryProvider
│   │   │   └── query-client.ts
│   │   └── public/     # MSW service worker
│   ├── i18n/           # Internationalization package
│   │   └── src/
│   │       └── locales/ # Translation files (en, es)
│   ├── types/          # Shared TypeScript types
│   └── ui/             # Shared UI components (shadcn/ui)
└── package.json        # Root package.json with workspace scripts
```

### Feature Code Structure

This project follows **Feature-Sliced Design (FSD)** architecture. Features are organized in `src/features/` with the following structure:

```
features/
└── feature-name/
    ├── api/              # API hooks (TanStack Query)
    │   └── useFeatureAction.ts
    ├── model/            # Business logic & form state
    │   └── useFeatureForm.ts
    ├── ui/               # UI components
    │   └── FeatureModal.tsx
    ├── __tests__/        # Tests (unit & integration)
    │   ├── FeatureModal.test.tsx
    │   └── useFeatureForm.test.ts
    └── index.ts          # Public exports (optional)
```

**Layer Responsibilities:**

- **`api/`** - API integration hooks using TanStack Query
  - Example: `useCreateDestination`, `useUpdateDestination`
- **`model/`** - Business logic, form state, validation
  - Example: `useCreateDestinationForm`, `useEditDestination`
- **`ui/`** - React components (presentation layer)
  - Example: `CreateDestinationModal`, `EditDestinationModal`
- **`__tests__/`** - Unit and integration tests
  - Test files mirror the structure (`.test.ts`, `.test.tsx`)

**Example Feature:**

```
features/edit-destination/
├── api/
│   └── useUpdateDestination.ts    # API mutation hook
├── model/
│   └── useEditDestination.ts      # Form state & validation
├── ui/
│   └── EditDestinationModal.tsx   # Modal component
└── __tests__/
    ├── EditDestinationModal.test.tsx
    └── useEditDestination.test.ts
```

**Best Practices:**

1. **Separation of Concerns**: Keep API calls in `api/`, business logic in `model/`, and UI in `ui/`
2. **Naming**: Use descriptive, feature-specific names (e.g., `useEditDestination`, not `useForm`)
3. **Exports**: Use `index.ts` to expose only public APIs
4. **Testing**: Write tests for each layer, especially business logic in `model/`
5. **Dependencies**: Features can import from `entities/`, `shared/`, and `widgets/`, but not from other features

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0

To install pnpm globally (if not already installed):

```bash
npm install -g pnpm
```

## Installation

1. Clone the repository:

```bash
git clone https://gitlab.altexsoft.pro/gr_cpc_safaris-frontend/cpc_safaris-frontend.git
cd cpc_safaris-frontend
```

2. Install dependencies:

```bash
pnpm install
```

This will install all dependencies for the root workspace and all packages/apps.

## Available Scripts

### Development

- `pnpm dev` - Start all apps in development mode
- `pnpm dev:admin` - Start only the admin app
- `pnpm dev:client` - Start only the client app

### Building

- `pnpm build` - Build all apps
- `pnpm build:admin` - Build only the admin app
- `pnpm build:client` - Build only the client app

### Code Quality

- `pnpm lint` - Lint all apps
- `pnpm lint:fix` - Fix linting issues in all apps
- `pnpm format` - Format code using Prettier
- `pnpm type-check` - Type check all apps

### Testing

- `pnpm test:e2e` - Run end-to-end tests for all apps
- `pnpm test:e2e:ui` - Run E2E tests with Playwright UI mode
- `pnpm test:e2e:headed` - Run E2E tests in headed mode (see browser)

**Per App:**

- `cd apps/admin && pnpm test:e2e` - Run admin app tests
- `cd apps/client && pnpm test:e2e` - Run client app tests

### Maintenance

- `pnpm clean` - Remove all node_modules and dist directories

## Development

### Starting Development Servers

To start all applications in development mode:

```bash
pnpm dev
```

To start a specific application:

```bash
pnpm dev:admin   # Admin app
pnpm dev:client  # Client app
```

Each app will be available on its own port (check the Vite output for the exact URLs).

### Working with Packages

The monorepo uses pnpm workspaces. Packages are referenced using workspace protocol:

- `@sol/ui` - Shared UI components (shadcn/ui)
- `@sol/types` - Shared TypeScript types
- `@sol/api-client` - API client with TanStack Query and MSW
- `@sol/i18n` - Internationalization (i18next) package

When you make changes to a package, the consuming apps will automatically pick up the changes (thanks to Vite's HMR).

### State Management

**Client State (Zustand):**

- UI Store: Sidebar and modal state management
- Preferences Store: Column settings with localStorage persistence

**Server State (TanStack Query):**

- Configured with sensible defaults (5min stale time, 3 retries)
- React Query DevTools enabled in development
- Available via `@sol/api-client` package

### Internationalization

The project uses `react-i18next` for internationalization:

- **Namespaces**: `common`, `admin`, `client`
- **Languages**: English (en), Spanish (es)
- **Storage**: Language preference saved to localStorage
- **Usage**: `import { useTranslation } from "@sol/i18n"`

### API Mocking (Development)

MSW (Mock Service Worker) is configured for development:

- Automatically intercepts API requests in dev mode
- Sample handlers included (health check, safaris endpoints)
- Service worker located in `apps/*/public/mockServiceWorker.js`
- Handlers can be extended in `packages/api-client/src/msw/handlers.ts`

## Building

To build all applications for production:

```bash
pnpm build
```

To build a specific application:

```bash
pnpm build:admin   # Admin app
pnpm build:client  # Client app
```

Build outputs will be in each app's `dist` directory.

## Contributing

1. Create a new branch for your feature or bugfix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Ensure code passes linting and type checking:

   ```bash
   pnpm lint
   pnpm type-check
   ```

4. Format your code:

   ```bash
   pnpm format
   ```

5. Run tests (if applicable):

   ```bash
   pnpm test:e2e
   ```

6. Commit your changes (Husky will run lint-staged automatically)

7. Push your branch and create a merge request:
   ```bash
   git push -u origin feature/your-feature-name
   ```

### Code Quality Tools

- **ESLint**: Configured with TypeScript and React rules
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for linting and formatting
- **lint-staged**: Runs linters on staged files only

## License

CPS SOL
