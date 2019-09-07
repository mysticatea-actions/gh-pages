import assert from "assert"
import { getUrl } from "../lib/url"

describe("getUrl", () => {
    //eslint-disable-next-line no-template-curly-in-string
    it("should return `https://${user}:${password}@github.com/${repo}.git`", () => {
        const url = getUrl("REPO", "USER", "PASS")
        assert.strictEqual(url, "https://USER:PASS@github.com/REPO.git")
    })
})
