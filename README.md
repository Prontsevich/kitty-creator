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

## CI/CD

`.github/workflows/ci-cd.yml` runs only on pushes to `main`. The `ci` job
installs locked dependencies, runs application tests and post-release helper
tests, and creates the production build. It adds `release.json` with the commit
SHA and uploads the build as an Actions artifact retained for seven days.
Repository users with Actions artifact access can download this candidate;
uploading it does not publish the site.

After successful CI, the `deploy` job automatically downloads that same build
and runs `scripts/deploy.sh`. There is no manual approval gate. Deployments use
the `kitty-production` concurrency group without cancelling an active deploy.

GitHub repository settings must contain:

| Kind | Name | Purpose |
| --- | --- | --- |
| Secret | `SSH_PRIVATE_KEY` | Private key authorized on the VPS |
| Variable | `SSH_HOST` | VPS hostname or IPv4 address |
| Variable | `SSH_PORT` | SSH port |
| Variable | `SSH_USER` | Deployment account |
| Variable | `SSH_KNOWN_HOSTS` | Verified host key entry, including the port when non-default |

The VPS must already have `/srv/www/kitty.s-pro.space/releases/` writable by the
deployment account and serve `/srv/www/kitty.s-pro.space/current` at
`https://kitty.s-pro.space`. SSH and rsync must be available to the runner and
VPS. Deployment copies the build into `releases/<full-commit-sha>`, switches
the `current` symlink, and checks the public release SHA, Angular HTML, JavaScript,
and styles. A failed public check fails the job without automatically rolling back.

An existing release directory is never overwritten, so rerunning deployment
for the same commit fails. Choose a known-good full commit SHA for a deliberate
rollback using `.github/workflows/rollback.yml`: open
**Actions → Rollback → Run workflow**, select
`main`, and enter the full lowercase 40-character SHA in `commit_sha`. Manual
runs execute only the `rollback` job; other branches skip it. The job uses the
same SSH settings and `kitty-production` concurrency group as deployment, runs
`bash scripts/rollback.sh "$RELEASE_SHA"`, and checks the public release and
assets. The selected `releases/<full-commit-sha>` directory must already exist
on the VPS. This restores the existing server release; it does not restore
browser localStorage. Server release directories remain available independently
of Actions artifact retention.

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

## Appearance

The app starts in dark mode. The header icon button switches between dark and light
modes and saves the choice under `kitty-creator:theme` in `localStorage`.
The saved theme is applied before Angular starts to avoid a light background flash.
If storage is blocked, theme switching still works for the current session.
Option tiles retain a light background for artwork contrast in both themes.
Portrait artwork and captured photos keep their original colors in both themes.

## Data and assets

Every snapshot stores its name and selected coat, expression, accessory, and background. New snapshots appear first, and capturing a snapshot scrolls the gallery back to the newest photo with a brief reveal animation. Reduced-motion preferences disable smooth scrolling and reveal animations. The Clear button asks for confirmation, then empties the gallery and removes its localStorage entry. The gallery is saved under `kitty-creator:snapshots:v1` in the current browser's `localStorage`. If storage is unavailable, the app keeps an in-memory gallery and shows a notice that changes may be lost after a reload.

The Dice button between the name field and camera button randomizes the coat,
expression, accessory, and background. Every click changes at least one setting,
clears the entered name, and preserves all gallery snapshots.

On desktop, the portrait, name field, Dice button, and camera button occupy the left column, with option groups in a two-by-two grid on the right. Each group's choices always use two columns, including on wide screens. On short desktop viewports, the header hides its helper text and panel spacing tightens to preserve tile and photo sizes. The gallery spans the full page width below the studio. The portrait adapts to viewport height to keep the studio visible on laptop screens. The gallery uses a horizontal thumbnail strip so additional snapshots do not increase page height. On narrow screens, options follow the capture controls and the gallery appears below them.

The preview and gallery cards compose the same symbols from `public/assets/kitty-creator/kitty-parts.svg`. The area outside the white photo card is transparent, and the cat layers deliberately cross the photo border without an extra white contour. The source sprite and its symbol contract are maintained in the adjacent `kitty-creator-assets` directory.
