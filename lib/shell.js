"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = __importDefault(require("util"));
const exec_1 = require("@actions/exec");
// TODO: switch to `fs.rmdir(x, {recursive: true})`
const rimraf_1 = __importDefault(require("rimraf"));
const rimraf = util_1.default.promisify(rimraf_1.default);
function cd(path) {
    console.log("$ cd", path);
    process.chdir(path);
}
exports.cd = cd;
async function git(args) {
    console.log("$ git", args);
    await exec_1.exec(`git ${args}`, undefined, {
        silent: true,
        listeners: {
            stdout: chunk => process.stdout.write(chunk),
            stderr: chunk => process.stdout.write(chunk),
        },
    });
}
exports.git = git;
async function testGit(args) {
    try {
        await git(args);
        return true;
    }
    catch {
        return false;
    }
}
exports.testGit = testGit;
async function rmrf(glob) {
    console.log("$ rm -rf", glob);
    await rimraf(glob);
}
exports.rmrf = rmrf;
//# sourceMappingURL=shell.js.map