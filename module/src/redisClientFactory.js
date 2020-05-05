"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = require("appolo/index");
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
    index_1.inject()
], RedisClientFactory.prototype, "moduleOptions", void 0);
tslib_1.__decorate([
    index_1.inject()
], RedisClientFactory.prototype, "redisClients", void 0);
RedisClientFactory = tslib_1.__decorate([
    index_1.define(),
    index_1.singleton()
], RedisClientFactory);
exports.RedisClientFactory = RedisClientFactory;
//# sourceMappingURL=redisClientFactory.js.map