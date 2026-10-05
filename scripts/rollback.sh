#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/ssh-common.sh"

release="${1:?Choose the known-good release directory}"
[[ "$release" =~ ^[0-9a-f]{40}$ ]] || { echo 'Expected a full commit SHA' >&2; exit 2; }
root=/srv/www/kitty.s-pro.space
ssh_remote "set -eu; test -s '$root/releases/$release/index.html'; test -s '$root/releases/$release/release.json'; ln -s 'releases/$release' '$root/.current-${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-1}'; mv -Tf '$root/.current-${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-1}' '$root/current'"
verify_public_release "$release"
echo "Restored $release; Git history and browser localStorage are unchanged."
