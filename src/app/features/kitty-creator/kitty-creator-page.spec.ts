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

  it('changes the kitty even when the random choices match the current settings', async () => {
    const fixture = TestBed.createComponent(KittyCreatorPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const selectedOptions = () =>
      Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]:checked')).map(
        (input) => `${input.name}:${input.value}`,
      );
    const before = selectedOptions();
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.25)
      .mockReturnValueOnce(0)
      .mockReturnValue(0);

    (root.querySelector('.randomize-button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(selectedOptions()).not.toEqual(before);
    expect(selectedOptions()).toHaveLength(4);
    expect(root.querySelector('.preview-area use[href$="#coat-ginger"]')).not.toBeNull();
  });

  it('randomizes all settings while preserving the name and gallery across repeated clicks', async () => {
    const fixture = TestBed.createComponent(KittyCreatorPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const name = root.querySelector('.name-field input') as HTMLInputElement;
    name.value = 'Барсик';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    (root.querySelector('.capture-button') as HTMLButtonElement).click();
    await fixture.whenStable();
    const savedGallery = localStorage.getItem(galleryStorageKey);
    const card = root.querySelector('.gallery-card') as HTMLElement;
    const savedCard = card.innerHTML;
    const randomize = root.querySelector('.randomize-button') as HTMLButtonElement;
    expect(randomize.previousElementSibling?.classList.contains('name-field')).toBe(true);
    expect(randomize.nextElementSibling?.classList.contains('capture-button')).toBe(true);
    expect(randomize.querySelector('img')?.getAttribute('src')).toBe('/assets/dice-icon.svg');
    vi.spyOn(Math, 'random').mockReturnValue(0.999);

    randomize.click();
    await fixture.whenStable();

    const preview = root.querySelector('.preview-area') as HTMLElement;
    for (const symbol of [
      'coat-calico',
      'face-curious',
      'accessory-glasses',
      'background-sunset',
    ]) {
      expect(preview.querySelector(`use[href$="#${symbol}"]`)).not.toBeNull();
    }

    for (const value of [0.999, 0, 0]) {
      const before = preview.innerHTML;
      vi.mocked(Math.random).mockReturnValue(value);
      randomize.click();
      await fixture.whenStable();
      expect(preview.innerHTML).not.toBe(before);
      expect(name.value).toBe('Барсик');
      expect(preview.querySelector('.caption')?.textContent?.trim()).toBe('Барсик');
      expect(root.querySelectorAll('.gallery-card')).toHaveLength(1);
      expect(card.innerHTML).toBe(savedCard);
      expect(localStorage.getItem(galleryStorageKey)).toBe(savedGallery);
    }
    expect(preview.querySelector('use[href*="#accessory-"]')).toBeNull();
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
