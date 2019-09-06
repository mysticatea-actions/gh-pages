import * as path from "path"
import * as fs from "fs"
import * as core from "@actions/core"
import { sync as glob } from "glob"
import { cd, rmrf, sh, test } from "./shell"

const inputs = takeInputs()
if (verifyInputs(inputs)) {
    publish(inputs)
}

interface Inputs {
    gitHubRepository: string
    gitHubActor: string
    gitHubToken: string
    sourceDir: string
    commitUserName: string
    commitUserEmail: string
    commitMessage: string
}

function takeInputs(): Inputs {
    const gitHubRepository = process.env.GITHUB_REPOSITORY || ""
    const gitHubActor = process.env.GITHUB_ACTOR || ""
    const gitHubToken = core.getInput("token", { required: true })
    const sourceDir = path.resolve(
        core.getInput("sourceDir", { required: true }),
    )
    const commitUserName = core.getInput("commitUserName") || gitHubActor
    const commitUserEmail =
        core.getInput("commitUserEmail") ||
        `${gitHubActor}@users.noreply.github.com`
    const commitMessage = core.getInput("commitMessage") || "Update Website"

    return {
        commitMessage,
        commitUserEmail,
        commitUserName,
        gitHubActor,
        gitHubRepository,
        gitHubToken,
        sourceDir,
    }
}

function verifyInputs({
    commitMessage,
    commitUserEmail,
    commitUserName,
    gitHubActor,
    gitHubRepository,
    gitHubToken,
    sourceDir,
}: Inputs): boolean {
    if (!gitHubRepository) {
        core.setFailed("Environment variable $GITHUB_REPOSITORY was not found.")
        return false
    }
    if (!gitHubActor) {
        core.setFailed("Environment variable $GITHUB_ACTOR was not found.")
        return false
    }

    for (const [name, value] of [
        ["Environment variable $GITHUB_REPOSITORY", gitHubRepository],
        ["Environment variable $GITHUB_ACTOR", gitHubActor],
        ["Input 'token'", gitHubToken],
        ["Input 'sourceDir'", sourceDir],
        ["Input 'commitUserName'", commitUserName],
        ["Input 'commitUserEmail'", commitUserEmail],
        ["Input 'commitMessage'", commitMessage],
    ]) {
        if (value.endsWith("\\")) {
            core.setFailed(`${name} must not end with a backslash.`)
            return false
        }
        if (value.includes('"')) {
            core.setFailed(`${name} must not contain any double quotes.`)
            return false
        }
    }

    if (!(fs.existsSync(sourceDir) && fs.statSync(sourceDir).isDirectory())) {
        core.setFailed("Input 'sourceDir' must point at a directory.")
        return false
    }
    if (fs.existsSync(path.join(sourceDir, ".git"))) {
        core.setFailed(
            "The directory of input 'sourceDir' must not contain '.git'.",
        )
        return false
    }

    return true
}

function publish({
    commitMessage,
    commitUserEmail,
    commitUserName,
    gitHubActor,
    gitHubRepository,
    gitHubToken,
    sourceDir,
}: Inputs): void {
    const remoteUrl = `https://${gitHubActor}:${gitHubToken}@github.com/${gitHubRepository}.git`

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
