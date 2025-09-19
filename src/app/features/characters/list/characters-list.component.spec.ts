import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { Observable, of, throwError } from 'rxjs';

import { CharactersListComponent } from './characters-list.component';
import { ApiService } from '../../../core/services/api.service';
import { CharactersStore } from '../state/characters.store';

// --- Types used in the list ---
type Status = 'Alive' | 'Dead' | 'unknown';
type Character = { id: number; name: string; status: Status; species: string; image: string };
type ApiListResponse = { info?: { pages?: number }, results: Character[] };

// --- ApiService mock (typed correctly) ---
class ApiServiceMock {
  listCharacters = jest.fn<Observable<ApiListResponse>, [number, string]>();
}

// --- Lightweight in-memory Store mock matching component usage ---
class CharactersStoreMock {
  private _page = 1;
  private _q = '';
  private _status: 'idle' | 'loading' | 'error' = 'idle';
  private _totalPages = 1;
  private _characters: Character[] = [];

  // signals-like API used by the component template/logic
  characters = {
    set: (arr: Character[]) => { this._characters = arr; },
    update: (fn: (old: Character[]) => Character[]) => { this._characters = fn(this._characters); },
  };

  // called by template
  filtered = () => {
    const q = this._q.trim().toLowerCase();
    if (!q) return this._characters;
    return this._characters.filter(c =>
      c.name.toLowerCase().includes(q) || c.species.toLowerCase().includes(q)
    );
  };

  // getters used in component
  page = () => this._page;
  q = () => this._q;
  status = () => this._status;
  totalPages = () => this._totalPages;

  // setters/actions used in component
  setPage = jest.fn<void, [number]>((n) => { this._page = n; });
  setQuery = jest.fn<void, [string]>((q) => { this._q = q; });
  setLoading = jest.fn<void, []>(() => { this._status = 'loading'; });
  setError = jest.fn<void, []>(() => { this._status = 'error'; });
  hydrateFromApi = jest.fn<void, [ApiListResponse]>((res) => {
    this._totalPages = res.info?.pages ?? 1;
    this._status = 'idle';
  });

  // helpers for assertions
  get charactersValue() { return this._characters; }
}

describe('CharactersListComponent', () => {
  let fixture: ComponentFixture<CharactersListComponent>;
  let component: CharactersListComponent;
  let api: ApiServiceMock;
  let store: CharactersStoreMock;
  let router: Router;

  async function setup() {
    api = new ApiServiceMock();
    store = new CharactersStoreMock();

    await TestBed.configureTestingModule({
      imports: [
        CharactersListComponent,  // standalone component brings its own imports
        NoopAnimationsModule,
      ],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: ApiService, useValue: api },
        { provide: CharactersStore, useValue: store },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true as any);

    // default API behavior: page 1 with two items; page 2 repeats id=2 to prove dedupe
    api.listCharacters.mockImplementation((page: number, _q: string) => {
      const results: Character[] = page === 1
        ? [
            { id: 1, name: 'Rick',  status: 'Alive',   species: 'Human', image: 'r.png' },
            { id: 2, name: 'Morty', status: 'Alive',   species: 'Human', image: 'm.png' },
          ]
        : [
            { id: 2, name: 'Morty', status: 'Alive',   species: 'Human', image: 'm.png' }, // duplicate on purpose
            { id: 3, name: 'Summer',status: 'unknown', species: 'Human', image: 's.png' },
          ];
      return of({ info: { pages: 3 }, results } as ApiListResponse);
    });

    fixture = TestBed.createComponent(CharactersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('loads page 1 on init and hydrates store', async () => {
    await setup();

    expect(api.listCharacters).toHaveBeenCalledWith(1, '');
    expect(store.hydrateFromApi).toHaveBeenCalled();
    expect(store.charactersValue.map(c => c.id)).toEqual([1, 2]);
  });

  describe('search (debounced)', () => {
    beforeEach(async () => {
      await setup();
    });

    it('debounced input sets query, resets page to 1, and reloads', fakeAsync(() => {
      // Prime a non-default page to prove reload resets it
      store.setPage(2);

      // Type into the search box via FormControl (debounced 300ms)
      component.searchCtrl.setValue('rick');

      // Flush debounceTime(300)
      tick(300);

      fixture.detectChanges();

      expect(store.setQuery).toHaveBeenCalledWith('rick');
      // reload() is called → setPage(1) and fetchPage(true)
      expect(store.setPage).toHaveBeenCalledWith(1);
      // Should have called API again for page=1 with q='rick'
      expect(api.listCharacters).toHaveBeenLastCalledWith(1, 'rick');
    }));
  });

  it('loadMore(): increments page and appends deduped results (keeps earlier cards)', async () => {
    await setup();

    // initial characters: [1,2]
    expect(store.charactersValue.map(c => c.id)).toEqual([1, 2]);

    // totalPages mocked to 3; status is 'idle'; page=1 -> can loadMore
    component.loadMore();

    // effect triggers fetchPage for new page=2
    await fixture.whenStable();
    fixture.detectChanges();

    // After second page (which contains [2,3]) we expect dedupe: [1,2,3]
    expect(store.charactersValue.map(c => c.id)).toEqual([1, 2, 3]);
  });

  it('does not fetch on loadMore when already loading or at last page', async () => {
    await setup();

    // Simulate "loading"
    (store as any)._status = 'loading';
    component.loadMore();
    // should NOT change page nor call api again
    expect(api.listCharacters).toHaveBeenCalledTimes(1); // only initial call
    (store as any)._status = 'idle';

    // Simulate last page
    (store as any)._page = 3;
    (store as any)._totalPages = 3;
    component.loadMore();
    expect(api.listCharacters).toHaveBeenCalledTimes(1);
  });

  it('handles API error by calling store.setError()', async () => {
    // Force first call to error
    api = new ApiServiceMock();
    api.listCharacters.mockReturnValueOnce(throwError(() => new Error('network')));

    store = new CharactersStoreMock();

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CharactersListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: ApiService, useValue: api },
        { provide: CharactersStore, useValue: store },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CharactersListComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.setError).toHaveBeenCalled();
  });

  it('goDetail navigates to /characters/:id', async () => {
    await setup();
    component.goDetail(42);
    expect(router.navigate).toHaveBeenCalledWith(['/characters', 42]);
  });
});
