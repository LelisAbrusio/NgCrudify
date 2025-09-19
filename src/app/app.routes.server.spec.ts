/** @jest-environment jsdom */

describe('serverRoutes (app.routes.server.ts)', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock only what the file actually uses at runtime.
    jest.doMock('@angular/ssr', () => {
      return {
        // Value used at runtime
        RenderMode: {
          Prerender: 'MOCK_PRERENDER',
          Server: 'MOCK_SERVER',
          Client: 'MOCK_CLIENT',
        },
        // Type-only import is erased at runtime, but provide something harmless.
        ServerRoute: class {},
      };
    });
  });

  it('exports a single catch-all route with Prerender mode', () => {
    const { RenderMode } = require('@angular/ssr');
    const { serverRoutes } = require('./app.routes.server') as {
      serverRoutes: Array<{ path: string; renderMode: unknown }>;
    };

    expect(Array.isArray(serverRoutes)).toBe(true);
    expect(serverRoutes).toHaveLength(1);

    const [route] = serverRoutes;
    expect(route).toBeTruthy();
    expect(route.path).toBe('**');
    // Must point to the RenderMode.Prerender value (from our mock)
    expect(route.renderMode).toBe(RenderMode.Prerender);
    expect(route.renderMode).toBe('MOCK_PRERENDER');
  });

  it('does not include unexpected keys on the route object', () => {
    const { serverRoutes } = require('./app.routes.server') as {
      serverRoutes: Array<Record<string, unknown>>;
    };

    const keys = Object.keys(serverRoutes[0]).sort();
    expect(keys).toEqual(['path', 'renderMode']);
  });
});
