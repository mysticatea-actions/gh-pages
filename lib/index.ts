import * as path from "path"
import * as fs from "fs"
import * as core from "@actions/core"
import { sync as glob } from "glob"
import { cd, rmrf, sh, test } from "./shell"

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

const inputs = takeInputs()
if (verifyInputs(inputs)) {
    publish(inputs)
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

interface Inputs {
    readonly repository: string
    readonly actor: string
    readonly token: string
    readonly sourceDir: string
    readonly commitUserName: string
    readonly commitUserEmail: string
    readonly commitMessage: string
}

function takeInputs(): Inputs {
    const repository = process.env.GITHUB_REPOSITORY || ""
    const actor = process.env.GITHUB_ACTOR || ""
    const token = core.getInput("token", { required: true })
    const sourceDir = path.resolve(
        core.getInput("sourceDir", { required: true }),
    )
    const commitUserName = core.getInput("commitUserName") || actor
    const commitUserEmail =
        core.getInput("commitUserEmail") || `${actor}@users.noreply.github.com`
    const commitMessage = core.getInput("commitMessage") || "Update Website"

    return {
        actor,
        commitMessage,
        commitUserEmail,
        commitUserName,
        repository,
        sourceDir,
        token,
    }
}

function verifyInputs({
    actor,
    commitMessage,
    commitUserEmail,
    commitUserName,
    repository,
    sourceDir,
    token,
}: Inputs): boolean {
    let badInput = false

    if (!repository) {
        core.setFailed("Environment variable $GITHUB_REPOSITORY was not found.")
        badInput = true
    }
    if (!actor) {
        core.setFailed("Environment variable $GITHUB_ACTOR was not found.")
        badInput = true
    }

    for (const [name, value] of [
        ["Environment variable $GITHUB_REPOSITORY", repository],
        ["Environment variable $GITHUB_ACTOR", actor],
        ["Input 'token'", token],
        ["Input 'sourceDir'", sourceDir],
        ["Input 'commitUserName'", commitUserName],
        ["Input 'commitUserEmail'", commitUserEmail],
        ["Input 'commitMessage'", commitMessage],
    ]) {
        if (value.endsWith("\\")) {
            core.setFailed(`${name} must not end with a backslash.`)
            badInput = true
        }
        if (value.includes('"')) {
            core.setFailed(`${name} must not contain any double quotes.`)
            badInput = true
        }
    }

    if (!(fs.existsSync(sourceDir) && fs.statSync(sourceDir).isDirectory())) {
        core.setFailed("Input 'sourceDir' must point at a directory.")
        badInput = true
    }
    if (fs.existsSync(path.join(sourceDir, ".git"))) {
        core.setFailed(
            "The directory of input 'sourceDir' must not contain '.git'.",
        )
        badInput = true
    }

    return !badInput
}

function publish({
    actor,
    commitMessage,
    commitUserEmail,
    commitUserName,
    repository,
    sourceDir,
    token,
}: Inputs): void {
    const remoteUrl = `https://${actor}:${token}@github.com/${repository}.git`

    cd(sourceDir)
    sh("git init")
    sh(`git config user.name "${commitUserName}"`)
    sh(`git config user.email "${commitUserEmail}"`)
    sh(`git remote add origin "${remoteUrl}"`)

    // Commit files as an orphan.
    if (commitFiles(commitMessage)) {
        if (test("git fetch origin gh-pages")) {
            // Rebase the commit to gh-pages HEAD.
            sh("git checkout gh-pages")
            rmrf(glob("!(.git)", { dot: true }).join(" "))
            sh("git checkout master -- .")
            commitFiles(commitMessage)
            sh("git push origin gh-pages")
        } else {
            // Start gh-pages at the orphan commit.
            sh("git push origin master:gh-pages")
        }
        return
    }

    // No content.
    if (test("git fetch origin gh-pages")) {
        // Remove files from gh-pages.
        sh("git checkout gh-pages")
        rmrf(glob("!(.git)", { dot: true }).join(" "))
        commitFiles(commitMessage)
        sh("git push origin gh-pages")
        return
    }

    // No content and gh-pages was not found.
    // Create gh-pages with empty commit.
    sh(`git commit --allow-empty -m "${commitMessage}"`)
    sh("git push origin master:gh-pages")
}

function commitFiles(commitMessage: string): boolean {
    sh("git add .")
    if (!test("git diff --quiet --exit-code --staged")) {
        sh(`git commit -m "${commitMessage}"`)
        return true
    }
    return false
}
