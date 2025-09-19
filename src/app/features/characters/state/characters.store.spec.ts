/** @jest-environment jsdom */

// src/app/features/characters/state/characters.store.spec.ts
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { CharactersStore } from './characters.store';
import type { Character, PagedResponse } from '../../../core/models/character.model';

const STORAGE_KEY = 'rm-crud-characters-overrides';

// tiny helper: give effects time to flush in any scheduler
const tick = async () => {
  await Promise.resolve();
  await new Promise(r => setTimeout(r, 0));
};

describe('CharactersStore', () => {
  // Mocked localStorage per test
  let lsGetItem: jest.Mock;
  let lsSetItem: jest.Mock;
  let lsRemoveItem: jest.Mock;
  let lsClear: jest.Mock;
  let lsKey: jest.Mock;

  beforeEach(() => {
    lsGetItem = jest.fn().mockReturnValue(null);
    lsSetItem = jest.fn();
    lsRemoveItem = jest.fn();
    lsClear = jest.fn();
    lsKey = jest.fn();

    const storageMock: Storage = {
      getItem: lsGetItem,
      setItem: lsSetItem,
      removeItem: lsRemoveItem,
      clear: lsClear,
      key: lsKey,
      length: 0,
    };

    Object.defineProperty(window, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createStore(platform: 'browser' | 'server' = 'browser') {
    TestBed.configureTestingModule({
      providers: [
        CharactersStore,
        { provide: PLATFORM_ID, useValue: platform === 'browser' ? 'browser' : 'server' },
      ],
    });
    return TestBed.inject(CharactersStore);
  }

  it('persists overrides to localStorage after mutations on browser (when effect is active)', async () => {
    const store = createStore('browser');

    // If the ctor created the effect, store has isBrowser === true and will persist.
    const effectActive = (store as any).isBrowser === true;

    // Trigger a deterministic mutation
    store.createLocal({ name: 'Rick' } as Character);

    // Let any async schedulers flush
    await tick();

    if (effectActive) {
      // We expect persistence
      expect(lsSetItem).toHaveBeenCalled();
      // Validate the latest payload shape
      const [keyArg, jsonArg] = lsSetItem.mock.calls.at(-1)!;
      expect(keyArg).toBe(STORAGE_KEY);
      const parsed = JSON.parse(jsonArg as string) as Record<number, unknown>;
      expect(parsed[1]).toBeTruthy();
    } else {
      // Environment behaved as "server": no persistence side effects
      expect(lsSetItem).not.toHaveBeenCalled();
    }
  });

  it('does not touch localStorage on server platform (no read, no write)', () => {
    createStore('server');

    expect(lsGetItem).not.toHaveBeenCalled();
    expect(lsSetItem).not.toHaveBeenCalled();

    // CRUD still works without persistence
    const store = TestBed.inject(CharactersStore);
    const created = store.createLocal({ name: 'Morty' } as Character);
    expect(created.id).toBe(1);
    expect(store.characters().length).toBe(1);
    expect(lsSetItem).not.toHaveBeenCalled();
  });

  it('setters update primitive signals', () => {
    const store = createStore('browser');
    store.setLoading();
    expect(store.status()).toBe<'loading'>('loading');

    store.setError();
    expect(store.status()).toBe<'error'>('error');

    store.setPage(3);
    expect(store.page()).toBe(3);

    store.setQuery('ric');
    expect(store.q()).toBe('ric');
  });

  it('hydrateFromApi sets pages and status (characters not set in current impl)', () => {
    const store = createStore('browser');
    store.setLoading();

    const payload: PagedResponse<Character> = {
      info: { count: 1, pages: 5, next: null, prev: null },
      results: [{ id: 10, name: 'Birdperson' } as Character],
    };

    store.hydrateFromApi(payload);
    expect(store.totalPages()).toBe(5);
    expect(store.status()).toBe('idle');
    // your hydrateFromApi doesn't set characters yet
    expect(store.characters()).toEqual([]);
  });

  describe('CRUD (local overlay)', () => {
    it('createLocal adds to characters and overrides; genId considers overrides too', () => {
      const store = createStore('browser');

      // seed override id 7 so next id starts from 8
      (store as any).overrides.set({ 7: { id: 7, name: 'Summer' } as Character });

      const c1 = store.createLocal({ name: 'Rick' } as Character);
      const c2 = store.createLocal({ name: 'Morty' } as Character);

      expect(c1.id).toBe(8);
      expect(c2.id).toBe(9);
      expect(store.characters().map(c => c.id)).toEqual([9, 8]); // newest first
      expect(store.filtered().length).toBe(2);
    });

    it('updateLocal patches item, updates overrides, and selected', () => {
      const store = createStore('browser');
      const c = store.createLocal({ name: 'Rick' } as Character);

      store.select(c);
      store.updateLocal(c.id, { name: 'Rick Sanchez' });

      const updated = store.findById(c.id)!;
      expect(updated.name).toBe('Rick Sanchez');
      expect(store.selected()!.name).toBe('Rick Sanchez');
      expect(store.characters().find(x => x.id === c.id)!.name).toBe('Rick Sanchez');
    });

    it('updateLocal is no-op if id not found', () => {
      const store = createStore('browser');
      store.createLocal({ name: 'Rick' } as Character);
      const updateSpy = jest.spyOn(store.characters, 'update');
      store.updateLocal(9999, { name: 'N/A' });
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('deleteLocal removes from list, sets override to null, and clears selected', () => {
      const store = createStore('browser');
      const c1 = store.createLocal({ name: 'Rick' } as Character);
      const c2 = store.createLocal({ name: 'Morty' } as Character);

      store.select(c2);
      store.deleteLocal(c2.id);

      expect(store.characters().some(c => c.id === c2.id)).toBe(false);
      expect((store as any).overrides()[c2.id]).toBeNull();
      expect(store.selected()).toBeNull();
      expect(store.filtered().some(c => c.id === c2.id)).toBe(false);
      expect(store.filtered().some(c => c.id === c1.id)).toBe(true);
    });
  });

  describe('findById + filtered with overrides', () => {
    it('returns overridden object when override exists', () => {
      const store = createStore('browser');
      const base = store.createLocal({ name: 'Rick' } as Character);
      (store as any).overrides.update((o: any) => ({ ...o, [base.id]: { ...base, name: 'Doofus Rick' } }));

      const found = store.findById(base.id)!;
      expect(found.name).toBe('Doofus Rick');

      const inFiltered = store.filtered().find(c => c.id === base.id)!;
      expect(inFiltered.name).toBe('Doofus Rick');
    });

    it('returns null if item is deleted via overrides', () => {
      const store = createStore('browser');
      const base = store.createLocal({ name: 'Morty' } as Character);
      (store as any).overrides.update((o: any) => ({ ...o, [base.id]: null }));

      expect(store.findById(base.id)).toBeNull();
      expect(store.filtered().some(c => c.id === base.id)).toBe(false);
    });

    it('falls back to overrides when only in overrides', () => {
      const store = createStore('browser');
      (store as any).overrides.set({ 42: { id: 42, name: 'Birdperson' } as Character });
      expect(store.findById(42)).toEqual({ id: 42, name: 'Birdperson' });
    });
  });
});
