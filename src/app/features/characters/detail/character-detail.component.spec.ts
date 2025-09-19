import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CharacterDetailComponent, CharacterDetailData } from './character-detail.component';


import { provideRouter, Router } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Observable, of, Subject } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { CharactersStore } from '../state/characters.store';

type Status = 'Alive' | 'Dead' | 'unknown';
type Character = { id: number; name: string; status: Status; species: string; image: string };

// ----- Mocks (use 0 or 2 generics for jest.fn) -----
class CharactersStoreMock {
  findById    = jest.fn<Character | null, [number]>();
  deleteLocal = jest.fn<void, [number]>();
}

class ApiServiceMock {
  getCharacter = jest.fn<Observable<Character | null>, [number]>();
}

function microtask() {
  // allow queueMicrotask() in component to flush
  return Promise.resolve();
}

describe('CharacterDetailComponent', () => {
  let fixture: ComponentFixture<CharacterDetailComponent>;
  let component: CharacterDetailComponent;
  let store: CharactersStoreMock;
  let api: ApiServiceMock;
  let router: Router;

  async function setup({
    dialogData = null as CharacterDetailData | null,
    routeId = null as number | null,
    storeHit = null as Character | null,
    apiHit = null as Character | null,
    withDialogRef = false,
  } = {}) {
    store = new CharactersStoreMock();
    api = new ApiServiceMock();

    // store behavior
    store.findById.mockImplementation((id: number) =>
      storeHit && storeHit.id === id ? storeHit : null
    );

    // api behavior
    api.getCharacter.mockImplementation((id: number) =>
      apiHit && apiHit.id === id ? of(apiHit) : of(null)
    );

    // IMPORTANT: provide the Subject itself (not asObservable),
    // so we can call .next(...) in tests.
    const paramMap$ = new Subject<any>();
    const mockActivatedRoute: Partial<ActivatedRoute> = {
      paramMap: paramMap$ as any,
    };

    const dialogRefMock: Partial<MatDialogRef<CharacterDetailComponent>> = {
      close: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        CharacterDetailComponent,   // standalone
        NoopAnimationsModule,
      ],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: CharactersStore, useValue: store },
        { provide: ApiService, useValue: api },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: withDialogRef ? dialogRefMock : null },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true as any);

    fixture = TestBed.createComponent(CharacterDetailComponent);
    component = fixture.componentInstance;

    fixture.detectChanges(); // triggers ngOnInit

    // If in routed mode (no dialogData), emit paramMap once (component uses take(1))
    if (!dialogData) {
      if (routeId != null) {
        paramMap$.next(convertToParamMap({ id: String(routeId) }));
      } else {
        paramMap$.next(convertToParamMap({}));
      }
    }

    await microtask();
    await fixture.whenStable();
    fixture.detectChanges();

    return { paramMap$, mockActivatedRoute };
  }

  it('dialog mode: uses provided data and clears entering', async () => {
    const data: CharacterDetailData = {
      id: 5, name: 'Rick', status: 'Alive', species: 'Human', image: 'url'
    };
    await setup({ dialogData: data, withDialogRef: true });

    expect(component.data).toEqual(data);
    expect(component.entering()).toBe(false);
  });

  it('routed mode: loads from store when available', async () => {
    const local: Character = { id: 10, name: 'Birdperson', status: 'unknown', species: 'Bird-Person', image: 'x' };

    await setup({ routeId: 10, storeHit: local });

    expect(store.findById).toHaveBeenCalledWith(10);
    expect(api.getCharacter).not.toHaveBeenCalled();

    expect(component.data).toEqual(local);
    expect(component.entering()).toBe(false);
  });

  it('routed mode: falls back to API when store has no item', async () => {
    const remote: Character = { id: 7, name: 'Morty', status: 'Alive', species: 'Human', image: 'morty.png' };

    await setup({ routeId: 7, storeHit: null, apiHit: remote });

    expect(store.findById).toHaveBeenCalledWith(7);
    expect(api.getCharacter).toHaveBeenCalledWith(7);

    expect(component.data).toEqual(remote);
    expect(component.entering()).toBe(false);
  });

  it('routed mode: invalid id keeps data null and clears entering', async () => {
    await setup({ routeId: null, storeHit: null });

    expect(component.data).toBeNull();
    expect(component.entering()).toBe(false);
  });

  it('remove(): dialog mode closes and deletes when confirmed', async () => {
    const data: CharacterDetailData = {
      id: 3, name: 'Jerry', status: 'unknown', species: 'Human', image: 'j.png'
    };

    const confirmSpy = jest.spyOn(global, 'confirm' as any).mockReturnValue(true);
    await setup({ dialogData: data, withDialogRef: true });

    await component.remove(3);

    expect(store.deleteLocal).toHaveBeenCalledWith(3);
    const ref = TestBed.inject(MatDialogRef) as any;
    expect(ref.close).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('remove(): dialog mode does nothing when user cancels', async () => {
    const data: CharacterDetailData = {
      id: 99, name: 'Summer', status: 'Alive', species: 'Human', image: 's.png'
    };

    const confirmSpy = jest.spyOn(global, 'confirm' as any).mockReturnValue(false);
    await setup({ dialogData: data, withDialogRef: true });

    await component.remove(99);

    expect(store.deleteLocal).not.toHaveBeenCalled();
    const ref = TestBed.inject(MatDialogRef) as any;
    expect(ref.close).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('remove(): routed mode navigates back to /characters and deletes', async () => {
    const confirmSpy = jest.spyOn(global, 'confirm' as any).mockReturnValue(true);

    await setup({ routeId: 15, storeHit: null, apiHit: null, withDialogRef: false });
    await component.remove(15);

    expect(store.deleteLocal).toHaveBeenCalledWith(15);
    expect(router.navigate).toHaveBeenCalledWith(['/characters']);

    confirmSpy.mockRestore();
  });

  it('close(): dialog mode closes', async () => {
    const data: CharacterDetailData = {
      id: 1, name: 'Beth', status: 'Alive', species: 'Human', image: 'b.png'
    };
    await setup({ dialogData: data, withDialogRef: true });
    const ref = TestBed.inject(MatDialogRef) as any;

    component.close();
    expect(ref.close).toHaveBeenCalled();
  });

  it('close(): routed mode navigates to list', async () => {
    await setup({ routeId: 2, withDialogRef: false });
    component.close();
    expect(router.navigate).toHaveBeenCalledWith(['/characters']);
  });
});
