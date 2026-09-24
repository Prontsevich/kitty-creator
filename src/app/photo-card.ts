import { Component, input } from '@angular/core';
import { KittyIllustration } from './kitty-illustration';
import { Snapshot } from './kitty.model';

@Component({
  selector: 'app-photo-card',
  imports: [KittyIllustration],
  template:
    '<article class="gallery-card"><app-kitty-illustration [selection]="snapshot().selection" [name]="snapshot().name" /></article>',
  styles: ':host { display: block; min-width: 0; }',
})
export class PhotoCard {
  readonly snapshot = input.required<Snapshot>();
}
