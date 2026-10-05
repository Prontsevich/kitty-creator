"""Test post-release checks against a fake HTTP client without network access."""

import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


class PublicReleaseTests(unittest.TestCase):
    def verify(self, actual="a" * 40, page=None, asset_status=0):
        if page is None:
            page = '<app-root></app-root><script src="main.js"></script>'
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            curl = root / "curl"
            curl.write_text(
                "#!/usr/bin/env python3\n"
                "import os, sys\n"
                "if '--output' in sys.argv:\n"
                "    sys.exit(int(os.environ['MOCK_ASSET_STATUS']))\n"
                "if '/release.json?' in sys.argv[-1]:\n"
                "    print(os.environ['MOCK_RELEASE'])\n"
                "else:\n"
                "    print(os.environ['MOCK_PAGE'])\n"
            )
            curl.chmod(0o755)
            environment = dict(os.environ, **{
                "PATH": f"{root}:{os.environ['PATH']}",
                "RUNNER_TEMP": str(root),
                "SSH_HOST": "example.invalid",
                "SSH_PORT": "22",
                "SSH_USER": "test",
                "SSH_PRIVATE_KEY": "test-only",
                "SSH_KNOWN_HOSTS": "test-only",
                "MOCK_RELEASE": json.dumps({"release": actual}),
                "MOCK_PAGE": page,
                "MOCK_ASSET_STATUS": str(asset_status),
            })
            helper = Path(__file__).with_name("ssh-common.sh").resolve()
            return subprocess.run(
                ["bash", "-c", 'source "$1"; verify_public_release "$2"',
                 "test", str(helper), "a" * 40],
                env=environment, capture_output=True, text=True,
            )

    def test_accepts_matching_release_and_reachable_app(self):
        self.assertEqual(self.verify().returncode, 0)

    def test_rejects_wrong_release(self):
        self.assertNotEqual(self.verify(actual="b" * 40).returncode, 0)

    def test_rejects_missing_app_and_cross_origin_assets(self):
        for page in ("<html>Error</html>", '<app-root></app-root>',
                     '<app-root></app-root><script src="https://other.invalid/main.js"></script>'):
            with self.subTest(page=page):
                self.assertNotEqual(self.verify(page=page).returncode, 0)

    def test_rejects_unreachable_script(self):
        self.assertNotEqual(self.verify(asset_status=22).returncode, 0)


if __name__ == "__main__":
    unittest.main()
