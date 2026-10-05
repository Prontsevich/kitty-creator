#!/usr/bin/env bash
set -euo pipefail

: "${SSH_HOST:?SSH_HOST is required}"
: "${SSH_PORT:?SSH_PORT is required}"
: "${SSH_USER:?SSH_USER is required}"
: "${SSH_PRIVATE_KEY:?SSH_PRIVATE_KEY is required}"
: "${SSH_KNOWN_HOSTS:?SSH_KNOWN_HOSTS is required}"
: "${RUNNER_TEMP:?Run this helper on a GitHub Actions runner}"
[[ "$SSH_HOST" =~ ^[a-zA-Z0-9.-]+$ ]] || exit 2
[[ "$SSH_PORT" =~ ^[0-9]+$ ]] || exit 2
[[ "$SSH_USER" =~ ^[a-zA-Z0-9_-]+$ ]] || exit 2

SSH_DIR="$RUNNER_TEMP/kitty-ssh"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"
printf '%s\n' "$SSH_PRIVATE_KEY" > "$SSH_DIR/key"
printf '%s\n' "$SSH_KNOWN_HOSTS" > "$SSH_DIR/known_hosts"
chmod 600 "$SSH_DIR/key" "$SSH_DIR/known_hosts"

ssh_remote() {
  ssh -i "$SSH_DIR/key" -p "$SSH_PORT" \
    -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes \
    -o "UserKnownHostsFile=$SSH_DIR/known_hosts" "$SSH_USER@$SSH_HOST" "$@"
}

printf -v SSH_RSH 'ssh -i %q -p %q -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=%q' \
  "$SSH_DIR/key" "$SSH_PORT" "$SSH_DIR/known_hosts"

verify_public_release() {
  local release="$1"
  curl --fail --silent --show-error --retry 3 --retry-delay 2 \
    "https://kitty.s-pro.space/release.json?run=${GITHUB_RUN_ID:-manual}" > "$RUNNER_TEMP/kitty-release.json"
  python3 - "$RUNNER_TEMP/kitty-release.json" "$release" <<'PY'
import json, sys
with open(sys.argv[1]) as stream:
    actual = json.load(stream)['release']
if actual != sys.argv[2]:
    raise SystemExit(f'Expected release {sys.argv[2]}, received {actual}')
print(f'Public release confirmed: {actual}')
PY
}
