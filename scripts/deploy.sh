#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/ssh-common.sh"

release="${1:?Provide the full commit SHA}"
[[ "$release" =~ ^[0-9a-f]{40}$ ]] || { echo 'Expected a full commit SHA' >&2; exit 2; }
root=/srv/www/kitty.s-pro.space
target="$root/releases/$release"
test -f build/index.html
test -f build/release.json

# Each teaching deployment uses a new commit. Reusing an existing release is
# a rollback operation; do not overwrite a published directory on a rerun.
ssh_remote "test ! -e '$target' && mkdir '$target'"
rsync -rz --chmod=D755,F644 -e "$SSH_RSH" build/ "$SSH_USER@$SSH_HOST:$target/"
ssh_remote "set -eu; test -s '$target/index.html'; test -s '$target/release.json'; ln -s 'releases/$release' '$root/.current-${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-1}'; mv -Tf '$root/.current-${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-1}' '$root/current'"
verify_public_release "$release"
echo "Published $release"
