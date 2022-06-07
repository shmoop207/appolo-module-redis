"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClients = void 0;
const tslib_1 = require("tslib");
const inject_1 = require("@appolo/inject");
const utils_1 = require("@appolo/utils");
const ioredis_1 = require("ioredis");
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
            let conn = new URL(connection);
            let opts = utils_1.Objects.defaults({}, this.moduleOptions.opts || {}, this.Defaults);
            opts.lazyConnect = true;
            if (conn.protocol == "rediss:") {
                opts.tls = true;
            }
            opts.host = conn.hostname;
            opts.port = parseInt(conn.port);
            opts.password = conn.password;
            let redis = new ioredis_1.default(opts);
            await redis.connect();
            return redis;
        }
        catch (e) {
            throw e;
        }
    }
};
tslib_1.__decorate([
    (0, inject_1.inject)()
], RedisClients.prototype, "moduleOptions", void 0);
tslib_1.__decorate([
    (0, inject_1.inject)()
], RedisClients.prototype, "scriptsManager", void 0);
RedisClients = tslib_1.__decorate([
    (0, inject_1.define)(),
    (0, inject_1.singleton)(),
    (0, inject_1.factory)()
], RedisClients);
exports.RedisClients = RedisClients;
//# sourceMappingURL=redisClients.js.map