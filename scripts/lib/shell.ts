import { execSync } from "child_process"
import { copyFileSync } from "fs"

export { cd, rmrf, sh, test } from "../../lib/shell"

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
