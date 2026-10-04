import { provideTaiga } from '@taiga-ui/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { KittyCreatorPage } from './kitty-creator-page';
import { galleryStorageKey } from './state/gallery.store';

describe('KittyCreatorPage', () => {
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

  beforeEach(async () => {
    localStorage.removeItem(galleryStorageKey);
    await TestBed.configureTestingModule({
      imports: [KittyCreatorPage],
      providers: [provideTaiga()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.removeItem(galleryStorageKey);
  });

  it('returns a scrolled gallery to the newest snapshot after capture', async () => {
    const fixture = TestBed.createComponent(KittyCreatorPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const capture = root.querySelector('.capture-button') as HTMLButtonElement;
    capture.click();
    await fixture.whenStable();
    const strip = root.querySelector('.gallery-grid') as HTMLDivElement;
    strip.scrollLeft = 300;

    capture.click();
    await fixture.whenStable();

    expect(strip.scrollLeft).toBe(0);
    expect(strip.querySelectorAll('app-photo-card')).toHaveLength(2);
    expect(strip.firstElementChild?.classList.contains('just-captured')).toBe(true);
  });

  it('clears the gallery only after confirmation', async () => {
    const fixture = TestBed.createComponent(KittyCreatorPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const clear = root.querySelector('.clear-gallery-button') as HTMLButtonElement;
    expect(clear.disabled).toBe(true);
    (root.querySelector('.capture-button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(clear.disabled).toBe(false);

    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false);
    clear.click();
    await fixture.whenStable();
    expect(root.querySelectorAll('.gallery-card')).toHaveLength(1);

    confirmation.mockReturnValue(true);
    clear.click();
    await fixture.whenStable();
    expect(root.querySelector('.gallery-card')).toBeNull();
    expect(root.querySelector('.gallery-empty')).not.toBeNull();
    expect(clear.disabled).toBe(true);
    expect(localStorage.getItem(galleryStorageKey)).toBeNull();
  });

  it('updates the preview as options are selected', async () => {
    const fixture = TestBed.createComponent(KittyCreatorPage);
    fixture.detectChanges();

    const ginger = fixture.nativeElement.querySelector(
      'input[name="coat"][value="ginger"]',
    ) as HTMLInputElement;
    ginger.click();
    await fixture.whenStable();

    const preview = fixture.nativeElement.querySelector('.preview-area svg') as SVGElement;
    expect(preview.querySelector('use[href$="#coat-ginger"]')).not.toBeNull();
    expect(preview.querySelector('use[href$="#coat-cream"]')).toBeNull();
  });

  it('keeps the captured name and choices when the preview changes', async () => {
    const fixture = TestBed.createComponent(KittyCreatorPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const name = root.querySelector('.name-field input') as HTMLInputElement;
    name.value = 'Барсик';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    (root.querySelector('.capture-button') as HTMLButtonElement).click();
    await fixture.whenStable();

    (root.querySelector('input[name="coat"][value="ginger"]') as HTMLInputElement).click();
    await fixture.whenStable();

    const card = root.querySelector('.gallery-card') as HTMLElement;
    expect(card.querySelector('.caption')?.textContent?.trim()).toBe('Барсик');
    expect(card.querySelector('use[href$="#coat-cream"]')).not.toBeNull();
    expect(card.querySelector('use[href$="#coat-ginger"]')).toBeNull();
    expect(root.querySelector('.preview-area use[href$="#coat-ginger"]')).not.toBeNull();
  });
});
