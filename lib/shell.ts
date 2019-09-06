import { execSync } from "child_process"
// TODO: switch to `fs.rmdirSync(x, {recursive: true})`
import { sync as rimraf } from "rimraf"

export function cd(path: string) {
    console.log("$ cd", path)
    process.chdir(path)
}

export function sh(command: string) {
    console.log("$", command)
    execSync(command, { encoding: "utf8", stdio: "inherit" })
}

export function test(command: string) {
    console.log("$ test", command)
    try {
        execSync(command, { encoding: "utf8", stdio: "inherit" })
        return true
    } catch {
        return false
    }
}

export function rmrf(glob: string) {
    console.log("$ rm -rf", glob)
    rimraf(glob)
}
