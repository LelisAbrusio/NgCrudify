import { beforeAll, afterAll } from '@jest/globals';

// Angular testing env
import 'zone.js';
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

beforeAll(() => {
  getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
  );
});

afterAll(() => {
  try { getTestBed().resetTestEnvironment(); } catch {}
});

// --- Mocks/polyfills used in your app ---

// localStorage (for SSR-safe store usage)
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { store = {}; },
    } as Storage;
  })(),
});

// IntersectionObserver (for your infinite scroll directive)
class IO { observe(){} unobserve(){} disconnect(){} }
(Object.defineProperty as any)(window, 'IntersectionObserver', {
  configurable: true, writable: true, value: IO,
});
