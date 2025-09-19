// src/app/shared/directives/infinite-scroll.directive.ts
import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

/** test seam: resolve a "window-like" object or null */
export function resolveWindow(doc: Document): any {
  // Prefer DOCUMENT.defaultView; fallback to globalThis if needed
  // (exactly your original expression, just extracted)
  // eslint-disable-next-line no-undef
  return (doc && (doc as any).defaultView) || (typeof globalThis !== 'undefined' ? (globalThis as any) : null);
}

@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  @Output() scrolled = new EventEmitter<void>();

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private platformId = inject(PLATFORM_ID);
  constructor(@Inject(DOCUMENT) private doc: Document) {}

  private isBrowser = isPlatformBrowser(this.platformId);
  private io?: IntersectionObserver;
  private onScrollFallback?: () => void;

  // store a browser-only window reference as `any` to avoid TS "never" on SSR
  private win: any = null;

  ngOnInit() {
    if (!this.isBrowser) return;

    this.win = resolveWindow(this.doc);
    if (!this.win) return;

    const rootMargin = '200px';

    if ('IntersectionObserver' in this.win) {
      this.io = new this.win.IntersectionObserver((entries: any[]) => {
        if (entries.some((e: any) => e.isIntersecting)) this.scrolled.emit();
      }, { rootMargin });
      this.io?.observe(this.el.nativeElement);
      return;
    }

    const check = () => {
      const rect = this.el.nativeElement.getBoundingClientRect();
      const vp = this.win.innerHeight || 0;
      if (rect.top <= vp + 200) this.scrolled.emit();
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        (this.win.requestAnimationFrame || ((cb: any) => setTimeout(cb, 16)))(() => { check(); ticking = false; });
      }
    };

    this.onScrollFallback = onScroll;
    this.win.addEventListener('scroll', onScroll, { passive: true });
    this.win.addEventListener('resize', onScroll, { passive: true });
    check(); // initial
  }

  ngOnDestroy() {
    this.io?.disconnect();
    if (this.onScrollFallback && this.win) {
      this.win.removeEventListener('scroll', this.onScrollFallback);
      this.win.removeEventListener('resize', this.onScrollFallback);
    }
  }
}
