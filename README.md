# Kitty Creator

A single-page Angular app for building a cat portrait and keeping snapshots in a local gallery.

## Stack

- Angular 22 with standalone components
- Taiga UI 5 for the name field, capture button, and storage notice
- TypeScript, CSS, and browser `localStorage`
- Production SVG sprite from `../kitty-creator-assets/kitty-parts.svg`

## Run locally

Use the Node.js version in `.nvmrc` and npm.

```bash
npm ci
npm start
```

Open `http://localhost:4200/`.

## Verify

```bash
npm run test:ci
npm run build
```

The production output is written to `dist/kitty-creator/browser/`.

## Project structure

`src/app` contains the application shell (`App`) and application configuration.
The shell provides `tui-root` and renders `KittyCreatorPage`.

All kitty creator functionality lives in `src/app/features/kitty-creator/`:

- `kitty-creator-page.*` assembles the screen and manages the current selection,
  name, and capture action.
- `components/` contains `kitty-illustration`, `option-group`, and `photo-card`.
  Each component keeps its TypeScript, template, styles, and tests together;
  small templates and styles may remain inline.
- `model/kitty.model.ts` defines the available options, types, defaults, and
  validation functions.
- `state/gallery.store.*` manages gallery snapshots and localStorage persistence.

Tests live alongside the code they cover. Components and state remain local to
this feature until another feature needs to reuse them.

## Data and assets

Every snapshot stores its name and selected coat, expression, accessory, and background. New snapshots appear first, and capturing a snapshot scrolls the gallery back to the newest photo with a brief reveal animation. Reduced-motion preferences disable smooth scrolling and reveal animations. The Clear button asks for confirmation, then empties the gallery and removes its localStorage entry. The gallery is saved under `kitty-creator:snapshots:v1` in the current browser's `localStorage`. If storage is unavailable, the app keeps an in-memory gallery and shows a notice that changes may be lost after a reload.

On desktop, the portrait, name field, camera button, and gallery share the left column, with options on the right. The portrait adapts to viewport height to keep the studio visible on laptop screens. The gallery uses a horizontal thumbnail strip so additional snapshots do not increase page height. On narrow screens, options follow the capture controls and the gallery appears below them.

The preview and gallery cards compose the same symbols from `public/assets/kitty-creator/kitty-parts.svg`. The area outside the white photo card is transparent, and the cat layers deliberately cross the photo border without an extra white contour. The source sprite and its symbol contract are maintained in the adjacent `kitty-creator-assets` directory.
