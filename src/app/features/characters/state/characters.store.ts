// src/app/features/characters/state/characters.store.ts
import { Injectable, computed, effect, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { Character, PagedResponse } from '../../../core/models/character.model';

@Injectable({ providedIn: 'root' })
export class CharactersStore {
  private readonly STORAGE_KEY = 'rm-crud-characters-overrides';
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // estado
  characters = signal<Character[]>([]);
  page = signal(1);
  pages = signal(1);
  query = signal('');
  status = signal<'idle' | 'loading' | 'error'>('idle');
  selected = signal<Character | null>(null);

  // CRUD local overlay
  private overrides = signal<Record<number, Character | null>>({}); // null = deletado

  filtered = computed(() => this.characters().map(c => this.applyOverride(c)).filter(Boolean) as Character[]);
  totalPages = computed(() => this.pages());
  q = computed(() => this.query());

  constructor() {
    // ✅ Só tenta ler/gravar storage no browser
    if (this.isBrowser) {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) this.overrides.set(JSON.parse(raw));
      } catch { /* ignora */ }

      effect(() => {
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.overrides()));
        } catch { /* ignora quota/privado */ }
      });
    }
  }

  hydrateFromApi(pageData: PagedResponse<Character>) {
    this.pages.set(pageData.info.pages);
    //this.characters.set(pageData.results);
    this.status.set('idle');
  }

  setLoading() { this.status.set('loading'); }
  setError() { this.status.set('error'); }
  setPage(p: number) { this.page.set(p); }
  setQuery(q: string) { this.query.set(q); }
  select(c: Character | null) { this.selected.set(c); }

  // CRUD local (funciona em ambos; só não persiste no server)
  createLocal(data: Omit<Character,'id'>) {
    const id = this.genId();
    const newChar: Character = { id, ...data };
    this.overrides.update(o => ({ ...o, [id]: newChar }));
    this.characters.update(list => [newChar, ...list]);
    return newChar;
  }
  updateLocal(id: number, patch: Partial<Character>) {
    const current = this.findById(id);
    if (!current) return;
    const updated = { ...current, ...patch };
    this.overrides.update(o => ({ ...o, [id]: updated }));
    this.characters.update(list => list.map(c => c.id === id ? updated : c));
    if (this.selected()?.id === id) this.selected.set(updated);
  }
  deleteLocal(id: number) {
    this.overrides.update(o => ({ ...o, [id]: null }));
    this.characters.update(list => list.filter(c => c.id !== id));
    if (this.selected()?.id === id) this.selected.set(null);
  }

  findById(id: number) {
    const c = this.characters().find(c => c.id === id);
    return c ? this.applyOverride(c) : this.overrides()[id] ?? null;
  }

  private applyOverride(c: Character): Character | null {
    const over = this.overrides()[c.id];
    if (over === null) return null;
    return over ?? c;
  }

  private genId(): number {
    const allIds = [
      ...this.characters().map(c => c.id),
      ...Object.keys(this.overrides()).map(Number)
    ];
    return (allIds.length ? Math.max(...allIds) : 0) + 1;
  }
}
