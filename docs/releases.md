# Trial delivery and rollback

These workflows target `https://kitty.s-pro.space` from the trusted
`demo/random-kitty` branch only. They use the existing SSH helpers and publish
static files under `/srv/www/kitty.s-pro.space/releases/<full-commit-sha>`.
The web server must serve `/srv/www/kitty.s-pro.space/current`.

## Prerequisites

- The SSH account can create release directories, upload with rsync, and atomically
  replace the `current` symlink. The server has rsync and GNU `mv` (`mv -T`).
- Host keys are supplied through `SSH_KNOWN_HOSTS`; host key verification is required.
- The GitHub Environment is `prod`. It currently has no protection rules; approval
  is the operator deliberately starting a workflow, not a reviewer gate.
- Configure `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, and
  `SSH_KNOWN_HOSTS` as Environment secrets in `prod`. The existing repository secrets
  of these names also work, but Environment secrets limit their availability to
  jobs using `prod`. Enter values directly in GitHub; never put them in code.
- Manual dispatch requires the workflow to exist on the repository's default branch.
  For a trial confined to this branch, temporarily set the default branch to
  `demo/random-kitty` after explicit operator approval, then restore `main` when
  the trial finishes. Otherwise add the workflows to `main` before manual dispatch.
  The deploy and rollback job filters still require `demo/random-kitty`.

## Candidate build

A push to `demo/random-kitty` runs `.github/workflows/ci.yml`: npm installation,
unit tests, production build, and deployment identity tests. CI adds `release.json`
with the commit SHA, repository, CI run ID, and attempt, then packages the browser
output with a SHA-256 checksum. The Actions artifact is named
`kitty-<sha>-<run-id>-<attempt>` and retained for 30 days.

This artifact is a candidate for review, not a deployment. Repository users with
appropriate access can download it from the CI run. No SSH secrets are used by CI.
Runs created before artifact packaging was added cannot be promoted.

## Deploy

1. Commit and push the workflow changes to `demo/random-kitty`.
2. Open a successful **CI** run and review its commit and candidate artifact.
3. Start **Deploy**, select `demo/random-kitty`, and click **Run workflow**.
   There are no release inputs to copy. The workflow captures the branch commit
   at dispatch time and automatically finds its latest CI run. If that run is
   unfinished or failed, deployment stops; it never falls back to an older commit
   or an older successful run. Wait for CI or fix it, then start Deploy again.

CLI equivalent:

```bash
gh workflow run deploy.yml --ref demo/random-kitty
```

The preflight job rejects failed or unfinished runs, another workflow/repository,
fork code, pull request events, another branch/commit, expired artifacts, and
artifacts from a different run attempt. The deploy job downloads the exact artifact
ID, verifies its digest, archive checksum, and release metadata, and does not rebuild.
Starting this workflow deliberately publishes the selected version to the target.
The run summary links to the chosen commit and CI run. Later pushes do not change
the commit captured by this deployment request.

The helper creates a new release directory, uploads files, switches `current`, and
checks the public release marker plus HTML, JavaScript, and stylesheet availability.
This HTTP smoke check does not replace browser interaction tests.

Existing directories are never overwritten. Rerunning deploy for an existing SHA
fails; use rollback to reactivate a complete retained release. If upload or a smoke
check fails, inspect the run and the server before retrying. A failed upload may leave
a partial release directory; evidence and directories are not deleted automatically.
If the public check fails after the symlink switch, the new release can already be live.

## Rollback

Choose a full SHA from a previously successful deployment, verify its compatibility
with the current browser snapshot format, and start **Rollback** on `demo/random-kitty`.

```bash
gh workflow run rollback.yml --ref demo/random-kitty \
  -f release_sha=KNOWN_GOOD_FULL_COMMIT_SHA
```

Rollback requires the selected release's `index.html` and `release.json` on the
server. It switches `current` and performs the same public version and HTTP checks.
It does not need the original Actions artifact, so its 30-day expiry does not prevent
rollback while the server directory remains intact. Server releases are retained
until explicitly removed; there is no automatic cleanup or automatic rollback.

This app has no server database migrations. Rollback changes app files only; browser
localStorage and Git history stay unchanged. An older app must still understand the
stored snapshot format. A restored app does not undo data written by a newer version.

Deploy and rollback share the `kitty-prod` concurrency group and do not cancel an
active operation. GitHub may replace an older pending operation with a newer one;
do not submit a queue of release requests and assume all will execute.

## Observe the result

```bash
gh run list --branch demo/random-kitty --limit 5
gh run view RUN_ID --log-failed
curl --fail https://kitty.s-pro.space/release.json
```

Confirm the chosen SHA and open the site for a browser smoke check. Record the last
known-good deployment SHA before trying another version. A successful CI run proves
the configured tests/build; a successful delivery run additionally proves the public
version marker and HTTP asset checks at the time of that run.
