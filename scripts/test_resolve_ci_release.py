"""Exercise the deployment gate without credentials or production access."""

import copy
import unittest

from resolve_ci_release import select_artifact, validate_run


class ReleaseGateTests(unittest.TestCase):
    def setUp(self):
        self.sha = "a" * 40
        self.repository = "Prontsevich/kitty-creator"
        self.workflow = {"id": 10}
        self.run = {
            "id": 20,
            "run_attempt": 2,
            "workflow_id": 10,
            "status": "completed",
            "conclusion": "success",
            "event": "push",
            "head_branch": "demo/random-kitty",
            "head_sha": self.sha,
            "path": ".github/workflows/ci.yml",
            "repository": {"full_name": self.repository},
            "head_repository": {"full_name": self.repository},
        }
        self.artifact = {
            "id": 30,
            "name": f"kitty-{self.sha}-20-2",
            "expired": False,
            "workflow_run": {"id": 20, "head_sha": self.sha},
        }

    def test_accepts_successful_trusted_run_and_exact_artifact(self):
        validate_run(self.run, self.workflow, self.repository, self.sha)
        self.assertEqual(select_artifact(self.run, [self.artifact], self.sha)["id"], 30)

    def test_rejects_failed_pending_wrong_branch_commit_event_or_workflow(self):
        for key, value in {
            "conclusion": "failure",
            "status": "in_progress",
            "head_branch": "main",
            "head_sha": "b" * 40,
            "event": "pull_request",
            "workflow_id": 11,
            "path": ".github/workflows/other.yml",
        }.items():
            with self.subTest(key=key):
                run = dict(self.run, **{key: value})
                with self.assertRaises(ValueError):
                    validate_run(run, self.workflow, self.repository, self.sha)

    def test_rejects_another_repository_and_fork(self):
        for key in ("repository", "head_repository"):
            with self.subTest(key=key):
                run = dict(self.run, **{key: {"full_name": "other/fork"}})
                with self.assertRaises(ValueError):
                    validate_run(run, self.workflow, self.repository, self.sha)

    def test_rejects_missing_expired_duplicate_and_previous_attempt_artifacts(self):
        expired = dict(self.artifact, expired=True)
        previous = dict(self.artifact, name=f"kitty-{self.sha}-20-1")
        for artifacts in ([], [expired], [self.artifact, self.artifact], [previous]):
            with self.subTest(artifacts=artifacts):
                with self.assertRaises(ValueError):
                    select_artifact(self.run, artifacts, self.sha)

    def test_rejects_artifact_from_another_run_or_commit(self):
        for key, value in (("id", 21), ("head_sha", "b" * 40)):
            artifact = copy.deepcopy(self.artifact)
            artifact["workflow_run"][key] = value
            with self.subTest(key=key):
                with self.assertRaises(ValueError):
                    select_artifact(self.run, [artifact], self.sha)


if __name__ == "__main__":
    unittest.main()
