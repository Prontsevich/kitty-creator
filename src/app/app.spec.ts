import { provideTaiga } from '@taiga-ui/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { galleryStorageKey } from './gallery.store';

describe('Kitty creator', () => {
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
      imports: [App],
      providers: [provideTaiga()],
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(galleryStorageKey));

  it('updates the preview as options are selected', async () => {
    const fixture = TestBed.createComponent(App);
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
    const fixture = TestBed.createComponent(App);
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
