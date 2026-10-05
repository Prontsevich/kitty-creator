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
  curl --fail --silent --show-error --retry 3 --retry-delay 2 \
    "https://kitty.s-pro.space/?run=${GITHUB_RUN_ID:-manual}" > "$RUNNER_TEMP/kitty-index.html"
  python3 - "$RUNNER_TEMP/kitty-index.html" <<'PY'
from html.parser import HTMLParser
from pathlib import Path
import subprocess, sys
from urllib.parse import urljoin, urlparse

class Page(HTMLParser):
    app_root = False
    scripts = []
    styles = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'app-root':
            self.app_root = True
        if tag == 'script' and attrs.get('src'):
            self.scripts.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet' and attrs.get('href'):
            self.styles.append(attrs['href'])

page = Page()
page.feed(Path(sys.argv[1]).read_text())
if not page.app_root or not page.scripts:
    raise SystemExit('Public page does not contain the Angular app')
for asset in page.scripts + page.styles:
    url = urljoin('https://kitty.s-pro.space/', asset)
    if urlparse(url).netloc != 'kitty.s-pro.space' or urlparse(url).scheme != 'https':
        raise SystemExit('Unexpected public asset origin')
    subprocess.run(['curl', '--fail', '--silent', '--show-error',
                    '--output', '/dev/null', url], check=True)
print('Public HTML, JavaScript and styles are reachable')
PY
}
