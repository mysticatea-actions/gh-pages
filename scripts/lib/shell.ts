import { execSync } from "child_process"
import { copyFileSync } from "fs"
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

export function stdout(command: string) {
    console.log("$ var = $(", command, ")")
    const retv = execSync(command, {
        encoding: "utf8",
        stdio: ["inherit", "pipe", "inherit"],
    }).trim()
    console.log(retv)
    return retv
}

export function cp(srcPath: string, destPath: string) {
    console.log("$ cp", srcPath, destPath)
    copyFileSync(srcPath, destPath)
}

export function rmrf(glob: string) {
    console.log("$ rm -rf", glob)
    rimraf(glob)
}
