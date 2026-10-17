# MangaDex for Paperback 0.8

Personal, independently maintained MangaDex source for Paperback iOS 0.8.

> **Prototype only. Not yet verified to compile, deploy or install in Paperback.** Do not add the GitHub repository URL to Paperback: Paperback expects a published source repository with versioning metadata.

## Contents
- `src/MangaDex/MangaDex.ts`: MangaDex API search, manga, chapter and page fetching
- `package.json`: Paperback 0.8-era dependencies
- `.github/workflows/publish.yml`: attempted build and GitHub Pages publishing

## Remaining work
1. Verify and correct source interfaces against the exact Paperback 0.8 toolchain.
2. Add a valid `src/MangaDex/icon.png` asset (currently missing from GitHub).
3. Run the GitHub Actions build and fix errors.
4. Confirm the actual build output folder and update `publish_dir` if needed.
5. Enable GitHub Pages for the `gh-pages` branch and verify that `versioning.json` exists.
6. Add the published Pages URL in Paperback Settings > External Sources, then test search and reading.

This is unofficial and not affiliated with MangaDex or Paperback. Respect MangaDex API terms and content licences.
