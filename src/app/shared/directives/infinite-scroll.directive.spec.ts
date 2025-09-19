/** @jest-environment jsdom */

import { Component, NgZone } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { By } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { InfiniteScrollDirective } from './infinite-scroll.directive';

@Component({
  standalone: true,
  imports: [InfiniteScrollDirective],
  template: `<div appInfiniteScroll (scrolled)="onScrolled()"></div>`,
})
class HostComponent {
  count = 0;
  onScrolled() {
    this.count++;
  }
}

describe('InfiniteScrollDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let zone: NgZone;

  const makeHost = (platform: 'browser' | 'server' = 'browser') => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: platform === 'browser' ? 'browser' : 'server' },
      ],
    });
    fixture = TestBed.createComponent(HostComponent);
    zone = TestBed.inject(NgZone);
    fixture.detectChanges(); // triggers ngOnInit of the directive
  };

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    delete (window as any).IntersectionObserver;
  });

  const getDirectiveInstance = () => {
    const debugEl = fixture.debugElement.query(By.directive(InfiniteScrollDirective));
    return debugEl.injector.get(InfiniteScrollDirective);
  };

  // --- Your original three tests (stable & safe) ---

  test('browser + IntersectionObserver: emits when intersecting, observes and disconnects on destroy', () => {
    const observe = jest.fn();
    const disconnect = jest.fn();
    const IOcallbackRef: { cb?: (entries: any[]) => void } = {};

    class IOStub {
      constructor(cb: (entries: any[]) => void) {
        IOcallbackRef.cb = cb;
      }
      observe = observe;
      disconnect = disconnect;
    }

    (window as any).IntersectionObserver = IOStub as unknown as typeof IntersectionObserver;

    makeHost('browser');

    expect(observe).toHaveBeenCalledTimes(1);

    IOcallbackRef.cb?.([{ isIntersecting: true }]);
    expect(fixture.componentInstance.count).toBe(1);

    IOcallbackRef.cb?.([{ isIntersecting: false }]);
    expect(fixture.componentInstance.count).toBe(1);

    fixture.destroy();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  test('browser fallback (no IO): registers scroll/resize, emits on initial check and on scroll', async () => {
    delete (window as any).IntersectionObserver;

    const rafSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1 as unknown as number;
      });

    Object.defineProperty(window, 'innerHeight', {
      value: 600,
      configurable: true,
      writable: true,
    });

    makeHost('browser');

    const debugEl = fixture.debugElement.query(By.css('[appInfiniteScroll]'));
    const el: HTMLElement = debugEl.nativeElement;

    const getRect = jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 650,
      left: 0,
      bottom: 700,
      right: 0,
      width: 0,
      height: 50,
      x: 0,
      y: 650,
      toJSON: () => {},
    } as DOMRect);

    expect(fixture.componentInstance.count).toBe(1);

    getRect.mockReturnValue({
      top: 790,
      left: 0,
      bottom: 840,
      right: 0,
      width: 0,
      height: 50,
      x: 0,
      y: 790,
      toJSON: () => {},
    } as DOMRect);

    window.dispatchEvent(new Event('scroll'));
    await Promise.resolve();

    expect(fixture.componentInstance.count).toBe(2);

    const removeSpy = jest.spyOn(window, 'removeEventListener');
    fixture.destroy();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    rafSpy.mockRestore();
  });

  test('server platform: does nothing (no IO, no listeners, no emits)', () => {
    makeHost('server');

    const dir = getDirectiveInstance();

    expect(fixture.componentInstance.count).toBe(0);

    expect(() => fixture.destroy()).not.toThrow();
    expect((dir as any).io).toBeUndefined();
    expect((dir as any).onScrollFallback).toBeUndefined();
  });

  // --- Additional SAFE coverage tests ---

  // 1) Cover defaultView || globalThis by forcing defaultView = null (so code uses globalThis),
  // without ever redefining globalThis itself.
  test('falls back to globalThis when document.defaultView is null (safe)', () => {
  // Make IO exist so the directive still takes the "IO available" path after choosing globalThis.
  const observe = jest.fn();
  const disconnect = jest.fn();
  class IOStub {
    constructor(_cb: any) {}
    observe = observe;
    disconnect = disconnect;
  }
  (window as any).IntersectionObserver = IOStub as any;

  // Mock the getter of document.defaultView to return null
  const dvSpy = jest.spyOn(document, 'defaultView', 'get')
    .mockReturnValue(null as any);

  try {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const f = TestBed.createComponent(HostComponent);
    f.detectChanges(); // triggers ngOnInit in the directive

    // The directive should have used globalThis and still created IO
    expect(observe).toHaveBeenCalledTimes(1);

    f.destroy();
    expect(disconnect).toHaveBeenCalledTimes(1);
  } finally {
    dvSpy.mockRestore();
  }
});


  // 2) Cover innerHeight || 0 by removing innerHeight → vp = 0
  test('uses innerHeight || 0 (vp=0) and emits when element is within 200px', () => {
    const originalIH = Object.getOwnPropertyDescriptor(window as any, 'innerHeight');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: undefined });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const f2 = TestBed.createComponent(HostComponent);
    f2.detectChanges();

    const debugEl = f2.debugElement.query(By.css('[appInfiniteScroll]'));
    const el: HTMLElement = debugEl.nativeElement;

    jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 150, // <= 0 + 200
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 50,
      x: 0,
      y: 150,
      toJSON: () => {},
    } as DOMRect);

    // Trigger CD so initial check reads mocked rect
    f2.detectChanges();
    expect(f2.componentInstance.count).toBe(1);

    if (originalIH) Object.defineProperty(window, 'innerHeight', originalIH);
    f2.destroy();
  });

  // 3) Cover rAF || setTimeout fallback by deleting requestAnimationFrame
  test('falls back to setTimeout when requestAnimationFrame is missing', async () => {
    delete (window as any).IntersectionObserver;

    const originalRAF = Object.getOwnPropertyDescriptor(window as any, 'requestAnimationFrame');
    delete (window as any).requestAnimationFrame;

    const originalIH = Object.getOwnPropertyDescriptor(window as any, 'innerHeight');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });

    jest.useFakeTimers();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const f2 = TestBed.createComponent(HostComponent);

    // Prepare element rect BEFORE detectChanges (initial check runs right after init)
    const debugEl = f2.debugElement.query(By.css('[appInfiniteScroll]'));
    const el: HTMLElement = debugEl.nativeElement;

    const rectSpy = jest.spyOn(el, 'getBoundingClientRect');

    // Initial: far from viewport -> NO initial emit
    rectSpy.mockReturnValue({
        top: 2000, // > 600 + 200, won't emit
        left: 0,
        bottom: 0,
        right: 0,
        width: 0,
        height: 50,
        x: 0,
        y: 2000,
        toJSON: () => {},
    } as DOMRect);

    f2.detectChanges(); // ngOnInit + initial check
    expect(f2.componentInstance.count).toBe(0);

    // Now make it eligible and simulate scroll; fallback uses setTimeout(16)
    rectSpy.mockReturnValue({
        top: 790, // <= 600 + 200, will emit
        left: 0,
        bottom: 0,
        right: 0,
        width: 0,
        height: 50,
        x: 0,
        y: 790,
        toJSON: () => {},
    } as DOMRect);

    window.dispatchEvent(new Event('scroll'));

    jest.advanceTimersByTime(16);
    await Promise.resolve();

    expect(f2.componentInstance.count).toBe(1);

    jest.useRealTimers();
    if (originalRAF) Object.defineProperty(window, 'requestAnimationFrame', originalRAF);
    if (originalIH) Object.defineProperty(window, 'innerHeight', originalIH);
    f2.destroy();
    });

});
