"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const appolo_1 = require("appolo");
const url = require("url");
const appolo_utils_1 = require("appolo-utils");
const Redis = require("ioredis");
let RedisClients = class RedisClients {
    constructor() {
        this.Defaults = { enableReadyCheck: true, lazyConnect: true, keepAlive: 1000 };
    }
    async get() {
        let fallback = this.moduleOptions.fallbackConnections;
        let connections = [this.moduleOptions.connection]
            .concat(fallback && Array.isArray(fallback) ? fallback : []);
        let clients = await Promise.all(connections.map(conn => this.create(conn)));
        await this.scriptsManager.load(clients);
        return clients;
    }
    async create(connection) {
        try {
            let urlParams = url.parse(connection);
            let opts = appolo_utils_1.Objects.defaults(this.moduleOptions.opts || {}, this.Defaults);
            opts.lazyConnect = true;
            if (urlParams.protocol == "rediss:") {
                opts.tls = true;
            }
            let redis = new Redis(this.moduleOptions.connection, opts);
            await redis.connect();
            return redis;
        }
        catch (e) {
            throw e;
        }
    }
};
tslib_1.__decorate([
    appolo_1.inject()
], RedisClients.prototype, "moduleOptions", void 0);
tslib_1.__decorate([
    appolo_1.inject()
], RedisClients.prototype, "scriptsManager", void 0);
RedisClients = tslib_1.__decorate([
    appolo_1.define(),
    appolo_1.singleton(),
    appolo_1.factory()
], RedisClients);
exports.RedisClients = RedisClients;
//# sourceMappingURL=redisClients.js.map