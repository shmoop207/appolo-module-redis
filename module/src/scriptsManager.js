"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptsManager = void 0;
const tslib_1 = require("tslib");
const appolo_1 = require("appolo");
const Q = require("bluebird");
const path = require("path");
const fs = require("fs");
let ScriptsManager = class ScriptsManager {
    constructor() {
        this.Scripts = [{
                name: "get_by_expire", path: path.resolve(__dirname, "../lua/getByExpire.lua"), args: 1
            }, {
                name: "lock", path: path.resolve(__dirname, "../lua/lock.lua"), args: 1
            }];
    }
    async load(clients) {
        let scripts = (this.moduleOptions.scripts || []).concat(this.Scripts);
        await Q.map(scripts, async (script) => {
            if (!script.lua && !script.path) {
                throw new Error(`path or lua must be defined for script name ${name}`);
            }
            let lua = script.lua;
            if (!lua) {
                lua = await this._loadPath(script.path);
            }
            this._defineCommand(clients, script, lua);
        });
    }
    _defineCommand(clients, script, lua) {
        for (let i = 0; i < clients.length; i++) {
            let client = clients[i];
            if (client[script.name]) {
                continue;
            }
            client.defineCommand(script.name, {
                numberOfKeys: script.args,
                lua: lua
            });
        }
    }
    _loadPath(file) {
        return Q.fromCallback(c => fs.readFile(path.resolve(process.cwd(), file), { encoding: "utf8" }, c));
    }
};
tslib_1.__decorate([
    appolo_1.inject()
], ScriptsManager.prototype, "moduleOptions", void 0);
ScriptsManager = tslib_1.__decorate([
    appolo_1.define(),
    appolo_1.singleton()
], ScriptsManager);
exports.ScriptsManager = ScriptsManager;
//# sourceMappingURL=scriptsManager.js.map