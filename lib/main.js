"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const core = __importStar(require("@actions/core"));
const glob_1 = require("glob");
const shell_1 = require("./shell");
const url_1 = require("./url");
const fs = fs_1.default.promises;
//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------
async function main() {
    try {
        const inputs = takeInputs();
        if (await verifyInputs(inputs)) {
            await publish(inputs);
        }
    }
    catch (error) {
        /*istanbul ignore next */
        core.setFailed((error && error.message) || String(error));
    }
}
exports.main = main;
//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------
function takeInputs() {
    const repository = process.env.GITHUB_REPOSITORY || "";
    const actor = process.env.GITHUB_ACTOR || "";
    const token = core.getInput("token") || "";
    const sourceDir = core.getInput("sourceDir") || "";
    const commitUserName = core.getInput("commitUserName") || actor || "dummy";
    const commitUserEmail = core.getInput("commitUserEmail") || `${actor}@users.noreply.github.com`;
    const commitMessage = core.getInput("commitMessage") || "Update Website";
    return {
        actor,
        commitMessage,
        commitUserEmail,
        commitUserName,
        repository,
        sourceDir: sourceDir && path_1.default.resolve(sourceDir),
        token,
    };
}
async function verifyInputs({ actor, commitMessage, commitUserEmail, commitUserName, repository, sourceDir, token, }) {
    let badInput = false;
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
            core.setFailed(`${name} was not found.`);
            badInput = true;
        }
    }
    if (sourceDir && !(await isDirectory(sourceDir))) {
        core.setFailed("Input 'sourceDir' must point at a directory.");
        badInput = true;
    }
    if (sourceDir && (await exists(path_1.default.join(sourceDir, ".git")))) {
        core.setFailed("The directory of input 'sourceDir' must not contain '.git'.");
        badInput = true;
    }
    return !badInput;
}
async function isDirectory(filePath) {
    try {
        return (await fs.stat(filePath)).isDirectory();
    }
    catch {
        return false;
    }
}
async function exists(filePath) {
    try {
        await fs.stat(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function publish({ actor, commitMessage, commitUserEmail, commitUserName, repository, sourceDir, token, }) {
    const repoUrl = url_1.getUrl(repository, actor, token);
    shell_1.cd(sourceDir);
    await shell_1.git("init");
    try {
        await shell_1.git(`config user.name ${quote(commitUserName)}`);
        await shell_1.git(`config user.email ${quote(commitUserEmail)}`);
        await shell_1.git(`remote add origin ${quote(repoUrl)}`);
        // Commit files as an orphan.
        if (await commitFiles(commitMessage)) {
            if (await shell_1.testGit("fetch origin gh-pages")) {
                // Rebase the commit to gh-pages HEAD.
                await shell_1.git("checkout gh-pages");
                await removeFiles();
                await shell_1.git("checkout master -- .");
                await commitFiles(commitMessage);
                await shell_1.git("push origin gh-pages");
            }
            else {
                // Start gh-pages at the orphan commit.
                await shell_1.git("push origin master:gh-pages");
            }
            return;
        }
        // No content.
        if (await shell_1.testGit("fetch origin gh-pages")) {
            // Remove files from gh-pages.
            await shell_1.git("checkout gh-pages");
            await removeFiles();
            await commitFiles(commitMessage);
            await shell_1.git("push origin gh-pages");
            return;
        }
        // No content and gh-pages was not found.
        // Create gh-pages with empty commit.
        await shell_1.git(`commit --allow-empty -m ${quote(commitMessage)}`);
        await shell_1.git("push origin master:gh-pages");
    }
    finally {
        // Cleanup the temporary git.
        try {
            await shell_1.rmrf(".git");
        }
        catch {
            // Ignore.
        }
    }
}
async function removeFiles() {
    await Promise.all(glob_1.sync("!(.git)", { dot: true }).map(filePath => shell_1.rmrf(filePath)));
}
async function commitFiles(commitMessage) {
    await shell_1.git("add .");
    if (!(await shell_1.testGit("diff --quiet --exit-code --staged"))) {
        await shell_1.git(`commit -m ${quote(commitMessage)}`);
        return true;
    }
    return false;
}
function quote(s) {
    // "@actions/exec" looks handling this.
    // if (process.platform === "win32") {
    //     return `"${s.replace(/"/gu, '""')}"`
    // }
    return `"${s.replace(/["\\]/gu, "\\$&")}"`;
}
//# sourceMappingURL=main.js.map