/**
 * Release the action (`dist` directory).
 *
 * This script does three things:
 *
 * 1. Make a commit with the content of `dist` directory.
 * 2. Connect the commit to the release branch such as `v0`, `v1`, ..., `vN`.
 * 3. Make a version tag at the commit.
 *
 * If the version was a prerelease version (e.g. `1.0.0-beta.0`), this script
 * skips the step 2. Just makes the version tag at a orphan commit.
 *
 * This script supposes to be run by npm's `postversion` script.
 * This script requires `user.name` and `user.email` in the global config of git.
 */
import { version } from "../package.json"
import { cd, rmrf, sh, stdout, test } from "./lib/shell"

const origin = stdout("git remote get-url origin")
const sha1 = stdout('git log -1 --format="%h"')
const commitMessage = `🔖 ${version} (built with ${sha1})`
const isStable = /^\d+\.\d+\.\d+$/u.test(version)
const vNBranch = `v${version.split(".")[0]}`

// Delete the tag `npm version` created to use it for the release commit.
sh(`git tag -d "v${version}"`)

// Make the release commit that contains only `dist` directory.
cd("./dist")
sh("git init")
try {
    sh(`git remote add origin "${origin}"`)
    sh("git add .")
    sh(`git commit -m "${commitMessage}"`)
    // Push the release to the vN branch (e.g., `v0`, `v1`, ...) if stable.
    if (isStable) {
        if (test(`git fetch origin "${vNBranch}"`)) {
            sh(`git checkout "${vNBranch}"`)
            rmrf("*")
            sh("git checkout master -- .")
            sh("git add .")
            sh(`git commit -m "${commitMessage}"`)
        } else {
            sh(`git checkout -b "${vNBranch}"`)
        }
        sh(`git push origin "${vNBranch}"`)
    }
    // Push the release tag.
    sh(`git tag "v${version}"`)
    sh(`git push origin "v${version}"`)
} finally {
    rmrf(".git")
}

// Fetch the new commit and tag.
cd("..")
if (isStable) {
    sh(`git fetch origin "${vNBranch}" "v${version}"`)
} else {
    sh(`git fetch origin "v${version}"`)
}
