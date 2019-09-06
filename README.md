# mysticatea-actions/gh-pages

[![Build Status](https://github.com/mysticatea-actions/gh-pages/workflows/CI/badge.svg)](https://github.com/mysticatea-actions/gh-pages/actions)
[![Dependency Status](https://david-dm.org/mysticatea-actions/gh-pages.svg)](https://david-dm.org/mysticatea-actions/gh-pages)

An action that publishes GitHub Pages with a directory.

## 📖 Usage

Configure your workflow.

### Action Name

`mysticatea-actions/gh-pages@v0`

### Parameters

| Name            | Description                                                                              |
| :-------------- | :--------------------------------------------------------------------------------------- |
| token           | Required. GitHub Token to push.                                                          |
| sourceDir       | Required. The directory that contains the contents of GitHub Pages.                      |
| commitUserName  | Optional. The name of commit user. Default is `$GITHUB_ACTOR`.                           |
| commitUserEmail | Optional. The email of commit user. Default is `$GITHUB_ACTOR@users.noreply.github.com`. |
| commitMessage   | Optional. The commit message. Default is `"Update Website"`.                             |

### Example

```yml
name: CI
on:
  push:
    branches: [master]

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - uses: actions/setup-node@v1
      - name: Install Packages
        run: npm install
      - name: Build
        run: npm run -s build

      # Publish!
      - name: Publish GitHub Pages
        uses: mysticatea-actions/gh-pages@v0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          sourceDir: path/to/built/docs
```

## Development Tools

- `npm test` ... Run tests.
- `npm version <how>` ... Bump a version and release it. The `<how>` is one of `patch`, `minor`, `major`, and etc. See https://docs.npmjs.com/cli/version for details. This will do the following steps:
  1. Check the code with ESLint and TypeScript compiler.
  1. Run tests.
  1. Bump version.
  1. Build the code.
  1. Release it with [scripts/release.ts](scripts/release.ts) script.
- `npm run build` ... Build code then create `dist` directory.
