"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClientFactory = void 0;
const tslib_1 = require("tslib");
const inject_1 = require("@appolo/inject");
const utils_1 = require("@appolo/utils");
let RedisClientFactory = class RedisClientFactory {
    getClient() {
        if (this.redisClients.length === 1) {
            return this.redisClients[0];
        }
        let client = this.redisClients.find(client => client.status === "ready");
        return client || this.redisClients[0];
    }
    getClientRandom() {
        let clients = this.redisClients;
        return utils_1.Arrays.random(clients);
    }
    getClientHash(key) {
        let clients = this.redisClients;
        let index = utils_1.Hash.strNumHash(key) % clients.length;
        return clients[index] || clients[0];
    }
    getAllClients() {
        return this.redisClients.slice(0);
    }
    getReadyClients() {
        return this.redisClients.filter(client => client.status === "ready");
    }
};
tslib_1.__decorate([
    (0, inject_1.inject)()
], RedisClientFactory.prototype, "moduleOptions", void 0);
tslib_1.__decorate([
    (0, inject_1.inject)()
], RedisClientFactory.prototype, "redisClients", void 0);
RedisClientFactory = tslib_1.__decorate([
    (0, inject_1.define)(),
    (0, inject_1.singleton)()
], RedisClientFactory);
exports.RedisClientFactory = RedisClientFactory;
//# sourceMappingURL=redisClientFactory.js.map