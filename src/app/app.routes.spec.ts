/** @jest-environment jsdom */

describe('routes (app.routes.ts)', () => {
  const MOCK_CHARACTER_ROUTES = [{ path: '', pathMatch: 'full' }] as any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.doMock('./features/characters/characters.routes', () => ({
      CHARACTER_ROUTES: MOCK_CHARACTER_ROUTES,
    }));
  });

  it('defines root redirect and wildcard redirect correctly', async () => {
    const { routes } = require('./app.routes') as {
      routes: Array<Record<string, unknown>>;
    };

    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThanOrEqual(3);

    const root = routes[0] as Record<string, unknown>;
    expect(root['path']).toBe('');
    expect(root['redirectTo']).toBe('characters');
    expect(root['pathMatch']).toBe('full');

    const wildcard = routes[routes.length - 1] as Record<string, unknown>;
    expect(wildcard['path']).toBe('**');
    expect(wildcard['redirectTo']).toBe('characters');
  });

  it('lazy loads CHARACTER_ROUTES for /characters', async () => {
    const { routes } = require('./app.routes') as {
      routes: Array<Record<string, unknown>>;
    };

    const characters = routes.find(r => r['path'] === 'characters') as Record<
      string,
      unknown
    >;

    expect(characters).toBeTruthy();
    expect(typeof characters['loadChildren']).toBe('function');

    const loaded = await (characters['loadChildren'] as () => Promise<any>)();
    expect(loaded).toBe(MOCK_CHARACTER_ROUTES);
  });

  it('has no unexpected keys on the redirect routes', () => {
    const { routes } = require('./app.routes') as {
      routes: Array<Record<string, unknown>>;
    };

    const root = routes[0] as Record<string, unknown>;
    expect(Object.keys(root).sort()).toEqual(['path', 'pathMatch', 'redirectTo']);

    const wildcard = routes[routes.length - 1] as Record<string, unknown>;
    expect(Object.keys(wildcard).sort()).toEqual(['path', 'redirectTo']);
  });
});
