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
void (() => {
    // Take inputs.
    const GitHubRepository = process.env.GITHUB_REPOSITORY || "";
    const GitHubActor = process.env.GITHUB_ACTOR || "";
    const GitHubToken = core.getInput("token", { required: true });
    const SourceDir = path.resolve(core.getInput("sourceDir", { required: true }));
    const CommitUserName = core.getInput("commitUserName") || GitHubActor;
    const CommitUserEmail = core.getInput("commitUserEmail") ||
        `${GitHubActor}@users.noreply.github.com`;
    const CommitMessage = core.getInput("commitMessage") || "Update Website";
    const RemoteUrl = `https://${GitHubActor}:${GitHubToken}@github.com/${GitHubRepository}.git`;
    // Verify.
    if (!GitHubRepository) {
        core.setFailed("Environment variable $GITHUB_REPOSITORY was not found.");
        return;
    }
    if (!GitHubActor) {
        core.setFailed("Environment variable $GITHUB_ACTOR was not found.");
        return;
    }
    for (const [name, value] of [
        ["Environment variable $GITHUB_REPOSITORY", GitHubRepository],
        ["Environment variable $GITHUB_ACTOR", GitHubActor],
        ["Input 'token'", GitHubToken],
        ["Input 'sourceDir'", SourceDir],
        ["Input 'commitUserName'", CommitUserName],
        ["Input 'commitUserEmail'", CommitUserEmail],
        ["Input 'commitMessage'", CommitMessage],
    ]) {
        if (value.endsWith("\\")) {
            core.setFailed(`${name} must not end with a backslash.`);
            return;
        }
        if (value.includes('"')) {
            core.setFailed(`${name} must not contain any double quotes.`);
            return;
        }
    }
    if (!(fs.existsSync(SourceDir) && fs.statSync(SourceDir).isDirectory())) {
        core.setFailed("Input 'sourceDir' must point at a directory.");
        return;
    }
    if (fs.existsSync(path.join(SourceDir, ".git"))) {
        core.setFailed("The directory of input 'sourceDir' must not contain '.git'.");
        return;
    }
    // Main.
    shell_1.cd(SourceDir);
    shell_1.sh("git init");
    shell_1.sh(`git config user.name "${CommitUserName}"`);
    shell_1.sh(`git config user.email "${CommitUserEmail}"`);
    shell_1.sh(`git remote add origin "${RemoteUrl}"`);
    // Commit files as an orphan.
    shell_1.sh("git add .");
    if (shell_1.test("git diff --quiet --exit-code --staged")) {
        console.log("No change found.");
        return;
    }
    shell_1.sh(`git commit -m "${CommitMessage}"`);
    // Fetch gh-pages.
    if (shell_1.test("git fetch origin gh-pages")) {
        // Reset files and commit as HEAD of gh-pages.
        shell_1.sh("git checkout gh-pages");
        shell_1.rmrf(glob_1.sync("!(.git)", { dot: true }).join(" "));
        shell_1.sh("git checkout master -- .");
        shell_1.sh("git add .");
        shell_1.sh(`git commit -m "${CommitMessage}"`);
    }
    else {
        // Start gh-pages at the orphan commit if not found.
        shell_1.sh("git checkout -b gh-pages");
    }
    shell_1.sh("git push origin gh-pages");
})();
//# sourceMappingURL=index.js.map