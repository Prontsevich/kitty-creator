import { Component, input, output } from '@angular/core';
import { kittySpriteUrl } from './kitty.model';

interface Option {
  readonly id: string | null;
  readonly label: string;
}

@Component({
  selector: 'app-option-group',
  templateUrl: './option-group.html',
  styleUrl: './option-group.css',
})
export class OptionGroup {
  readonly kind = input.required<string>();
  readonly title = input.required<string>();
  readonly options = input.required<readonly Option[]>();
  readonly selected = input.required<string | null>();
  readonly selectedChange = output<string | null>();

  protected iconSymbol(id: string): string {
    return `${kittySpriteUrl}#${this.kind()}-${id}`;
  }
}
