#!/usr/bin/env bash
# Creates the GitHub release for a version whose npm publish has just succeeded, from the
# reviewed notes in release-notes/<version>.md (CONTRIBUTING.md#the-github-release).
#
# When that file is absent the release is still created, as a DRAFT built from the version's
# CHANGELOG.md section, so a missing condensation shows up on the releases page instead of
# producing nothing at all — which is how 4.0.0 and 4.1.0 sat on npm for weeks with no release
# page behind them (#5). The release body is editorial, so this never publishes a generated one.
#
# Runs locally against a stubbed `gh` on PATH:
#   .github/scripts/create-release.sh 4.1.0 [checkout root, default .]
set -euo pipefail

version=${1:?usage: create-release.sh <version> [checkout root]}
root=${2:-.}
tag="v$version"
notes="$root/release-notes/$version.md"
changelog="$root/CHANGELOG.md"

# The version being released is normally the newest section of the changelog. Only then does this
# release take "Latest" on the releases page, so a patch cut on an older line can never steal it.
newest=$(sed -n 's/^## \([0-9][0-9.]*\).*/\1/p' "$changelog" | head -n1)
if [[ $version == "$newest" ]]; then
  latest=--latest
else
  latest=--latest=false
fi

if [[ -f $notes ]]; then
  echo "Publishing $tag from $notes ($latest)."
  gh release create "$tag" --title "$tag" --notes-file "$notes" --verify-tag "$latest"
  exit 0
fi

# No reviewed notes. Fall back to the raw section, as a draft for someone to condense.
section=$(awk -v version="$version" '
  BEGIN { heading = "^## " version "( |$|\\()" }
  $0 ~ heading { found = 1; next }
  found && /^## / { exit }
  found { print }
' "$changelog")

if [[ -z ${section//[[:space:]]/} ]]; then
  echo "No $notes, and no '## $version' section in CHANGELOG.md to fall back to." >&2
  exit 1
fi

draft=$(mktemp)
{
  echo "_No reviewed notes were written for $version, so this draft holds the raw changelog"
  echo "section. Condense it per CONTRIBUTING.md#the-github-release, then publish._"
  echo
  printf '%s\n' "$section"
} >"$draft"

echo "No $notes — creating $tag as a DRAFT from its changelog section."
gh release create "$tag" --title "$tag" --notes-file "$draft" --verify-tag --draft
