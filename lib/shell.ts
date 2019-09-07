import util from "util"
import { exec } from "@actions/exec"
// TODO: switch to `fs.rmdir(x, {recursive: true})`
import rimrafc from "rimraf"

const rimraf = util.promisify(rimrafc)

export function cd(path: string): void {
    console.log("$ cd", path)
    process.chdir(path)
}

export async function git(args: string): Promise<void> {
    console.log("$ git", args)
    await exec(`git ${args}`, undefined, {
        silent: true,
        listeners: {
            stdout: chunk => process.stdout.write(chunk),
            stderr: chunk => process.stdout.write(chunk),
        },
    })
}

export async function testGit(args: string): Promise<boolean> {
    try {
        await git(args)
        return true
    } catch {
        return false
    }
}

export async function rmrf(glob: string): Promise<void> {
    console.log("$ rm -rf", glob)
    await rimraf(glob)
}
