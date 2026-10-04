import { Component, inject, signal } from '@angular/core';
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
  protected readonly gallery = inject(GalleryStore);
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

  protected capture(): void {
    this.gallery.add(this.name, this.selection());
  }
}
