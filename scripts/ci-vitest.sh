#!/usr/bin/env sh
# GitLab CI: run a fast Vitest subset on merge requests (--changed vs target branch),
# or the full unit suite for push/default-branch pipelines.
# Requires git and pnpm; run from repo root.
set -eu

APP="${1:?usage: ci-vitest.sh <admin|client>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

run_full() {
  echo "CI: full unit test run (${APP})"
  pnpm --filter "${APP}" test:unit
}

# Merge request pipelines: tests affected by diff vs MR target (usually develop).
if [ "${CI_PIPELINE_SOURCE:-}" = "merge_request_event" ] && [ -n "${CI_MERGE_REQUEST_TARGET_BRANCH_NAME:-}" ]; then
  TARGET="${CI_MERGE_REQUEST_TARGET_BRANCH_NAME}"
  echo "CI: merge request → fetching origin/${TARGET} for vitest --changed"
  git fetch origin "${TARGET}" || {
    echo "WARN: git fetch origin ${TARGET} failed; falling back to full unit tests"
    run_full
    exit 0
  }
  REF="origin/${TARGET}"
  if ! git rev-parse --verify "${REF}" >/dev/null 2>&1; then
    echo "WARN: ${REF} not found after fetch; falling back to full unit tests"
    run_full
    exit 0
  fi
  echo "CI: vitest run --changed ${REF} (${APP})"
  pnpm --filter "${APP}" exec vitest run --changed "${REF}" --passWithNoTests
  exit 0
fi

run_full
