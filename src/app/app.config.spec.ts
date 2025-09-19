/** @jest-environment jsdom */

import type { ApplicationConfig } from '@angular/core';

// Hoisted mocks so we can assert calls
let provideBrowserGlobalErrorListenersMock: jest.Mock;
let provideZoneChangeDetectionMock: jest.Mock;
let provideRouterMock: jest.Mock;
let provideHttpClientMock: jest.Mock;
let provideClientHydrationMock: jest.Mock;
let withEventReplayMock: jest.Mock;

describe('app.config.ts', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // ---- Mock ./app.routes (routes token) ----
    jest.doMock('./app.routes', () => {
      const routes = [{ path: '' }] as any;
      return { routes };
    });

    // ---- Mock @angular/core providers ----
    provideBrowserGlobalErrorListenersMock = jest.fn(() => ({
      __token: 'ERR_LISTENERS',
    }));
    provideZoneChangeDetectionMock = jest.fn((opts: any) => ({
      __token: 'ZONE_CHANGE',
      opts,
    }));

    jest.doMock('@angular/core', () => ({
      provideBrowserGlobalErrorListeners: (/* no args */) =>
        provideBrowserGlobalErrorListenersMock(),
      provideZoneChangeDetection: (opts: any) =>
        provideZoneChangeDetectionMock(opts),
    }));

    // ---- Mock @angular/router ----
    provideRouterMock = jest.fn((routes: any) => ({
      __token: 'ROUTER',
      routes,
    }));
    jest.doMock('@angular/router', () => ({
      provideRouter: (routes: any) => provideRouterMock(routes),
    }));

    // ---- Mock @angular/common/http ----
    provideHttpClientMock = jest.fn((...features: any[]) => ({
      __token: 'HTTP',
      features,
    }));
    jest.doMock('@angular/common/http', () => ({
      provideHttpClient: (...features: any[]) =>
        provideHttpClientMock(...features),
    }));

    // ---- Mock @angular/platform-browser (hydration is commented out in file) ----
    provideClientHydrationMock = jest.fn((...args: any[]) => ({
      __token: 'HYDRATION',
      args,
    }));
    withEventReplayMock = jest.fn((...args: any[]) => ({
      __token: 'WITH_EVENT_REPLAY',
      args,
    }));
    jest.doMock('@angular/platform-browser', () => ({
      provideClientHydration: (...args: any[]) =>
        provideClientHydrationMock(...args),
      withEventReplay: (...args: any[]) => withEventReplayMock(...args),
    }));
  });

  it('builds providers list with error listeners, zone coalescing, router(routes) and http client', () => {
    const { routes } = require('./app.routes');
    const { appConfig } = require('./app.config') as {
      appConfig: ApplicationConfig;
    };

    // Assert calls
    expect(provideBrowserGlobalErrorListenersMock).toHaveBeenCalledTimes(1);
    expect(provideZoneChangeDetectionMock).toHaveBeenCalledTimes(1);
    expect(provideZoneChangeDetectionMock).toHaveBeenCalledWith({
      eventCoalescing: true,
    });

    expect(provideRouterMock).toHaveBeenCalledTimes(1);
    expect(provideRouterMock).toHaveBeenCalledWith(routes);

    expect(provideHttpClientMock).toHaveBeenCalledTimes(1);
    // No features passed (withFetch / withInterceptorsFromDi are commented out)
    expect(provideHttpClientMock.mock.calls[0]).toHaveLength(0);

    // Hydration not used (commented in source)
    expect(provideClientHydrationMock).not.toHaveBeenCalled();
    expect(withEventReplayMock).not.toHaveBeenCalled();

    // Grab the produced tokens
    const errTok = provideBrowserGlobalErrorListenersMock.mock.results[0].value;
    const zoneTok = provideZoneChangeDetectionMock.mock.results[0].value;
    const routerTok = provideRouterMock.mock.results[0].value;
    const httpTok = provideHttpClientMock.mock.results[0].value;

    // Expect exact order as defined in the file
    expect(Array.isArray(appConfig.providers)).toBe(true);
    expect(appConfig.providers).toHaveLength(4);
    expect(appConfig.providers[0]).toEqual(errTok);
    expect(appConfig.providers[1]).toEqual(zoneTok);
    expect(appConfig.providers[2]).toEqual(routerTok);
    expect(appConfig.providers[3]).toEqual(httpTok);
  });

  it('exposes ApplicationConfig shape', () => {
    const { appConfig } = require('./app.config') as {
      appConfig: ApplicationConfig;
    };
    expect(appConfig).toHaveProperty('providers');
    expect(Array.isArray(appConfig.providers)).toBe(true);
  });
});
