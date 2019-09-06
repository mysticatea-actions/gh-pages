import * as path from "path"
import * as fs from "fs"
import * as core from "@actions/core"
import { sync as glob } from "glob"
import { cd, rmrf, sh, test } from "./shell"

void (() => {
    // Take inputs.
    const GitHubRepository = process.env.GITHUB_REPOSITORY || ""
    const GitHubActor = process.env.GITHUB_ACTOR || ""
    const GitHubToken = core.getInput("token", { required: true })
    const SourceDir = path.resolve(
        core.getInput("sourceDir", { required: true }),
    )
    const CommitUserName = core.getInput("commitUserName") || GitHubActor
    const CommitUserEmail =
        core.getInput("commitUserEmail") ||
        `${GitHubActor}@users.noreply.github.com`
    const CommitMessage = core.getInput("commitMessage") || "Update Website"
    const RemoteUrl = `https://${GitHubActor}:${GitHubToken}@github.com/${GitHubRepository}.git`

    // Verify.
    if (!GitHubRepository) {
        core.setFailed("Environment variable $GITHUB_REPOSITORY was not found.")
        return
    }
    if (!GitHubActor) {
        core.setFailed("Environment variable $GITHUB_ACTOR was not found.")
        return
    }
    for (const [name, value] of [
        ["Environment variable $GITHUB_REPOSITORY", GitHubRepository],
        ["Environment variable $GITHUB_ACTOR", GitHubActor],
        ["Input 'token'", GitHubToken],
        ["Input 'sourceDir'", SourceDir],
        ["Input 'commitUserName'", CommitUserName],
        ["Input 'commitUserEmail'", CommitUserEmail],
        ["Input 'commitMessage'", CommitMessage],
    ]) {
        if (value.endsWith("\\")) {
            core.setFailed(`${name} must not end with a backslash.`)
            return
        }
        if (value.includes('"')) {
            core.setFailed(`${name} must not contain any double quotes.`)
            return
        }
    }
    if (fs.existsSync(path.join(SourceDir, ".git"))) {
        core.setFailed(
            "The directory of input 'sourceDir' must not contain '.git'.",
        )
        return
    }

    // Main.
    cd(SourceDir)
    sh("git init")
    sh(`git config user.name "${CommitUserName}"`)
    sh(`git config user.email "${CommitUserEmail}"`)
    sh(`git remote add origin "${RemoteUrl}"`)

    // Commit files as an orphan.
    sh("git add .")
    sh(`git commit -m "${CommitMessage}"`)
    // Fetch gh-pages.
    if (test("git fetch origin gh-pages")) {
        // Reset files and commit as HEAD of gh-pages.
        sh("git checkout gh-pages")
        rmrf(glob("!(.git)", { dot: true }).join(" "))
        sh("git checkout master -- .")
        sh("git add .")
        sh(`git commit -m "${CommitMessage}"`)
    } else {
        // Start gh-pages at the orphan commit if not found.
        sh("git checkout -b gh-pages")
    }
    sh("git push origin gh-pages")
})()
