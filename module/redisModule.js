"use strict";
var RedisModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = void 0;
const tslib_1 = require("tslib");
const engine_1 = require("@appolo/engine");
const redisProvider_1 = require("./src/redisProvider");
let RedisModule = RedisModule_1 = class RedisModule extends engine_1.Module {
    constructor() {
        super(...arguments);
        this.Defaults = { id: "redisProvider" };
    }
    get exports() {
        return [{ id: this.moduleOptions.id, type: redisProvider_1.RedisProvider }];
    }
    static for(options) {
        return { type: RedisModule_1, options };
    }
};
RedisModule = RedisModule_1 = tslib_1.__decorate([
    engine_1.module()
], RedisModule);
exports.RedisModule = RedisModule;
//# sourceMappingURL=redisModule.js.map