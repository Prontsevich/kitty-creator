#!/usr/bin/env python3
"""Resolve one successful trusted CI run to its immutable release artifact."""

import json
import os
import re
import subprocess
import sys


def validate_run(run, workflow, repository, sha):
    expected = {
        "status": "completed",
        "conclusion": "success",
        "event": "push",
        "head_branch": "demo/random-kitty",
        "head_sha": sha,
        "workflow_id": workflow["id"],
    }
    for key, value in expected.items():
        if run.get(key) != value:
            raise ValueError(f"CI run has an unexpected {key}")
    if run.get("path") != ".github/workflows/ci.yml":
        raise ValueError("Unexpected CI workflow path")
    for key in ("repository", "head_repository"):
        if (run.get(key) or {}).get("full_name") != repository:
            raise ValueError(f"Unexpected {key}")


def select_artifact(run, artifacts, sha):
    name = f"kitty-{sha}-{run['id']}-{run['run_attempt']}"
    matches = [artifact for artifact in artifacts if artifact["name"] == name]
    if len(matches) != 1 or matches[0].get("expired", True):
        raise ValueError("Expected exactly one retained artifact from this CI attempt")
    artifact = matches[0]
    identity = artifact.get("workflow_run") or {}
    if identity.get("id") != run["id"] or identity.get("head_sha") != sha:
        raise ValueError("Artifact does not belong to the selected commit and CI run")
    return artifact


def api(path, paginate=False):
    command = ["gh", "api", path]
    if paginate:
        command += ["--paginate", "--slurp"]
    return json.loads(subprocess.check_output(command, text=True))


def main():
    run_id, sha = sys.argv[1:]
    if not re.fullmatch(r"[1-9][0-9]*", run_id):
        raise ValueError("Expected a numeric CI run ID")
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise ValueError("Expected a full commit SHA")
    repository = os.environ["GITHUB_REPOSITORY"]
    workflow = api(f"repos/{repository}/actions/workflows/ci.yml")
    run = api(f"repos/{repository}/actions/runs/{run_id}")
    validate_run(run, workflow, repository, sha)
    pages = api(f"repos/{repository}/actions/runs/{run_id}/artifacts?per_page=100", True)
    artifact = select_artifact(run, [item for page in pages for item in page["artifacts"]], sha)
    with open(os.environ["GITHUB_OUTPUT"], "a") as output:
        output.write(f"sha={sha}\nartifact_id={artifact['id']}\n")
    print(f"Verified CI run {run_id}, commit {sha}, artifact {artifact['id']}")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, subprocess.CalledProcessError) as error:
        sys.exit(str(error))
