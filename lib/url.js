"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUrl = (repo, user, password) => `https://${user}:${password}@github.com/${repo}.git`;
function setGetUrl(f) {
    exports.getUrl = f;
}
exports.setGetUrl = setGetUrl;
//# sourceMappingURL=url.js.map