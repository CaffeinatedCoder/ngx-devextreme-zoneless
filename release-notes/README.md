# Release notes

One file per released version, `<version>.md`, holding the body of that version's GitHub
release — the condensed read of the version's `CHANGELOG.md` section, in the shape
[CONTRIBUTING.md](../CONTRIBUTING.md#the-github-release) describes.

The file is written while the release is prepared, reviewed in the release pull request
like anything else, and published verbatim by `.github/workflows/release.yml` once the
tag's npm publish succeeds. When a version has no file here the workflow still creates
its release, as a **draft** built from the raw changelog section, so an omission is
visible on the releases page rather than producing nothing at all — which is how 4.0.0
and 4.1.0 came to sit on npm for weeks with no release page behind them.

`4.0.0.md` and `4.1.0.md` are the bodies those two releases were backfilled with on
2026-10-26, kept so the shape has a worked example and so the published text has a
source in the repository. Versions before 4.0.0 have no file; v3.0.0's page was written
by hand and v1.0.0 through v2.1.0 have no release page at all.
