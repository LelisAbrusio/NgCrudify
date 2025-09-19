/** @jest-environment jsdom */

import type { ApplicationConfig } from '@angular/core';

// Hoisted mocks so tests can assert calls
let provideServerRenderingMock: jest.Mock;
let withRoutesMock: jest.Mock;

describe('app.config.server.ts', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Base app config mock
    jest.doMock('./app.config', () => {
      const appConfig: ApplicationConfig = {
        providers: [{ provide: 'BASE_PROVIDER', useValue: 'base' } as any],
      };
      return { appConfig };
    });

    // Server routes mock
    jest.doMock('./app.routes.server', () => {
      const serverRoutes = [{ path: 'ssr' }] as any;
      return { serverRoutes };
    });

    // @angular/ssr mocks — NO spread; pass first arg explicitly
    provideServerRenderingMock = jest.fn((arg: any) => ({
      __sentinel: 'SSR_ENVIRONMENT_PROVIDERS',
      value: arg,
    }));
    withRoutesMock = jest.fn((routes: any) => ({
      __sentinel: 'WITH_ROUTES_RESULT',
      routes,
    }));

    jest.doMock('@angular/ssr', () => ({
      provideServerRendering: (arg: any) => provideServerRenderingMock(arg),
      withRoutes: (routes: any) => withRoutesMock(routes),
    }));
  });

  it('calls provideServerRendering(withRoutes(serverRoutes)) and merges providers', () => {
    const { serverRoutes } = require('./app.routes.server');
    const { appConfig } = require('./app.config');
    const { config } = require('./app.config.server');

    // withRoutes called with serverRoutes
    expect(withRoutesMock).toHaveBeenCalledTimes(1);
    expect(withRoutesMock).toHaveBeenCalledWith(serverRoutes);

    // provideServerRendering called with result of withRoutes
    const withRoutesResult = withRoutesMock.mock.results[0].value;
    expect(provideServerRenderingMock).toHaveBeenCalledTimes(1);
    expect(provideServerRenderingMock).toHaveBeenCalledWith(withRoutesResult);

    // merged providers contain both base and SSR providers
    const baseProvider = (appConfig.providers as any[])[0];
    const ssrProvider = provideServerRenderingMock.mock.results[0].value;

    expect(Array.isArray(config.providers)).toBe(true);
    expect(config.providers).toEqual(
      expect.arrayContaining([baseProvider, ssrProvider])
    );
  });

  it('exposes ApplicationConfig shape', () => {
    const { config } = require('./app.config.server');
    // Basic shape check
    expect(config).toHaveProperty('providers');
    expect(Array.isArray(config.providers)).toBe(true);
  });
});
