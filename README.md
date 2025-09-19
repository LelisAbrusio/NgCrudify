# NgCrudify — Angular 17+ CRUD with Signals, Jest & SSR

A practical frontend test project built with **Angular 17/18**, **Signals** state, **standalone components** + lazy routes, **Angular Material**, **Jest** tests, and optional **SSR/prerender**.
It consumes the public **Rick and Morty API** and implements full CRUD UX (create/edit/delete simulated locally) with list, search, detail, pagination/infinite scroll, and component-scoped styles.

## ✨ Features

* **Angular 17+ / Standalone** (no NgModules)
* **Signals** store for list, filters, pagination
* **HTTP & caching** via `ApiService`
* **CRUD UX** (create/edit/delete simulated locally)

  * List with debounced search + infinite scroll (keeps earlier cards)
  * Detail page and modal mode (close by clicking overlay)
* **Styling**: per-component `.scss` with responsive layout
* **Unit tests** (Jest): components, store, routes, configs, directive, models, services
* **SSR-ready** with guards for browser-only APIs (e.g. `IntersectionObserver`, `localStorage`)

## 🧱 Tech Stack

* Angular 17/18 (standalone, signals, router, forms)
* Angular Material
* Jest (+ `jest-preset-angular`, `ts-jest`)
* SSR via `@angular/ssr` (optional)
* API: [https://rickandmortyapi.com/](https://rickandmortyapi.com/)

## 📦 Getting Started

### Prerequisites

* Node.js 18+ (LTS recommended)
* `npm` or `pnpm`

### Install

```bash
# npm
npm install
# or pnpm
pnpm install
```

### Run (Dev)

```bash
npm run start
# http://localhost:4200
```

### Build (SPA)

```bash
npm run build
```

### Tests

```bash
npm test             # run once
npm run test:watch   # watch mode
npm run test:cov     # coverage (HTML in /coverage)
```

### Lint & Format

```bash
npm run lint
npm run format
```

### SSR / Prerender (optional)

```bash
# build server bundle & prerender
npm run build:ssr
# run the server
npm run serve:ssr
```

## 📁 Project Structure (high level)

```
src/
  app/
    app.ts
    app.html / app.scss
    app.routes.ts
    app.config.ts
    app.config.server.ts
    app.routes.server.ts

    core/
      models/character.model.ts
      services/api.service.ts

    features/characters/
      characters.routes.ts
      list/characters-list.component.{ts,html,scss}
      detail/character-detail.component.{ts,html,scss}
      form/character-form.component.{ts,html,scss}
      state/characters.store.ts

    shared/
      directives/infinite-scroll.directive.ts
      ui/card/character-card.component.{ts,html,scss}

  styles.scss
```

## 🔌 API Behavior & Local CRUD

The Rick & Morty API is **read-only**. To support CRUD UX:

* Create/Edit/Delete are persisted **locally** in `CharactersStore`.
* The store merges local entities with API results and **de-duplicates by `id`**.
* On refresh, local changes can be rehydrated (e.g. via `localStorage`, guarded for SSR).

## 🧠 State (Signals)

**Signals exposed**

* `characters()` — current de-duplicated list
* `page()`, `totalPages()`, `q()` — pagination & query
* `status()` — `'idle' | 'loading' | 'error'`

**Actions**

* `setQuery`, `setPage`, `setLoading`, `setError`
* `hydrateFromApi`, `upsertLocal`, `deleteLocal`, `findById`

## 🔎 Search & Infinite Scroll

* Search uses `FormControl` + `debounceTime(300)`; resets to page 1 on query change.
* `InfiniteScrollDirective` uses `IntersectionObserver` when available; otherwise falls back to scroll/resize with `requestAnimationFrame` (or a `setTimeout` shim).
* SSR-safe: guards around `document.defaultView`, `window`, `IntersectionObserver`, etc.

## 🧪 Testing

**Coverage highlights**

* `characters-list.component`: init, search debounce, `loadMore` append (keeps old), error path
* `character-detail.component`: dialog vs routed, store vs API fallback, close/remove
* `character-form.component`: create/edit, validation, keyboard shortcuts, image preview
* `characters.store`: signals logic, pagination, merge & dedupe, local CRUD
* `infinite-scroll.directive`: IO path, fallback path, SSR/server path, `globalThis` & `rAF` branches
* Config & routes: `app.config(.server)`, `app.routes(.server)`, feature lazy routes
* Models: compile-time shape checks + runtime sanity for `PagedResponse<T>`
* `api.service`: URL building with `HttpClientTestingModule`

**Coverage report**

```bash
npm run test:cov
# then open coverage/index.html
```

If the HTML looks empty, ensure tests succeeded and your browser isn’t caching an old report. Delete `/coverage` and re-run if needed.

## 🎨 UI & UX

* Clean cards grid, responsive breakpoints, component-scoped SCSS
* Detail screen as centered popup (close on overlay click)
* Form with clear grouping, validation hints, primary/secondary actions
* Detail screen buttons: **Edit** (`/characters/:id/edit`) and **Delete**

## ♿ Accessibility

* Semantic headings & labels
* Contrast-friendly defaults
* Focus outlines preserved; dialogs close on overlay click + Escape (when applicable)

## ⚙️ Troubleshooting

* Use **Node 18+** to avoid Jest/Angular build issues.
* If Jest tries to parse Angular **HTML templates**:

  * Ensure `jest-preset-angular` is installed & configured.
  * Exclude `html|scss` from transforms (`transformIgnorePatterns` / mappers).
* SSR errors like **`IntersectionObserver is not defined`** or **`localStorage is not defined`**:

  * Code already guards for platform; wrap any new browser APIs with `isPlatformBrowser(...)`.

## 🚀 Deployment

* **SPA**: host `dist/` on Netlify, Vercel static, S3, etc.
* **SSR/Prerender**: `npm run build:ssr` then `npm run serve:ssr` (Node server).

## 📝 Scripts (quick reference)

```json
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
```

## 📚 Notes

* Demonstrates **Signals + Standalone + SSR-safe** patterns.
* Infinite scroll **keeps existing cards** while appending new, deduped by `id`.
* Tests include edge branches (`document.defaultView` null, missing `requestAnimationFrame`) to prevent regressions.

## 📄 License

MIT — attribution appreciated.
