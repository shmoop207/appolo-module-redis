"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = require("appolo/index");
const redisProvider_1 = require("./src/redisProvider");
let RedisModule = class RedisModule extends index_1.Module {
    constructor(options) {
        super(options);
        this.Defaults = { id: "redisProvider" };
    }
    get exports() {
        return [{ id: this.moduleOptions.id, type: redisProvider_1.RedisProvider }];
    }
};
RedisModule = tslib_1.__decorate([
    index_1.module()
], RedisModule);
exports.RedisModule = RedisModule;
//# sourceMappingURL=redisModule.js.map