/**
 * Build the action.
 *
 * This script does three things:
 *
 * 1. Build the code with `tsc` to `dist` directory.
 * 2. Copy some files to `dist` directory.
 * 3. Install required npm packages on `dist` directory.
 */
import { cd, cp, rmrf, sh } from "./lib/shell"

const staticFiles = [
    "action.yml",
    "LICENSE",
    "package-lock.json",
    "package.json",
    "README.md",
]

rmrf("dist/*")
sh("tsc -p tsconfig.build.json")
for (const filePath of staticFiles) {
    cp(filePath, `dist/${filePath}`)
}
cd("dist")
sh("npm install --production")
