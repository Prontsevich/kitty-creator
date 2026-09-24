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

## Data and assets

Every snapshot stores its name and selected coat, expression, accessory, and background. New snapshots appear first. The gallery is saved under `kitty-creator:snapshots:v1` in the current browser's `localStorage`. If storage is unavailable, snapshots remain usable until the page is reloaded and the app shows a notice.

The preview and gallery cards compose the same symbols from `public/assets/kitty-creator/kitty-parts.svg`. The area outside the white photo card is transparent, and the cat layers deliberately cross the photo border without an extra white contour. The source sprite and its symbol contract are maintained in the adjacent `kitty-creator-assets` directory.
