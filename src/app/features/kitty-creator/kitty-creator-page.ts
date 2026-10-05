import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiInput } from '@taiga-ui/core';
import { TuiToast } from '@taiga-ui/kit';
import { GalleryStore } from './state/gallery.store';
import { KittyIllustration } from './components/kitty-illustration/kitty-illustration';
import { OptionGroup } from './components/option-group/option-group';
import { PhotoCard } from './components/photo-card/photo-card';
import {
  accessories,
  backgrounds,
  coats,
  defaultSelection,
  faces,
  isKittySelection,
  KittySelection,
} from './model/kitty.model';

@Component({
  selector: 'app-kitty-creator-page',
  imports: [FormsModule, TuiButton, TuiInput, TuiToast, KittyIllustration, OptionGroup, PhotoCard],
  templateUrl: './kitty-creator-page.html',
  styleUrl: './kitty-creator-page.css',
})
export class KittyCreatorPage {
  private readonly document = inject(DOCUMENT);
  protected readonly theme = signal(this.readTheme());

  private readTheme(): 'dark' | 'light' {
    try {
      return this.document.defaultView?.localStorage.getItem('kitty-creator:theme') === 'light'
        ? 'light'
        : 'dark';
    } catch {
      return 'dark';
    }
  }

  constructor() {
    this.applyTheme();
  }

  private applyTheme(): void {
    this.document.documentElement.dataset['theme'] = this.theme();
    this.document.documentElement.setAttribute('tuiTheme', this.theme());
  }

  protected toggleTheme(): void {
    this.theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
    this.applyTheme();
    try {
      this.document.defaultView?.localStorage.setItem('kitty-creator:theme', this.theme());
    } catch {
      // Theme switching remains available when browser storage is blocked.
    }
  }

  private readonly injector = inject(Injector);
  private readonly galleryStrip = viewChild<ElementRef<HTMLDivElement>>('galleryStrip');
  protected readonly gallery = inject(GalleryStore);
  protected readonly latestCaptureId = signal<string | null>(null);
  protected readonly selection = signal<KittySelection>({ ...defaultSelection });
  protected readonly coats = coats;
  protected readonly faces = faces;
  protected readonly accessories = accessories;
  protected readonly backgrounds = backgrounds;
  protected name = 'Мой котик';

  protected get displayName(): string {
    return this.name.trim() || 'Мой котик';
  }

  protected setOption(kind: keyof KittySelection, value: string | null): void {
    const next = { ...this.selection(), [kind]: value };
    if (isKittySelection(next)) this.selection.set(next);
  }

  protected randomize(): void {
    const current = this.selection();
    const pick = <T>(options: readonly { id: T }[]): T =>
      options[Math.floor(Math.random() * options.length)].id;
    const next: KittySelection = {
      coat: pick(coats),
      face: pick(faces),
      accessory: pick(accessories),
      background: pick(backgrounds),
    };

    if (
      next.coat === current.coat &&
      next.face === current.face &&
      next.accessory === current.accessory &&
      next.background === current.background
    ) {
      next.coat = pick(coats.filter((option) => option.id !== current.coat));
    }

    this.selection.set(next);
    this.name = '';
  }

  protected capture(): void {
    const snapshot = this.gallery.add(this.name, this.selection());
    this.latestCaptureId.set(snapshot.id);
    afterNextRender(
      {
        write: () => {
          const strip = this.galleryStrip()?.nativeElement;
          if (strip) strip.scrollLeft = 0;
        },
      },
      { injector: this.injector },
    );
  }

  protected clearGallery(): void {
    if (window.confirm('Удалить все снимки из Галереи?')) {
      this.gallery.clear();
      this.latestCaptureId.set(null);
    }
  }
}
