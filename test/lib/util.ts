import assert from "assert"
import { promises as fs } from "fs"
import path from "path"
import util from "util"
import { exec } from "@actions/exec"
import { Inputs } from "../../lib/inputs"
import { main } from "../../lib/main"
import { getUrl as originalGetUrl0, setGetUrl } from "../../lib/url"

const remoteRepo = path.resolve(__dirname, "../../.test-workspace/remote")
const originalGetUrl = originalGetUrl0

/*eslint-disable require-atomic-updates, @mysticatea/ts/unbound-method */

export async function runAction(
    inputs: Partial<Inputs>,
): Promise<runAction.Result> {
    const originalCwd = process.cwd()
    const originalExitCode = process.exitCode
    const originalEnv = { ...process.env }
    const originalStdoutWrite = process.stdout.write
    let stdout = ""

    for (const [key, value] of [
        ["GITHUB_ACTOR", inputs.actor],
        ["GITHUB_REPOSITORY", inputs.repository],
        ["INPUT_TOKEN", inputs.token],
        ["INPUT_SOURCEDIR", inputs.sourceDir],
        ["INPUT_COMMITUSERNAME", inputs.commitUserName],
        ["INPUT_COMMITUSEREMAIL", inputs.commitUserEmail],
        ["INPUT_COMMITMESSAGE", inputs.commitMessage],
    ]) {
        if (value != null) {
            process.env[key!] = value
        } else {
            delete process.env[key!]
        }
    }

    process.stdout.write = (chunk: string | Uint8Array) => {
        stdout += String(chunk)
        return true
    }
    setGetUrl(() => remoteRepo)

    try {
        await main()
        return { exitCode: process.exitCode || 0, stdout }
    } finally {
        setGetUrl(originalGetUrl)
        process.stdout.write = originalStdoutWrite
        process.exitCode = originalExitCode
        process.chdir(originalCwd)

        for (const key of [
            "GITHUB_ACTOR",
            "GITHUB_REPOSITORY",
            "INPUT_TOKEN",
            "INPUT_SOURCEDIR",
            "INPUT_COMMITUSERNAME",
            "INPUT_COMMITUSEREMAIL",
            "INPUT_COMMITMESSAGE",
        ]) {
            const value = originalEnv[key]
            if (value != null) {
                process.env[key] = value
            } else {
                delete process.env[key]
            }
        }
    }
}
export namespace runAction {
    export interface Result {
        exitCode: number
        stdout: string
    }
}

/*eslint-enable require-atomic-updates, @mysticatea/ts/unbound-method */

export async function git(args: string): Promise<string> {
    const chunks: Buffer[] = []
    await exec(`git ${args}`, undefined, {
        silent: true,
        listeners: {
            stdout: chunk => chunks.push(chunk),
        },
    })
    return Buffer.concat(chunks)
        .toString()
        .trim()
}

export function assertIncludes(actual: string, expected: string): void {
    assert(
        actual.includes(expected),
        util.format(
            "%j should be included in %s",
            expected,
            actual || "(empty string)",
        ),
    )
}

export async function initFiles(files: Record<string, string>): Promise<void> {
    await Promise.all(
        Object.entries(files).map(async ([filename, content]) => {
            const filePath = path.resolve(filename)
            const dirPath = path.dirname(filePath)
            try {
                await fs.mkdir(dirPath, { recursive: true })
            } catch {
                // Ignore.
            }
            await fs.writeFile(filename, content)
        }),
    )
    await git("add .")
    await git('commit -m "init"')
    await git("push origin master")
}
