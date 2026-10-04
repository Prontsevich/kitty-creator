import { Component } from '@angular/core';
import { TuiRoot } from '@taiga-ui/core';
import { KittyCreatorPage } from './features/kitty-creator/kitty-creator-page';

@Component({
  selector: 'app-root',
  imports: [TuiRoot, KittyCreatorPage],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
