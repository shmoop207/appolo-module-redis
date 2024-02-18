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
        var _a;
        let connections = [];
        if ((_a = this.moduleOptions.clusterConnections) === null || _a === void 0 ? void 0 : _a.length) {
            connections = this.moduleOptions.clusterConnections;
        }
        else {
            let fallback = this.moduleOptions.fallbackConnections;
            connections = [this.moduleOptions.connection]
                .concat(fallback && Array.isArray(fallback) ? fallback : []);
        }
        let clients = await Promise.all(connections.map(conn => this.create(conn)));
        await this.scriptsManager.load(clients);
        return clients;
    }
    async create(connection) {
        let redis;
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
            redis = new ioredis_1.default(opts);
            redis.on("error", (e) => {
                this.moduleOptions.logErrors && this.logger.error("redis error", { e, id: this.moduleOptions.id });
            });
            let promise = redis.connect();
            if (this.moduleOptions.connectTimeout) {
                promise = utils_1.Promises.timeout(promise, this.moduleOptions.connectTimeout);
            }
            await promise;
            return redis;
        }
        catch (e) {
            if (redis && this.moduleOptions.connectOnError) {
                return redis;
            }
            throw e;
        }
    }
};
tslib_1.__decorate([
    (0, inject_1.inject)()
], RedisClients.prototype, "moduleOptions", void 0);
tslib_1.__decorate([
    (0, inject_1.inject)()
], RedisClients.prototype, "logger", void 0);
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