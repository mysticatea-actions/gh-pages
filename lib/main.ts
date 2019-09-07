import path from "path"
import fs0 from "fs"
import * as core from "@actions/core"
import { sync as glob } from "glob"
import { Inputs } from "./inputs"
import { cd, git, testGit, rmrf } from "./shell"
import { getUrl } from "./url"

const fs = fs0.promises

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

export async function main(): Promise<void> {
    try {
        const inputs = takeInputs()
        if (await verifyInputs(inputs)) {
            await publish(inputs)
        }
    } catch (error) {
        /*istanbul ignore next */
        core.setFailed((error && error.message) || String(error))
    }
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

function takeInputs(): Inputs {
    const repository = process.env.GITHUB_REPOSITORY || ""
    const actor = process.env.GITHUB_ACTOR || ""
    const token = core.getInput("token") || ""
    const sourceDir = core.getInput("sourceDir") || ""
    const commitUserName = core.getInput("commitUserName") || actor || "dummy"
    const commitUserEmail =
        core.getInput("commitUserEmail") || `${actor}@users.noreply.github.com`
    const commitMessage = core.getInput("commitMessage") || "Update Website"

    return {
        actor,
        commitMessage,
        commitUserEmail,
        commitUserName,
        repository,
        sourceDir: sourceDir && path.resolve(sourceDir),
        token,
    }
}

async function verifyInputs({
    actor,
    commitMessage,
    commitUserEmail,
    commitUserName,
    repository,
    sourceDir,
    token,
}: Inputs): Promise<boolean> {
    let badInput = false

    for (const [name, value] of [
        ["Environment variable $GITHUB_REPOSITORY", repository],
        ["Environment variable $GITHUB_ACTOR", actor],
        ["Input 'token'", token],
        ["Input 'sourceDir'", sourceDir],
        ["Input 'commitUserName'", commitUserName],
        ["Input 'commitUserEmail'", commitUserEmail],
        ["Input 'commitMessage'", commitMessage],
    ]) {
        if (!value) {
            core.setFailed(`${name} was not found.`)
            badInput = true
        }
    }

    if (sourceDir && !(await isDirectory(sourceDir))) {
        core.setFailed("Input 'sourceDir' must point at a directory.")
        badInput = true
    }
    if (sourceDir && (await exists(path.join(sourceDir, ".git")))) {
        core.setFailed(
            "The directory of input 'sourceDir' must not contain '.git'.",
        )
        badInput = true
    }

    return !badInput
}

async function isDirectory(filePath: string): Promise<boolean> {
    try {
        return (await fs.stat(filePath)).isDirectory()
    } catch {
        return false
    }
}

async function exists(filePath: string): Promise<boolean> {
    try {
        await fs.stat(filePath)
        return true
    } catch {
        return false
    }
}

async function publish({
    actor,
    commitMessage,
    commitUserEmail,
    commitUserName,
    repository,
    sourceDir,
    token,
}: Inputs): Promise<void> {
    const repoUrl = getUrl(repository, actor, token)

    cd(sourceDir)

    await git("init")
    try {
        await git(`config user.name ${quote(commitUserName)}`)
        await git(`config user.email ${quote(commitUserEmail)}`)
        await git(`remote add origin ${quote(repoUrl)}`)

        // Commit files as an orphan.
        if (await commitFiles(commitMessage)) {
            if (await testGit("fetch origin gh-pages")) {
                // Rebase the commit to gh-pages HEAD.
                await git("checkout gh-pages")
                await removeFiles()
                await git("checkout master -- .")
                await commitFiles(commitMessage)
                await git("push origin gh-pages")
            } else {
                // Start gh-pages at the orphan commit.
                await git("push origin master:gh-pages")
            }
            return
        }

        // No content.
        if (await testGit("fetch origin gh-pages")) {
            // Remove files from gh-pages.
            await git("checkout gh-pages")
            await removeFiles()
            await commitFiles(commitMessage)
            await git("push origin gh-pages")
            return
        }

        // No content and gh-pages was not found.
        // Create gh-pages with empty commit.
        await git(`commit --allow-empty -m ${quote(commitMessage)}`)
        await git("push origin master:gh-pages")
    } finally {
        // Cleanup the temporary git.
        try {
            await rmrf(".git")
        } catch {
            // Ignore.
        }
    }
}

async function removeFiles(): Promise<void> {
    await Promise.all(
        glob("!(.git)", { dot: true }).map(filePath => rmrf(filePath)),
    )
}

async function commitFiles(commitMessage: string): Promise<boolean> {
    await git("add .")
    if (!(await testGit("diff --quiet --exit-code --staged"))) {
        await git(`commit -m ${quote(commitMessage)}`)
        return true
    }
    return false
}

function quote(s: string): string {
    // "@actions/exec" looks handling this.
    // if (process.platform === "win32") {
    //     return `"${s.replace(/"/gu, '""')}"`
    // }
    return `"${s.replace(/["\\]/gu, "\\$&")}"`
}
