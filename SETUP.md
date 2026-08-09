# Profile setup

The profile works with the repository-scoped `GITHUB_TOKEN` by default. That is enough for public activity and for the anonymized private contribution setting already exposed by GitHub.

## Optional private aggregate statistics

To include private-repository activity in summary cards without publishing private repository details:

1. Create a fine-grained GitHub token with read-only access to the private repositories you want counted.
2. Grant `Contents: read`, `Issues: read`, `Pull requests: read`, and `Metadata: read`.
3. Add it to this repository as an Actions secret named `SUMMARY_GITHUB_TOKEN`.
4. In GitHub profile settings, enable `Include private contributions on my profile`.
5. Run `Update profile summary cards` manually once from the Actions tab.

The workflow only passes the token to the upstream summary-card action. No token is committed to the repository, and the README displays aggregate cards only. Private repository names, descriptions, commit messages, branches, issue or pull-request titles, URLs, and code are not published.

## 3D contribution graph

Run `Update 3D contribution profile` once manually after the first setup. It refreshes the pinned upstream night-view SVG and commits only when the generated file changes.
