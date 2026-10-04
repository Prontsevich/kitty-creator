import { provideTaiga } from '@taiga-ui/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { galleryStorageKey } from './features/kitty-creator/state/gallery.store';

describe('App', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  beforeEach(() => localStorage.removeItem(galleryStorageKey));
  afterEach(() => localStorage.removeItem(galleryStorageKey));

  it('renders the kitty creator page inside the Taiga UI root', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideTaiga()],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const page = fixture.nativeElement.querySelector('tui-root app-kitty-creator-page');
    expect(page).not.toBeNull();
    expect(page.querySelector('h1')?.textContent).toContain('Создай своего котика');
  });
});
