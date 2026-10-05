# Trial delivery and rollback

These workflows target `https://kitty.s-pro.space` from the trusted
`demo/random-kitty` branch only. They use the existing SSH helpers and publish
static files under `/srv/www/kitty.s-pro.space/releases/<full-commit-sha>`.
The web server must serve `/srv/www/kitty.s-pro.space/current`.

## Prerequisites

- The SSH account can create release directories, upload with rsync, and atomically
  replace the `current` symlink. The server has rsync and GNU `mv` (`mv -T`).
- Host keys are supplied through `SSH_KNOWN_HOSTS`; host key verification is required.
- The GitHub Environment is `prod`. It currently has no protection rules, so a
  successful check job proceeds directly to deployment without manual approval.
- Configure `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, and
  `SSH_KNOWN_HOSTS` as Environment secrets in `prod`. The existing repository secrets
  of these names also work, but Environment secrets limit their availability to
  jobs using `prod`. Enter values directly in GitHub; never put them in code.
- Manual rollback dispatch requires the workflow to exist on the repository's default branch.
  For a trial confined to this branch, temporarily set the default branch to
  `demo/random-kitty` after explicit operator approval, then restore `main` when
  the trial finishes. Otherwise add the workflows to `main` before manual dispatch.
  The CI/CD push trigger and rollback job filter require `demo/random-kitty`.

## Candidate build

A push to `demo/random-kitty` runs `.github/workflows/ci-cd.yml`: npm installation,
unit tests, production build, and public release helper tests. CI adds `release.json`
with the commit SHA, repository, CI run ID, and attempt, then packages the browser
output with a SHA-256 checksum. The Actions artifact is named
`kitty-<sha>-<run-id>-<attempt>` and retained for 30 days.

Repository users with appropriate access can download this artifact from the
CI/CD run for inspection. No SSH secrets are used by the check job.

## Deploy

Commit and push changes to `demo/random-kitty`, then watch the **CI/CD** run.
The `deploy` job depends on `check` through `needs: check`. Every successful check
automatically proceeds to publication; there is no Deploy button or approval step.
Failed tests, build, helper tests, or artifact upload prevent deployment.

The check job passes the uploaded artifact ID directly to deploy within the same
workflow run. Deploy verifies its digest, archive checksum, commit SHA, repository,
and run ID, then publishes without rebuilding or searching another workflow.
This also permits a failed deploy job to reuse its successful check job's artifact
when rerun. Later pushes cannot change the commit or artifact of an active run.

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

CI/CD and rollback share the `kitty-prod` concurrency group and do not cancel an
active operation. The whole CI/CD run is serialized with rollback. GitHub may
replace an older pending run with a newer one during rapid pushes; the active
deployment completes and the newest pending update runs next.

## Observe the result

```bash
gh run list --branch demo/random-kitty --limit 5
gh run view RUN_ID --log-failed
curl --fail https://kitty.s-pro.space/release.json
```

Confirm the chosen SHA and open the site for a browser smoke check. Record the last
known-good deployment SHA before trying another version. A successful check job
proves the configured tests/build; a successful CI/CD run additionally proves the
public version marker and HTTP asset checks at the time of that run.
