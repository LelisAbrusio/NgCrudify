// characters.routes.spec.ts
import { Routes } from '@angular/router';
import { CHARACTER_ROUTES } from './characters.routes';

// --- Stub the lazy-loaded component modules -------------------------------
// We return simple classes; Angular doesn't need to instantiate them here.
// The important bit is that loadComponent() resolves to these exports.

class StubCharactersListComponent {}
class StubCharacterDetailComponent {}
class StubCharacterFormComponent {}

jest.mock('./list/characters-list.component', () => ({
  __esModule: true,
  CharactersListComponent: StubCharactersListComponent,
}));

jest.mock('./detail/character-detail.component', () => ({
  __esModule: true,
  CharacterDetailComponent: StubCharacterDetailComponent,
}));

jest.mock('./form/character-form.component', () => ({
  __esModule: true,
  CharacterFormComponent: StubCharacterFormComponent,
}));

// -------------------------------------------------------------------------

describe('CHARACTER_ROUTES', () => {
  it('should be a valid Routes array', () => {
    expect(Array.isArray(CHARACTER_ROUTES)).toBe(true);
    expect((CHARACTER_ROUTES as Routes).length).toBe(4);
  });

  it('should define the "" (list) route that lazy-loads CharactersListComponent', async () => {
    const route = CHARACTER_ROUTES.find(r => r.path === '');
    expect(route).toBeTruthy();
    expect(typeof route!.loadComponent).toBe('function');
    const comp = await route!.loadComponent!();
    expect(comp).toBe(StubCharactersListComponent);
  });

  it('should define the ":id" (detail) route that lazy-loads CharacterDetailComponent', async () => {
    const route = CHARACTER_ROUTES.find(r => r.path === ':id');
    expect(route).toBeTruthy();
    expect(typeof route!.loadComponent).toBe('function');
    const comp = await route!.loadComponent!();
    expect(comp).toBe(StubCharacterDetailComponent);
  });

  it('should define the "new" (create) route that lazy-loads CharacterFormComponent', async () => {
    const route = CHARACTER_ROUTES.find(r => r.path === 'new');
    expect(route).toBeTruthy();
    expect(typeof route!.loadComponent).toBe('function');
    const comp = await route!.loadComponent!();
    expect(comp).toBe(StubCharacterFormComponent);
  });

  it('should define the ":id/edit" (edit) route that lazy-loads CharacterFormComponent', async () => {
    const route = CHARACTER_ROUTES.find(r => r.path === ':id/edit');
    expect(route).toBeTruthy();
    expect(typeof route!.loadComponent).toBe('function');
    const comp = await route!.loadComponent!();
    expect(comp).toBe(StubCharacterFormComponent);
  });

  it('should place the "new" route before the generic ":id" route to avoid conflicts', () => {
    const indexNew = CHARACTER_ROUTES.findIndex(r => r.path === 'new');
    const indexId = CHARACTER_ROUTES.findIndex(r => r.path === ':id');
    expect(indexNew).toBeGreaterThan(-1);
    expect(indexId).toBeGreaterThan(-1);
    // Expect "new" to be matched before ":id"
    expect(indexNew).toBeLessThan(indexId);
  });
});
