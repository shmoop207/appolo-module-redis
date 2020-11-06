"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClientFactory = void 0;
const tslib_1 = require("tslib");
const inject_1 = require("@appolo/inject");
let RedisClientFactory = class RedisClientFactory {
    getClient() {
        let client = this.redisClients[0];
        for (let i = 0; i < this.redisClients.length; i++) {
            if (this.redisClients[i].status === "ready") {
                return this.redisClients[i];
            }
        }
        return client;
    }
};
tslib_1.__decorate([
    inject_1.inject()
], RedisClientFactory.prototype, "moduleOptions", void 0);
tslib_1.__decorate([
    inject_1.inject()
], RedisClientFactory.prototype, "redisClients", void 0);
RedisClientFactory = tslib_1.__decorate([
    inject_1.define(),
    inject_1.singleton()
], RedisClientFactory);
exports.RedisClientFactory = RedisClientFactory;
//# sourceMappingURL=redisClientFactory.js.map