"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const appolo_1 = require("appolo");
let Bootstrap = class Bootstrap {
    async run() {
        await this.scriptsManager.load();
    }
};
tslib_1.__decorate([
    appolo_1.inject()
], Bootstrap.prototype, "scriptsManager", void 0);
Bootstrap = tslib_1.__decorate([
    appolo_1.define(),
    appolo_1.bootstrap()
], Bootstrap);
exports.Bootstrap = Bootstrap;
//# sourceMappingURL=bootstrap.js.map