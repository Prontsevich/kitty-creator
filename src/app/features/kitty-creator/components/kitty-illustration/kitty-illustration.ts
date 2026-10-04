import { Component, computed, input } from '@angular/core';
import { KittySelection, kittySpriteUrl } from '../../model/kitty.model';

@Component({
  selector: 'app-kitty-illustration',
  templateUrl: './kitty-illustration.html',
  styleUrl: './kitty-illustration.css',
})
export class KittyIllustration {
  readonly selection = input.required<KittySelection>();
  readonly name = input.required<string>();

  protected readonly accessibleLabel = computed(() => 'Котик «' + this.name() + '»');

  protected symbol(name: string): string {
    return kittySpriteUrl + '#' + name;
  }
}
