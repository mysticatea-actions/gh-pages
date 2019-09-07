export let getUrl = (repo: string, user: string, password: string) =>
    `https://${user}:${password}@github.com/${repo}.git`

export function setGetUrl(f: typeof getUrl): void {
    getUrl = f
}
