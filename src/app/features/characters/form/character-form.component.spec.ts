import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CharacterFormComponent } from './character-form.component';

import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';

import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CharactersStore } from '../state/characters.store';

// ---- Store mock ----
type Status = 'Alive' | 'Dead' | 'unknown';
type Character = { id: number; name: string; status: Status; species: string; image: string; };

class CharactersStoreMock {
  createLocal = jest.fn((v: Omit<Character, 'id'>) => ({ id: 777, ...v }));
  updateLocal = jest.fn();
  findById = jest.fn((id: number) =>
    id === 123
      ? { id, name: 'Morty', status: 'Alive' as Status, species: 'Human', image: 'https://example.com/morty.png' }
      : null
  );
}

describe('CharacterFormComponent', () => {
  let fixture: ComponentFixture<CharacterFormComponent>;
  let component: CharacterFormComponent;
  let store: CharactersStoreMock;
  let router: Router;

  async function setup(mode: 'create' | 'edit' = 'create') {
    store = new CharactersStoreMock();

    const mockRoute = {
      snapshot: {
        paramMap: convertToParamMap(mode === 'edit' ? { id: '123' } : {}),
      },
    };

    await TestBed.configureTestingModule({
      imports: [
        CharacterFormComponent,      // standalone
        NoopAnimationsModule,
        MatIconTestingModule,
      ],
      providers: [
        provideRouter([]),           // ✅ real router providers for RouterLink
        provideLocationMocks(),      // ✅ mock platform location so router can init
        { provide: ActivatedRoute, useValue: mockRoute }, // ✅ mock route per test
        { provide: CharactersStore, useValue: store },    // ✅ store mock
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true as any);

    fixture = TestBed.createComponent(CharacterFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders in CREATE mode when there is no :id', async () => {
    await setup('create');
    expect(component.isEdit).toBe(false);
    expect(component.form.value).toEqual({
      name: '',
      species: '',
      status: 'unknown',
      image: '',
    });
  });

  it('renders in EDIT mode when :id is present and prefills the form', async () => {
    await setup('edit');
    expect(component.isEdit).toBe(true);
    expect(component.id).toBe(123);
    expect(store.findById).toHaveBeenCalledWith(123);
    expect(component.form.value).toEqual({
      name: 'Morty',
      species: 'Human',
      status: 'Alive',
      image: 'https://example.com/morty.png',
    });
  });

  it('validates required fields and prevents submit when invalid', async () => {
    await setup('create');
    expect(component.form.invalid).toBe(true);
    component.submit();
    expect(store.createLocal).not.toHaveBeenCalled();
    expect(store.updateLocal).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('submits CREATE and navigates to the created detail', async () => {
    await setup('create');
    component.form.setValue({
      name: 'Rick',
      species: 'Human',
      status: 'Alive',
      image: 'https://example.com/rick.png',
    });
    component.submit();
    expect(store.createLocal).toHaveBeenCalledWith({
      name: 'Rick',
      species: 'Human',
      status: 'Alive',
      image: 'https://example.com/rick.png',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/characters', 777]);
  });

  it('submits EDIT and navigates back to the detail', async () => {
    await setup('edit');
    component.form.patchValue({ name: 'Morty Smith' });
    component.submit();
    expect(store.updateLocal).toHaveBeenCalledWith(123, {
      name: 'Morty Smith',
      species: 'Human',
      status: 'Alive',
      image: 'https://example.com/morty.png',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/characters', 123]);
  });

  it('Cancel in CREATE navigates back to /characters', async () => {
    await setup('create');
    component.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/characters']);
  });

  it('Cancel in EDIT navigates back to /characters/:id', async () => {
    await setup('edit');
    component.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/characters', 123]);
  });

  it('Ctrl/Cmd+Enter triggers submit; Esc triggers cancel', async () => {
    await setup('create');
    component.form.setValue({
      name: 'Summer',
      species: 'Human',
      status: 'unknown',
      image: 'https://example.com/summer.png',
    });

    const enterEvt = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
    document.dispatchEvent(enterEvt);
    expect(store.createLocal).toHaveBeenCalledTimes(1);

    const escEvt = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escEvt);
    expect(router.navigate).toHaveBeenLastCalledWith(['/characters']);
  });

  it('imagePreview returns placeholder SVG when image is empty', async () => {
    await setup('create');
    expect(component.imagePreview.startsWith('data:image/svg+xml;utf8,')).toBe(true);
  });

  it('imagePreview returns provided URL when image is set', async () => {
    await setup('create');
    component.form.patchValue({ image: 'https://example.com/x.png' });
    expect(component.imagePreview).toBe('https://example.com/x.png');
  });
});
