#!/usr/bin/env bash
# Checks a pull_request event payload against the tracking rules in CONTRIBUTING.md#issues:
# exactly one type label, a severity on a bug, and a closing reference to the issue it resolves.
# A `breaking` PR must also carry a "### Breaking changes" section in the version CHANGELOG.md is
# preparing, and that version must be a major over the last released one; that is the one rule here
# that reads the checkout, and only those two text files. Needs no token and runs locally on a
# saved event:
#   .github/scripts/pr-hygiene.sh path/to/event.json [checkout root, default .]
set -euo pipefail

event=${1:?usage: pr-hygiene.sh <event.json> [checkout root]}
root=${2:-.}
author=$(jq -r '.pull_request.user.login' "$event")
labels=$(jq -r '.pull_request.labels[].name' "$event")
body=$(jq -r '.pull_request.body // ""' "$event")

# Dependabot opens its own PRs with its own labels; they close no issue.
if [[ $author == "dependabot[bot]" ]]; then
  echo "Dependabot PR, not checked."
  exit 0
fi

problems=()

types=$(grep -cxE 'bug|enhancement|documentation|tests|chore' <<<"$labels" || true)
if (( types != 1 )); then
  problems+=("Needs exactly one type label (bug, enhancement, documentation, tests, chore); it has $types.")
fi

if grep -qx bug <<<"$labels" && ! grep -q '^severity/' <<<"$labels"; then
  problems+=("A bug needs a severity/* label (critical, high, medium, low).")
fi

# GitHub's closing keywords, with #n or owner/repo#n. Only these link the PR to its issue.
closing='\b(close[sd]?|fix(e[sd])?|resolve[sd]?):? +([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)?#[0-9]+'
if ! grep -qiE "$closing" <<<"$body"; then
  problems+=("The description needs a closing reference to its issue, such as 'Closes #12'.")
fi

# A breaking change needs a major and a section that says what to change. package.json holds the
# last *released* version, because the bump is a deliberate step at release time
# (CONTRIBUTING.md#changelog) — so the version being prepared is CHANGELOG.md's top section, which
# is either a major above it, or equal to it once the release PR has bumped both.
if grep -qx breaking <<<"$labels"; then
  released=$(jq -r '.version' "$root/package.json")
  preparing=$(sed -n 's/^## \([0-9][0-9.]*\).*/\1/p' "$root/CHANGELOG.md" | head -n1)
  if [[ -z $preparing ]]; then
    problems+=("CHANGELOG.md has no '## x.y.z' section to read.")
  else
    if [[ $preparing != "$released" && ${preparing%%.*} -le ${released%%.*} ]]; then
      problems+=("A breaking change needs a major, but CHANGELOG.md prepares $preparing over the released $released. Open the next major's section (CONTRIBUTING.md#changelog).")
    fi
    # The prepared version's section, down to the next version heading.
    section=$(awk -v version="$preparing" '
      BEGIN { heading = "^## " version "( |$|\\()" }
      $0 ~ heading { found = 1; next }
      found && /^## / { exit }
      found { print }
    ' "$root/CHANGELOG.md")
    if ! grep -qE '^### Breaking changes[[:space:]]*$' <<<"$section"; then
      problems+=("This PR is labelled breaking, but CHANGELOG.md's $preparing section has no '### Breaking changes' section saying what a consumer has to change (CONTRIBUTING.md#changelog).")
    fi
  fi
fi

if (( ${#problems[@]} )); then
  printf '::error::%s\n' "${problems[@]}"
  echo "See the label legend in CONTRIBUTING.md#labels and the pinned Roadmap issue."
  exit 1
fi
echo "Labels and issue link are in order."
