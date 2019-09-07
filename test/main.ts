import assert from "assert"
import { promises as fs } from "fs"
import path from "path"
import util from "util"
import rimraf0 from "rimraf"
import { Inputs } from "../lib/inputs"
import { assertIncludes, git, initFiles, runAction } from "./lib/util"

const rimraf = util.promisify(rimraf0)

const testRoot = path.resolve(__dirname, "../.test-workspace")
const remoteRepo = path.join(testRoot, "remote")
const localRepo = path.join(testRoot, "local")
const testInputs: Inputs = {
    actor: "tester",
    commitMessage: "[test] Update Website",
    commitUserEmail: "test@example.com",
    commitUserName: "test user",
    repository: "te/st",
    sourceDir: "docs",
    token: "12345678",
}

describe("mysticatea-actions/gh-pages", () => {
    let cwd: string
    let result: runAction.Result

    beforeEach(async () => {
        cwd = process.cwd()

        // Setup repositries for tests.
        await fs.mkdir(remoteRepo, { recursive: true })
        process.chdir(remoteRepo)
        await git("init --bare --share")
        process.chdir(testRoot)
        await git(`clone "${remoteRepo}" local`)
        process.chdir(localRepo)
    })
    afterEach(async () => {
        // Cleanup.
        process.chdir(cwd)
        await rimraf(testRoot)
    })

    describe("if '$GITHUB_ACTOR' variable was missing,", () => {
        beforeEach(async () => {
            result = await runAction({
                ...testInputs,
                actor: undefined,
            })
        })
        it("should print an error message.", () => {
            assertIncludes(result.stdout, "$GITHUB_ACTOR was not found")
        })
        it("should fail.", () => {
            assert.notStrictEqual(result.exitCode, 0)
        })
    })

    describe("if '$GITHUB_REPOSITORY' variable was missing,", () => {
        beforeEach(async () => {
            result = await runAction({
                ...testInputs,
                repository: undefined,
            })
        })
        it("should print an error message.", () => {
            assertIncludes(result.stdout, "$GITHUB_REPOSITORY was not found")
        })
        it("should fail.", () => {
            assert.notStrictEqual(result.exitCode, 0)
        })
    })

    describe("if 'token' parameter was missing,", () => {
        beforeEach(async () => {
            result = await runAction({
                ...testInputs,
                token: undefined,
            })
        })
        it("should print an error message.", () => {
            assertIncludes(result.stdout, "'token' was not found")
        })
        it("should fail.", () => {
            assert.notStrictEqual(result.exitCode, 0)
        })
    })

    describe("if 'sourceDir' parameter was missing,", () => {
        beforeEach(async () => {
            result = await runAction({
                ...testInputs,
                sourceDir: undefined,
            })
        })
        it("should print an error message.", () => {
            assertIncludes(result.stdout, "'sourceDir' was not found")
        })
        it("should fail.", () => {
            assert.notStrictEqual(result.exitCode, 0)
        })
    })

    describe("if 'sourceDir' parameter didn't point any files,", () => {
        beforeEach(async () => {
            result = await runAction(testInputs)
        })
        it("should print an error message.", () => {
            assertIncludes(
                result.stdout,
                "'sourceDir' must point at a directory",
            )
        })
        it("should fail.", () => {
            assert.notStrictEqual(result.exitCode, 0)
        })
    })

    describe("if 'sourceDir' parameter pointed a file,", () => {
        beforeEach(async () => {
            await initFiles({
                docs: "",
            })
            result = await runAction(testInputs)
        })
        it("should print an error message.", () => {
            assertIncludes(
                result.stdout,
                "'sourceDir' must point at a directory",
            )
        })
        it("should fail.", () => {
            assert.notStrictEqual(result.exitCode, 0)
        })
    })

    describe("if the directory 'sourceDir' parameter pointed contains '.git',", () => {
        beforeEach(async () => {
            await initFiles({
                "docs/.git/HEAD": "",
                "docs/.keep": "",
            })
            result = await runAction(testInputs)
        })
        it("should print an error message.", () => {
            assertIncludes(
                result.stdout,
                "The directory of input 'sourceDir' must not contain '.git'",
            )
        })
        it("should fail.", () => {
            assert.notStrictEqual(result.exitCode, 0)
        })
    })

    describe("if 'commitUserName' parameter was missing,", () => {
        beforeEach(async () => {
            await initFiles({
                "docs/.keep": "",
            })
            result = await runAction({
                ...testInputs,
                commitUserName: undefined,
            })
        })
        it("should use '$GITHUB_ACTOR' instead.", async () => {
            await git("fetch origin gh-pages")
            await git("checkout gh-pages")
            const authorName = await git("log -1 --format=%an")
            assert.strictEqual(authorName, testInputs.actor)
        })
        it("should succeed.", () => {
            assert.strictEqual(result.exitCode, 0)
        })
    })

    describe("if 'commitUserName' parameter was present,", () => {
        beforeEach(async () => {
            await initFiles({
                "docs/.keep": "",
            })
            result = await runAction(testInputs)
        })
        it("should use it.", async () => {
            await git("fetch origin gh-pages")
            await git("checkout gh-pages")
            const authorName = await git("log -1 --format=%an")
            assert.strictEqual(authorName, testInputs.commitUserName)
        })
        it("should succeed.", () => {
            assert.strictEqual(result.exitCode, 0)
        })
    })

    describe("if 'commitUserEmail' parameter was missing,", () => {
        beforeEach(async () => {
            await initFiles({
                "docs/.keep": "",
            })
            result = await runAction({
                ...testInputs,
                commitUserEmail: undefined,
            })
        })
        it("should use '$GITHUB_ACTOR@users.noreply.github.com' instead.", async () => {
            await git("fetch origin gh-pages")
            await git("checkout gh-pages")
            const authorEmail = await git("log -1 --format=%ae")
            assert.strictEqual(
                authorEmail,
                `${testInputs.actor}@users.noreply.github.com`,
            )
        })
        it("should succeed.", () => {
            assert.strictEqual(result.exitCode, 0)
        })
    })

    describe("if 'commitUserEmail' parameter was present,", () => {
        beforeEach(async () => {
            await initFiles({
                "docs/.keep": "",
            })
            result = await runAction(testInputs)
        })
        it("should use it.", async () => {
            await git("fetch origin gh-pages")
            await git("checkout gh-pages")
            const authorEmail = await git("log -1 --format=%ae")
            assert.strictEqual(authorEmail, testInputs.commitUserEmail)
        })
        it("should succeed.", () => {
            assert.strictEqual(result.exitCode, 0)
        })
    })

    describe("if 'commitMessage' parameter was missing,", () => {
        beforeEach(async () => {
            await initFiles({
                "docs/.keep": "",
            })
            result = await runAction({
                ...testInputs,
                commitMessage: undefined,
            })
        })
        it("should use 'Update Website' instead.", async () => {
            await git("fetch origin gh-pages")
            await git("checkout gh-pages")
            const body = await git("log -1 --format=%B")
            assert.strictEqual(body, "Update Website")
        })
        it("should succeed.", () => {
            assert.strictEqual(result.exitCode, 0)
        })
    })

    describe("if 'commitMessage' parameter was present,", () => {
        beforeEach(async () => {
            await initFiles({
                "docs/.keep": "",
            })
            result = await runAction(testInputs)
        })
        it("should use it.", async () => {
            await git("fetch origin gh-pages")
            await git("checkout gh-pages")
            const body = await git("log -1 --format=%B")
            assert.strictEqual(body, testInputs.commitMessage)
        })
        it("should succeed.", () => {
            assert.strictEqual(result.exitCode, 0)
        })
    })

    describe("if 'commitMessage' parameter contained double quotes,", () => {
        const commitMessage = 'Contain "quotes"'

        beforeEach(async () => {
            await initFiles({
                "docs/.keep": "",
            })
            result = await runAction({
                ...testInputs,
                commitMessage,
            })
        })
        it("should use it.", async () => {
            await git("fetch origin gh-pages")
            await git("checkout gh-pages")
            const body = await git("log -1 --format=%B")
            assert.strictEqual(body, commitMessage)
        })
        it("should succeed.", () => {
            assert.strictEqual(result.exitCode, 0)
        })
    })

    xdescribe("if 'commitMessage' parameter contained backslashes,", () => {
        const commitMessage = "Contain \\backslash\\"

        beforeEach(async () => {
            await initFiles({
                "docs/.keep": "",
            })
            result = await runAction({
                ...testInputs,
                commitMessage,
            })
        })
        it("should use it.", async () => {
            await git("fetch origin gh-pages")
            await git("checkout gh-pages")
            const body = await git("log -1 --format=%B")
            assert.strictEqual(body, commitMessage)
        })
        it("should succeed.", () => {
            assert.strictEqual(result.exitCode, 0)
        })
    })

    describe("if gh-pages didn't exist,", () => {
        describe("if the source was empty,", () => {
            beforeEach(async () => {
                await fs.mkdir("docs")
                result = await runAction(testInputs)
            })
            it("should push an empty orphan commit to gh-pages.", async () => {
                await git("fetch origin gh-pages")
                await git("checkout gh-pages")
                const lsTree = await git("ls-tree --name-only -r gh-pages")
                const files = lsTree.split("\n").filter(Boolean)
                assert.deepStrictEqual(files, [])
            })
            it("should succeed.", () => {
                assert.strictEqual(result.exitCode, 0)
            })
        })

        describe("if the source was some files,", () => {
            beforeEach(async () => {
                await initFiles({
                    "docs/a.txt": "hello",
                    "docs/b.txt": "world",
                })
                result = await runAction(testInputs)
            })
            it("should push those files to gh-pages.", async () => {
                await git("fetch origin gh-pages")
                await git("checkout gh-pages")
                const lsTree = await git("ls-tree --name-only -r HEAD")
                const files = lsTree.split("\n").filter(Boolean)
                assert.deepStrictEqual(files, ["a.txt", "b.txt"])
            })
            it("should succeed.", () => {
                assert.strictEqual(result.exitCode, 0)
            })
        })
    })

    describe("if gh-pages existed but empty,", () => {
        beforeEach(async () => {
            await fs.mkdir("docs")
            await runAction(testInputs)
        })

        describe("if the source was empty,", () => {
            beforeEach(async () => {
                result = await runAction(testInputs)
            })
            it("should not push because of not changed.", async () => {
                await git("fetch origin gh-pages")
                await git("checkout gh-pages")
                const count = await git("rev-list --count gh-pages")
                assert.deepStrictEqual(count, "1")
            })
            it("should succeed.", () => {
                assert.strictEqual(result.exitCode, 0)
            })
        })

        describe("if the source was some files,", () => {
            beforeEach(async () => {
                await initFiles({
                    "docs/a.txt": "hello",
                    "docs/b.txt": "world",
                })
                result = await runAction(testInputs)
            })
            it("should push those files to gh-pages.", async () => {
                await git("fetch origin gh-pages")
                await git("checkout gh-pages")
                const lsTree = await git("ls-tree --name-only -r HEAD")
                const files = lsTree.split("\n").filter(Boolean)
                assert.deepStrictEqual(files, ["a.txt", "b.txt"])
            })
            it("should succeed.", () => {
                assert.strictEqual(result.exitCode, 0)
            })
        })
    })

    describe("if gh-pages existed,", () => {
        beforeEach(async () => {
            await initFiles({
                "docs/a.txt": "hello",
                "docs/b.txt": "world",
            })
            await runAction(testInputs)
        })

        describe("if the source was empty,", () => {
            beforeEach(async () => {
                await fs.unlink("docs/a.txt")
                await fs.unlink("docs/b.txt")
                await git("add .")
                await git('commit -m "remove docs"')
                result = await runAction(testInputs)
            })
            it("should push those changes.", async () => {
                await git("fetch origin gh-pages")
                await git("checkout gh-pages")
                const lsTree = await git("ls-tree --name-only -r HEAD")
                const files = lsTree.split("\n").filter(Boolean)
                assert.deepStrictEqual(files, [])
            })
            it("should succeed.", () => {
                assert.strictEqual(result.exitCode, 0)
            })
        })

        describe("if the source was not changed,", () => {
            beforeEach(async () => {
                result = await runAction(testInputs)
            })
            it("should keep files as-is.", async () => {
                await git("fetch origin gh-pages")
                await git("checkout gh-pages")
                const lsTree = await git("ls-tree --name-only -r HEAD")
                const files = lsTree.split("\n").filter(Boolean)
                assert.deepStrictEqual(files, ["a.txt", "b.txt"])
            })
            it("should not push because of not changed.", async () => {
                await git("fetch origin gh-pages")
                await git("checkout gh-pages")
                const count = await git("rev-list --count gh-pages")
                assert.deepStrictEqual(count, "1")
            })
            it("should succeed.", () => {
                assert.strictEqual(result.exitCode, 0)
            })
        })

        describe("if the source was changed,", () => {
            beforeEach(async () => {
                await fs.unlink("docs/a.txt")
                await initFiles({
                    "docs/b.txt": "modified",
                    "docs/c.txt": "created",
                })
                result = await runAction(testInputs)
            })
            it("should push those changes to gh-pages.", async () => {
                await git("fetch origin gh-pages")
                await git("checkout gh-pages")
                const lsTree = await git("ls-tree --name-only -r HEAD")
                const files = lsTree.split("\n").filter(Boolean)
                assert.deepStrictEqual(files, ["b.txt", "c.txt"])
            })
            it("should succeed.", () => {
                assert.strictEqual(result.exitCode, 0)
            })
        })
    })
})
