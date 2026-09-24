import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiInput, TuiRoot } from '@taiga-ui/core';
import { TuiToast } from '@taiga-ui/kit';
import { GalleryStore } from './gallery.store';
import { KittyIllustration } from './kitty-illustration';
import { OptionGroup } from './option-group';
import { PhotoCard } from './photo-card';
import {
  accessories,
  backgrounds,
  coats,
  defaultSelection,
  faces,
  isKittySelection,
  KittySelection,
} from './kitty.model';

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    TuiRoot,
    TuiButton,
    TuiInput,
    TuiToast,
    KittyIllustration,
    OptionGroup,
    PhotoCard,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
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
