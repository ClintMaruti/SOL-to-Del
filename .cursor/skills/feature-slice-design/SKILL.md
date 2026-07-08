---
name: cps-sol-fsd-architecture
description: Feature-Sliced Design rules for CPS SOL monorepo
---

# CPS SOL Frontend Architecture Rules

## Overview

**Architecture:** Feature-Sliced Design (FSD) in a pnpm monorepo

**Tech Stack:**

- React 19.2.0 + TypeScript 5.9.3 + Vite 7.2.4
- TanStack Query 5.90.17 (server state) + Zustand 5.0.10 (client state)
- Tailwind CSS 4.1.18 + shadcn/ui (Radix UI)
- react-i18next 16.5.3 (internationalization)
- Vitest + @testing-library/react (unit/integration tests)
- Playwright (E2E testing) + MSW 2.12.7 (API mocking)

## Monorepo Structure

```
cpc_safaris-frontend/
├── apps/
│   ├── admin/              # Admin app (internal staff)
│   └── client/             # Client app (travel partners)
├── packages/
│   ├── ui/                 # @sol/ui - Shared UI components (shadcn/ui)
│   ├── types/              # @sol/types - TypeScript types
│   ├── api-client/         # @sol/api-client - API client + MSW + QueryProvider
│   └── i18n/               # @sol/i18n - Internationalization (en, es)
└── package.json
```

## Layer Hierarchy (The Golden Rule)

**Each layer can ONLY import from layers below it:**

```
app → pages → widgets → features → entities → shared
```

### Layer Responsibilities

1. **app/** - Global providers and styles; route definitions live in `src/App.tsx`
2. **pages/** - Route-level composition (URL mappings)
3. **widgets/** - Self-contained UI blocks (compositions)
4. **features/** - User actions (verbs)
5. **entities/** - Domain models (nouns)
6. **shared/** - Reusable foundation (no business logic)

## App Structure (admin & client)

```
apps/admin/  (or apps/client/)
├── src/
│   ├── App.tsx             # Route definitions (React Router) + release guards
│   ├── main.tsx            # Entry: initMSW, Providers, app/styles
│   ├── app/
│   │   ├── providers/      # Providers.tsx (QueryProvider, i18n, etc.)
│   │   └── styles/         # index.css (imports @sol/ui/styles)
│   │
│   ├── pages/              # Route components (flat or by domain)
│   │   ├── index.ts        # Public exports
│   │   ├── AgentsPage.tsx
│   │   ├── AgenciesPage.tsx
│   │   ├── AgentDetailPage.tsx
│   │   ├── AgencyDetailPage.tsx
│   │   ├── CreateNewAgentPage.tsx
│   │   ├── CreateNewAgencyPage.tsx
│   │   ├── SuppliersPage.tsx
│   │   ├── SupplierDetailPage.tsx
│   │   ├── DestinationsPage.tsx
│   │   ├── DatabasePage.tsx
│   │   ├── LoginPage.tsx
│   │   └── ...
│   │
│   ├── widgets/            # UI compositions
│   │   ├── main-layout/    # MainLayout (sidebar + content)
│   │   ├── sidebar/        # PageSidebar, MainSidebar
│   │   ├── agent-form/
│   │   ├── agent-list/
│   │   ├── agency-form/
│   │   ├── agency-list/
│   │   ├── supplier-head-office-form/
│   │   └── ...
│   │
│   ├── features/           # User actions (verbs)
│   │   ├── create-agent/
│   │   ├── create-agency/
│   │   ├── create-supplier/
│   │   ├── create-supplier-head-office/
│   │   ├── edit-agent/
│   │   ├── edit-agency/
│   │   ├── edit-supplier/
│   │   ├── delete-agency/
│   │   ├── destination-search/
│   │   ├── supplier-search/
│   │   ├── login/
│   │   └── ...             # api/, model/, ui/, __tests__/ per feature
│   │
│   ├── entities/           # Domain models (nouns)
│   │   ├── agent/
│   │   │   ├── model/      # types.ts, api-types.ts
│   │   │   ├── api/        # useAgents, useAgent, useUpdateAgent, useToggleAgentStatus
│   │   │   └── index.ts    # Public API
│   │   ├── agency/
│   │   ├── destination/
│   │   ├── source-market/
│   │   ├── supplier/
│   │   └── ...
│   │
│   └── shared/             # App-specific reusable code
│       ├── components/     # PublicRoute, ProtectedRoute, Table, etc.
│       ├── ui/             # App-specific components (not in @sol/ui)
│       ├── lib/            # Pure utilities, release-flags, auth-config, constants
│       ├── hooks/          # useDebounce, useMediaQuery, useRouteSync, etc.
│       └── stores/         # Zustand (UI state only)
│           ├── ui-store.ts
│           └── preferences-store.ts
│
├── e2e/                    # Playwright E2E tests
│   ├── tests/              # *.spec.ts
│   ├── fixtures/           # test-setup.ts, shared helpers
│   ├── auth.setup.ts       # Auth setup project
│   └── .auth/              # storageState (user.json)
├── public/
└── playwright.config.ts    # testDir: "./e2e/tests"
```

## Shared Packages

### @sol/ui - Shared UI Components

```
packages/ui/
├── src/
│   ├── components/ui/      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── dialog.tsx
│   ├── lib/utils.ts        # cn() utility
│   └── styles/globals.css  # Tailwind base
└── components.json
```

**Usage:**

```typescript
import { Button, Input, Dialog } from "@sol/ui";
```

### @sol/types - Shared TypeScript Types

```
packages/types/
└── src/
    └── index.ts    # Shared types used by both apps (when applicable)
```

Use for types shared across admin and client. Entities may define types locally in `model/types.ts` (and optionally re-export from `@sol/types` when centralizing).

**Usage:**

```typescript
import type { Property, Itinerary, Quotation } from "@sol/types";
```

### @sol/api-client - API Client + MSW

```
packages/api-client/
├── src/
│   ├── api-client.ts       # Axios instance (api, apiClient, ApiError)
│   ├── providers/
│   │   └── QueryProvider.tsx
│   ├── query-client.ts
│   ├── msw/
│   │   ├── handlers.ts
│   │   ├── controllers/    # agents.ts, agencies.ts, suppliers.ts, etc.
│   │   ├── browser.ts
│   │   └── index.ts
│   ├── error-utils.ts
│   └── index.ts            # Re-exports useQuery, useMutation, useQueryClient from @tanstack/react-query
└── public/mockServiceWorker.js
```

**Usage:**

```typescript
import {
  apiClient,
  QueryProvider,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
```

### @sol/i18n - Internationalization

```
packages/i18n/
├── src/
│   ├── config.ts
│   ├── locales/
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── itinerary.json
│   │   │   └── property.json
│   │   └── es/
│   └── index.ts
```

**Usage:**

```typescript
import { useTranslation } from "react-i18next";
const { t } = useTranslation("property");
```

## Critical Rules

### 1. Layer Import Rules (STRICT)

✅ **ALLOWED:**

```typescript
// pages can import from widgets, features, entities, shared
import { Sidebar } from "@/widgets/sidebar";
import { SearchProperties } from "@/features/search-properties";
import { PropertyCard } from "@/entities/property";
import { Button } from "@sol/ui";

// features can import from entities, shared
import { usePropertyDetail } from "@/entities/property";
import { formatDate } from "@/shared/lib/date";

// entities can import from shared only
import { apiClient } from "@sol/api-client";
import type { Property } from "./model/types"; // or @sol/types when shared
```

❌ **FORBIDDEN:**

```typescript
// shared CANNOT import from entities
import { Property } from "@/entities/property"; // ❌

// entities CANNOT import from features
import { SearchProperties } from "@/features/search-properties"; // ❌

// features CANNOT import from pages
import { ItinerariesPage } from "@/pages/itineraries"; // ❌
```

### 2. Public API Pattern (RECOMMENDED)

Every FSD slice SHOULD have an `index.ts` that serves as its public entry point. Prefer importing from the slice root; deep imports are allowed but the public API is the recommended contract.

```typescript
// entities/agent/index.ts
export {
  useAgents,
  useAgent,
  useToggleAgentStatus,
  useUpdateAgent,
} from "./api/...";
export type { Agent, AgentStatus } from "./model/types";
```

✅ **PREFERRED:**

```typescript
import { useUpdateAgent, type Agent } from "@/entities/agent";
```

✅ **ALLOWED** (when slice has no index or for internal types):

```typescript
import { useToggleAgentStatus } from "@/entities/agent/api/useToggleAgentStatus";
import type { Agent } from "@/entities/agent/model/types";
```

❌ **AVOID** when a public API exists:

```typescript
import { PropertyCard } from "@/entities/property/ui/PropertyCard"; // Prefer @/entities/property
```

### 3. State Management Rules

**TanStack Query** (via `@sol/api-client`) - Server state ONLY:

```typescript
// entities/agent/api/useAgents.ts
import { useQuery } from "@sol/api-client";
import { apiClient } from "@sol/api-client";

export const useAgents = () => {
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => apiClient.get("/agents"),
  });
};
```

**Zustand** - Client UI state ONLY:

```typescript
// shared/stores/ui-store.ts
import { create } from "zustand";

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    })),
}));

// features/build-itinerary/model/builderStore.ts
export const useItineraryBuilderStore = create<BuilderStore>((set) => ({
  selectedDayId: null,
  selectDay: (id) => set({ selectedDayId: id }),
}));
```

**NEVER** use Zustand for server data - use TanStack Query.

### 4. Type Usage Rules

Entity types live in `entities/{entity}/model/types.ts` (and optionally `api-types.ts`). Use `@sol/types` only for types shared across both apps.

```typescript
// entities/agent/model/types.ts — entity-local types
export type AgentStatus = "Active" | "Inactive";

export interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  agencyId: string;
  // ...
}

// Optional: re-export shared types when centralizing in @sol/types
// export type { Agent } from '@sol/types';
```

### 5. Internationalization Rules

All user-facing text MUST use i18next:

```typescript
// ✅ GOOD
const { t } = useTranslation('property');
<Button>{t('search.submit')}</Button>

// ❌ BAD
<Button>Search</Button>
```

Translation files organized by namespace in `@sol/i18n/locales/{lang}/`.

### 6. Release Flags

Feature visibility by environment is controlled via `shared/lib/release-flags.ts`: `isReleaseEnabled(releaseId)`, `ReleaseId`, `DeployEnv`. Use in `App.tsx` (e.g. `ReleaseGuard`) to hide routes or UI for features not yet integrated in staging/production.

### 7. Component Import Rules

**From shared packages:**

```typescript
import { Button, Input } from "@sol/ui";
import type { Property } from "@sol/types";
import { apiClient } from "@sol/api-client";
import { useTranslation } from "react-i18next";
```

**From app layers:**

```typescript
import { useUpdateAgent, type Agent } from "@/entities/agent";
import { CreateNewAgentModal } from "@/features/create-agent";
import { MainLayout } from "@/widgets/main-layout";
```

### 8. Naming Conventions

**Files:**

- Components: `PascalCase.tsx` (e.g., `PropertyCard.tsx`)
- Hooks: `camelCase.ts` (e.g., `usePropertyDetail.ts`)
- Stores: `camelCase.ts` with suffix (e.g., `ui-store.ts`)
- Utils: `camelCase.ts` (e.g., `formatDate.ts`)

**Directories:**

- Features/Entities: `kebab-case` (e.g., `search-properties/`)
- Widgets: `kebab-case` (e.g., `itinerary-builder/`)

**Commits:**

```
<type>(<scope>): <description>

feat(client): add property search feature
fix(admin): correct agent validation
refactor(ui): extract button variants
docs: update architecture guide
```

## Decision Tree

**"Where should this code go?"**

```
Is it a shared UI component?
├─> Yes → packages/ui/

Is it a TypeScript type used by both apps?
├─> Yes → packages/types/

Is it API-related (client, endpoints, MSW)?
├─> Yes → packages/api-client/

Is it a translation?
├─> Yes → packages/i18n/

Is it generic utility with no business logic?
├─> Yes → apps/{app}/src/shared/

Is it UI state (sidebar, modals, preferences)?
├─> Yes → apps/{app}/src/shared/stores/

Is it feature visibility by environment (release flags)?
├─> Yes → apps/{app}/src/shared/lib/release-flags.ts

Is it a business domain concept (noun)?
├─> Yes → apps/{app}/src/entities/

Is it a user action/workflow (verb)?
├─> Yes → apps/{app}/src/features/
│   ├─> Needs API calls? → Create api/ folder with TanStack Query hooks
│   ├─> Needs form/state? → Create model/ folder with business logic hooks
│   ├─> Needs UI? → Create ui/ folder with React components
│   └─> Write tests? → Create __tests__/ folder

Is it a complex UI composition?
├─> Yes → apps/{app}/src/widgets/

Is it a full page route?
├─> Yes → apps/{app}/src/pages/
```

## Examples

### Entity Example

```typescript
// entities/agent/api/useAgent.ts
import { useQuery } from "@sol/api-client";
import { apiClient } from "@sol/api-client";
import type { Agent } from "./model/types";

export const useAgent = (id: string) => {
  return useQuery({
    queryKey: ["agents", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Agent>(`/agents/${id}`);
      return data;
    },
    enabled: !!id,
  });
};
```

### Feature Structure

Features follow a consistent structure with three main layers:

```
features/feature-name/
├── api/              # API hooks (TanStack Query) - OPTIONAL
│   └── useFeatureAction.ts
├── model/            # Business logic hooks - REQUIRED
│   └── useFeatureForm.ts (or useFeatureLogic.ts)
├── ui/               # React components - REQUIRED
│   └── FeatureComponent.tsx
├── __tests__/        # Tests - OPTIONAL but recommended
│   ├── FeatureComponent.test.tsx
│   └── useFeatureForm.test.ts
└── index.ts          # Public exports - OPTIONAL
```

**Layer Responsibilities:**

1. **`api/`** - API integration hooks using TanStack Query
   - Contains `useMutation` or `useQuery` hooks
   - Handles API calls, error handling, cache invalidation
   - Example: `useCreateDestination`, `useUpdateDestination`
   - **Optional**: Only needed if feature requires API calls

2. **`model/`** - Business logic, form state, validation, search logic
   - Contains custom hooks for business logic
   - Form state management, validation rules
   - Search/filter logic, data transformations
   - Example: `useCreateDestinationForm`, `useEditDestination`, `useDestinationSearch`
   - **Required**: Every feature should have business logic

3. **`ui/`** - React components (presentation layer)
   - Contains React components using shadcn/ui
   - Receives props, calls hooks from `model/` and `api/`
   - Handles user interactions, displays data
   - Example: `CreateDestinationModal`, `EditDestinationModal`, `DestinationSearchInput`
   - **Required**: Every feature needs UI components

4. **`__tests__/`** - Unit and integration tests
   - Test files mirror the structure (`.test.ts`, `.test.tsx`)
   - Test both UI components and business logic hooks
   - **Optional but recommended**: Write tests for critical features

### Feature Example - With API

```typescript
// features/edit-destination/api/useUpdateDestination.ts
import { useMutation, useQueryClient } from "@sol/api-client";
import { apiClient } from "@sol/api-client";

export function useUpdateDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDestinationDto }) => {
      const { data: result } = await apiClient.put(`/destinations/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
    },
  });
}

// features/edit-destination/model/useEditDestination.ts
import { useState, useEffect, useRef } from "react";
import type { Destination, DestinationType } from "@/entities/destination/model/types";

export interface EditDestinationFormData {
  name: string;
  type: DestinationType;
  iataCode: string;
  destinationCode: string;
  latitude: string;
  longitude: string;
}

export function useEditDestination(destination: Destination | null) {
  const [formData, setFormData] = useState<EditDestinationFormData>(() =>
    getInitialFormData(destination)
  );
  const [errors, setErrors] = useState<EditDestinationFormErrors>({});

  const updateField = (field: keyof EditDestinationFormData, value: string | DestinationType) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
  };

  const validate = (): boolean => {
    const newErrors: EditDestinationFormErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    // ... more validation
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getSubmitData = (parentId: string) => {
    return {
      parentId,
      name: formData.name.trim(),
      type: formData.type,
      code: formData.type === "Airport" ? formData.iataCode : formData.destinationCode,
      // ... coordinates
    };
  };

  return { formData, errors, updateField, validate, getSubmitData };
}

// features/edit-destination/ui/EditDestinationModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Button } from "@sol/ui";
import { useEditDestination } from "../model/useEditDestination";
import { useUpdateDestination } from "../api/useUpdateDestination";

export function EditDestinationModal({ destination, destinations, open, onOpenChange }) {
  const { formData, errors, updateField, validate, getSubmitData } = useEditDestination(destination);
  const { mutate: updateDestination, isPending } = useUpdateDestination();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !destination) return;

    const submitData = getSubmitData(destination.parentId);
    updateDestination({ id: destination.id, data: submitData }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Destination</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            aria-invalid={!!errors.name}
          />
          {/* ... more fields */}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Feature Example - Without API (Search/Filter)

```typescript
// features/destination-search/model/useDestinationSearch.ts
import { useMemo, useState } from "react";
import type { Destination } from "@/entities/destination/model/types";

export function useDestinationSearch(destinations: Destination[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return destinations;

    const query = searchQuery.toLowerCase().trim();
    // ... filtering logic
    return filtered;
  }, [destinations, searchQuery]);

  return { searchQuery, setSearchQuery, filteredDestinations, hasResults: filteredDestinations.length > 0 };
}

// features/destination-search/ui/DestinationSearchInput.tsx
import { Input } from "@sol/ui";
import { useDestinationSearch } from "../model/useDestinationSearch";

export function DestinationSearchInput({ destinations, onResultsChange }) {
  const { searchQuery, setSearchQuery, filteredDestinations } = useDestinationSearch(destinations);

  useEffect(() => {
    onResultsChange?.(filteredDestinations);
  }, [filteredDestinations, onResultsChange]);

  return (
    <Input
      placeholder="Search destinations..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  );
}
```

### Feature Structure Best Practices

**When creating a new feature, follow this checklist:**

1. **Determine if you need `api/` folder:**
   - ✅ Need to fetch data from server? → Create `api/` with `useQuery` hooks
   - ✅ Need to mutate data? → Create `api/` with `useMutation` hooks
   - ❌ Only client-side logic (search, filter, form)? → Skip `api/` folder

2. **Always create `model/` folder:**
   - Contains business logic hooks (form state, validation, search logic)
   - Export interfaces/types used by the feature
   - Keep UI components clean by moving logic to `model/`

3. **Always create `ui/` folder:**
   - Contains React components
   - Uses shadcn/ui components from `@sol/ui`
   - Imports hooks from `model/` and `api/` folders

4. **Add `__tests__/` folder:**
   - Write tests for business logic in `model/` hooks
   - Write tests for UI components
   - Test files mirror the structure: `*.test.ts` for hooks, `*.test.tsx` for components

5. **Optional `index.ts`:**
   - Use if you want to expose a public API for the feature
   - Re-export only what other layers should use

**Example Feature Structure:**

```
features/edit-destination/
├── api/
│   └── useUpdateDestination.ts      # TanStack Query mutation
├── model/
│   └── useEditDestination.ts        # Form state, validation, data transformation
├── ui/
│   └── EditDestinationModal.tsx     # React component
└── __tests__/
    ├── EditDestinationModal.test.tsx
    └── useEditDestination.test.ts
```

**Naming Conventions:**

- API hooks: `use[Action][Entity]` (e.g., `useCreateDestination`, `useUpdateDestination`)
- Model hooks: `use[Entity][Purpose]` (e.g., `useEditDestination`, `useCreateDestinationForm`)
- UI components: `[Entity][Action]Modal` or `[Entity][Component]` (e.g., `EditDestinationModal`, `DestinationSearchInput`)

### Widget Example

```typescript
// widgets/sidebar/ui/PageSidebar.tsx
import { useUIStore } from '@/shared/stores/ui-store';

export const PageSidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  // Compose features/entities as needed
  return (
    <aside className={sidebarCollapsed ? 'w-16' : 'w-64'}>
      <button onClick={toggleSidebar}>Toggle</button>
      {/* ... nav items ... */}
    </aside>
  );
};
```

### Page Example

```typescript
// pages/AgentDetailPage.tsx
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAgent } from '@/entities/agent';
import { MainLayout } from '@/widgets/main-layout';
import { AgentForm } from '@/widgets/agent-form';

export const AgentDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data: agent, isLoading } = useAgent(id!);

  if (isLoading) return <div>{t('loading')}</div>;
  if (!agent) return null;

  return (
    <MainLayout>
      <AgentForm agent={agent} />
    </MainLayout>
  );
};
```

## Common Mistakes to Avoid

❌ **Don't** put business logic in shared:

```typescript
// shared/lib/property-utils.ts ❌
export const calculatePropertyPrice = (property: Property) => { ... }
// This belongs in entities/property/lib/
```

❌ **Don't** use Zustand for server data:

```typescript
// ❌ BAD
const usePropertyStore = create((set) => ({
  properties: [],
  fetchProperties: async () => { ... }
}));

// ✅ GOOD - Use TanStack Query
export const useProperties = () => {
  return useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.get('/properties'),
  });
};
```

❌ **Don't** skip the Public API when it exists:

```typescript
// ❌ PREFER slice index when available
import { PropertyCard } from "@/entities/property/ui/PropertyCard";

// ✅ GOOD
import { PropertyCard } from "@/entities/property";
```

❌ **Don't** hardcode text:

```typescript
// ❌ BAD
<Button>Search Properties</Button>

// ✅ GOOD
const { t } = useTranslation('property');
<Button>{t('search.submit')}</Button>
```

## Testing Rules

**Unit/Integration tests** (Vitest + @testing-library/react):

- Place tests in `__tests__/` at the feature, widget, or entity root (see `.cursor/rules/testing-strategy.mdc`).
- Naming: `*.test.ts` for hooks/utils, `*.test.tsx` for components.

**E2E tests** (Playwright) go in `apps/{app}/e2e/`:

- Test files: `e2e/tests/*.spec.ts`
- Fixtures: `e2e/fixtures/` (e.g. `test-setup.ts` for viewport/auth helpers)
- Auth: `e2e/auth.setup.ts` and `e2e/.auth/user.json` for authenticated runs
- Page Object Model is optional; tests may use the `page` fixture and fixtures directly. Avoid `page.waitForTimeout`; use Playwright assertions and waiting APIs instead.

## Summary

This architecture ensures:
✅ Clear separation of concerns
✅ Predictable import relationships
✅ Reusable code through shared packages
✅ Type safety with entity and shared types
✅ Consistent API handling with @sol/api-client
✅ Internationalization support
✅ Release flags for environment-based feature visibility
✅ Maintainable codebase as it scales
