"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
const glob_1 = require("glob");
const shell_1 = require("./shell");
const inputs = takeInputs();
if (verifyInputs(inputs)) {
    publish(inputs);
}
function takeInputs() {
    const gitHubRepository = process.env.GITHUB_REPOSITORY || "";
    const gitHubActor = process.env.GITHUB_ACTOR || "";
    const gitHubToken = core.getInput("token", { required: true });
    const sourceDir = path.resolve(core.getInput("sourceDir", { required: true }));
    const commitUserName = core.getInput("commitUserName") || gitHubActor;
    const commitUserEmail = core.getInput("commitUserEmail") ||
        `${gitHubActor}@users.noreply.github.com`;
    const commitMessage = core.getInput("commitMessage") || "Update Website";
    return {
        commitMessage,
        commitUserEmail,
        commitUserName,
        gitHubActor,
        gitHubRepository,
        gitHubToken,
        sourceDir,
    };
}
function verifyInputs({ commitMessage, commitUserEmail, commitUserName, gitHubActor, gitHubRepository, gitHubToken, sourceDir, }) {
    if (!gitHubRepository) {
        core.setFailed("Environment variable $GITHUB_REPOSITORY was not found.");
        return false;
    }
    if (!gitHubActor) {
        core.setFailed("Environment variable $GITHUB_ACTOR was not found.");
        return false;
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
            core.setFailed(`${name} must not end with a backslash.`);
            return false;
        }
        if (value.includes('"')) {
            core.setFailed(`${name} must not contain any double quotes.`);
            return false;
        }
    }
    if (!(fs.existsSync(sourceDir) && fs.statSync(sourceDir).isDirectory())) {
        core.setFailed("Input 'sourceDir' must point at a directory.");
        return false;
    }
    if (fs.existsSync(path.join(sourceDir, ".git"))) {
        core.setFailed("The directory of input 'sourceDir' must not contain '.git'.");
        return false;
    }
    return true;
}
function publish({ commitMessage, commitUserEmail, commitUserName, gitHubActor, gitHubRepository, gitHubToken, sourceDir, }) {
    const remoteUrl = `https://${gitHubActor}:${gitHubToken}@github.com/${gitHubRepository}.git`;
    shell_1.cd(sourceDir);
    shell_1.sh("git init");
    shell_1.sh(`git config user.name "${commitUserName}"`);
    shell_1.sh(`git config user.email "${commitUserEmail}"`);
    shell_1.sh(`git remote add origin "${remoteUrl}"`);
    // Commit files as an orphan.
    if (commitFiles(commitMessage)) {
        if (shell_1.test("git fetch origin gh-pages")) {
            // Rebase the commit to gh-pages HEAD.
            shell_1.sh("git checkout gh-pages");
            shell_1.rmrf(glob_1.sync("!(.git)", { dot: true }).join(" "));
            shell_1.sh("git checkout master -- .");
            commitFiles(commitMessage);
            shell_1.sh("git push origin gh-pages");
        }
        else {
            // Start gh-pages at the orphan commit.
            shell_1.sh("git push origin master:gh-pages");
        }
        return;
    }
    // No content.
    if (shell_1.test("git fetch origin gh-pages")) {
        // Remove files from gh-pages.
        shell_1.sh("git checkout gh-pages");
        shell_1.rmrf(glob_1.sync("!(.git)", { dot: true }).join(" "));
        commitFiles(commitMessage);
        shell_1.sh("git push origin gh-pages");
        return;
    }
    // No content and gh-pages was not found.
    // Create gh-pages with empty commit.
    shell_1.sh(`git commit --allow-empty -m "${commitMessage}"`);
    shell_1.sh("git push origin master:gh-pages");
}
function commitFiles(commitMessage) {
    shell_1.sh("git add .");
    if (!shell_1.test("git diff --quiet --exit-code --staged")) {
        shell_1.sh(`git commit -m "${commitMessage}"`);
        return true;
    }
    return false;
}
//# sourceMappingURL=index.js.map