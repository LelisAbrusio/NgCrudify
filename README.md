NgCrudify — Angular 17+ CRUD with Signals, Jest & SSR

A practical frontend test project built with Angular 17/18, Signals state management, standalone components + lazy routes, Angular Material, Jest unit tests, and optional SSR/prerender.
The app consumes the public Rick and Morty API and implements full CRUD UX (create/edit/delete simulated locally) with list, search, detail, pagination/infinite scroll, and nice, component-scoped styles.

✨ Features

Angular 17+ / Standalone: no NgModules, lazy routes/components.

Signals for State: a simple CharactersStore managing list/filters/pagination.

HTTP & Caching: ApiService for list/detail with local augmentation.

CRUD UX:

List with search (debounced) + infinite scroll (keeps earlier cards).

Detail page and modal mode (closes on overlay click).

Create/Edit/Delete simulated locally (API is read-only).

Styling: per-component .scss files with a clean, responsive layout.

Unit tests with Jest: components, store, routes, configs, directive, models, and services.

SSR-ready: server config + safe guards for browser-only APIs (e.g., IntersectionObserver, localStorage).

🧱 Tech Stack

Angular 17/18 (standalone components, signals, forms, router)

Angular Material (buttons, inputs, cards, spinner)

Jest (+ jest-preset-angular, ts-jest) for unit tests & coverage

SSR via @angular/ssr (optional prerender)

API: https://rickandmortyapi.com/

📦 Getting Started
Prerequisites

Node.js 18+ (LTS recommended)

pnpm or npm

Install
# using npm
npm install
# or pnpm
pnpm install

Run (Dev)
npm run start
# opens at http://localhost:4200

Build (SPA)
npm run build

Tests
npm test             # run once
npm run test:watch   # watch mode
npm run test:cov     # full coverage report (HTML under /coverage)

Lint & Format
npm run lint
npm run format

SSR / Prerender (optional)
# build server bundle and prerender
npm run build:ssr
# run the server
npm run serve:ssr

📁 Project Structure (high level)
src/
  app/
    app.ts                    # Root standalone component
    app.html / app.scss       # Root template & styles
    app.routes.ts             # Client routes (lazy loads characters feature)
    app.config.ts             # ApplicationConfig (providers, HttpClient, router)
    app.config.server.ts      # Server-side ApplicationConfig
    app.routes.server.ts      # Server routes (RenderMode.Prerender)

    core/
      models/
        character.model.ts
      services/
        api.service.ts

    features/
      characters/
        characters.routes.ts
        list/characters-list.component.{ts,html,scss}
        detail/character-detail.component.{ts,html,scss}
        form/character-form.component.{ts,html,scss}
        state/characters.store.ts

    shared/
      directives/infinite-scroll.directive.ts
      ui/card/character-card.component.{ts,html,scss}

  styles.scss                 # global styles (if any)

🔌 API Behavior & Local CRUD

The Rick & Morty API is read-only. To still satisfy CRUD:

Create/Edit/Delete are persisted locally in CharactersStore.

The store merges local entities with API results and de-duplicates by id.

On refresh, local changes are rehydrated (e.g., via localStorage if enabled; guarded to avoid SSR errors).

🧠 State (Signals)

CharactersStore exposes signals such as:

characters() — current, de-duplicated list.

page(), totalPages(), q() — pagination and query.

status() — 'idle' | 'loading' | 'error'.

And actions:

setQuery, setPage, setLoading, setError, hydrateFromApi, upsertLocal, deleteLocal, findById.

🔎 Search & Infinite Scroll

Search uses FormControl + debounceTime(300) to update q and reload from page 1.

InfiniteScrollDirective uses IntersectionObserver when available; otherwise falls back to scroll/resize with requestAnimationFrame (or setTimeout shim).
It is SSR-safe: guards against document.defaultView, window, IntersectionObserver, etc.

🧪 Testing

What’s covered (90%+ typical coverage):

characters-list.component — init loading, search debounce, loadMore append (keeps old), error path.

character-detail.component — dialog vs routed mode, store vs API fallback, close/remove flows.

character-form.component — create/edit, validation, keyboard shortcuts, image preview.

characters.store — signals logic, pagination, merging & dedupe, local CRUD.

infinite-scroll.directive — IO path, fallback path, SSR/server path, globalThis and requestAnimationFrame branches.

Config & routes — app.config(.server), app.routes(.server), characters routes lazy load.

Models — compile-time shape checks + runtime sanity for PagedResponse<T> generics.

api.service — URL building and integration with HttpClient via HttpClientTestingModule.

Running coverage & viewing report
npm run test:cov
# then open coverage/index.html in your browser


If the HTML shows “empty”, ensure tests finished successfully and no prior browser tab is caching the report. Delete /coverage and re-run if needed.

🎨 UI & UX

Clean cards grid, responsive breakpoints, per-component SCSS.

Detail screen behaves as a centered popup (modal-like), closes by clicking outside.

Form has clear field grouping, validation hints, and primary/secondary actions.

Buttons preserved on the detail screen: Edit (navigates to /characters/:id/edit) and Delete.

♿ Accessibility

Semantic headings and labels.

Color-contrast mindful defaults.

Focus outlines preserved; dialogs close on overlay click + Escape (when applicable).

⚙️ Environment & Troubleshooting

Node mismatch can break Jest or Angular builder; use Node 18+ (LTS).

If Jest complains about parsing Angular HTML templates:

Ensure jest-preset-angular is installed and configured.

Make sure transformIgnorePatterns and mappings for html|scss are set so they aren’t transformed by Babel.

SSR errors like IntersectionObserver is not defined or localStorage is not defined:

The code guards these with platform checks. If you add new browser APIs, wrap them with isPlatformBrowser(...) guards.

🚀 Deployment

SPA build: dist/ can be hosted on any static host (Netlify, Vercel static, S3, etc.).

SSR/prerender: use npm run build:ssr and serve with npm run serve:ssr (Node server).

📝 Scripts (quick reference)
{
  "start": "ng serve",
  "build": "ng build",
  "build:ssr": "ng run ng-crudify:build:ssr && ng run ng-crudify:prerender",
  "serve:ssr": "node dist/ng-crudify/server/server.mjs",
  "test": "jest --runInBand",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "lint": "ng lint",
  "format": "prettier --write \"src/**/*.{ts,html,scss}\""
}

📚 Notes

This repo intentionally demonstrates Signals + standalone + SSR-safe patterns.

The infinite scroll was implemented so that older cards remain while new pages append (deduped by id).

The test suite includes branches for edge conditions (e.g., document.defaultView null, missing requestAnimationFrame) to keep coverage high and prevent regressions.

📄 License

MIT — do whatever you like; attribution appreciated.