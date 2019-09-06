"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
// TODO: switch to `fs.rmdirSync(x, {recursive: true})`
const rimraf_1 = require("rimraf");
function cd(path) {
    console.log("$ cd", path);
    process.chdir(path);
}
exports.cd = cd;
function sh(command) {
    console.log("$", command);
    child_process_1.execSync(command, { encoding: "utf8", stdio: "inherit" });
}
exports.sh = sh;
function test(command) {
    console.log("$ test", command);
    try {
        child_process_1.execSync(command, { encoding: "utf8", stdio: "inherit" });
        return true;
    }
    catch {
        return false;
    }
}
exports.test = test;
function rmrf(glob) {
    console.log("$ rm -rf", glob);
    rimraf_1.sync(glob);
}
exports.rmrf = rmrf;
//# sourceMappingURL=shell.js.map