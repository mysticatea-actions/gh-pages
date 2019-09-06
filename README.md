# Action Template

[![Build Status](https://github.com/mysticatea-actions/template/workflows/CI/badge.svg)](https://github.com/mysticatea-actions/template/actions)
[![Dependency Status](https://david-dm.org/mysticatea-actions/template.svg)](https://david-dm.org/mysticatea-actions/template)

This is a template for GitHub Actions with TypeScript.

## File Structure

```
<root>
├ dist    ... Built result.
├ lib     ... Source code.
├ scripts ... Development tools.
└ test    ... Test code.
```

## Development Tools

-   `npm test` ... Run tests.
-   `npm version <how>` ... Bump a version and release it. The `<how>` is one of `patch`, `minor`, `major`, and etc. See https://docs.npmjs.com/cli/version for details. This will do the following steps:
    1. Check the code with ESLint and TypeScript compiler.
    1. Run tests.
    1. Bump version.
    1. Build the code.
    1. Release it with [scripts/release.ts](scripts/release.ts) script.
-   `npm run build` ... Build code then create `dist` directory.
